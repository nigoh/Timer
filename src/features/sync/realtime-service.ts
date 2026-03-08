import { supabase } from '@/lib/supabase';
import { SYNC_STORE_KEYS, SyncStoreKey } from '@/types/sync';
import { logger } from '@/utils/logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

/** 現在のタブを識別するセッション ID（エコー防止） */
const TAB_SESSION_ID = crypto.randomUUID();

let channel: RealtimeChannel | null = null;

/**
 * Supabase Realtime で sync_data の変更を購読する。
 * 他タブ・他デバイスの変更を受け取り、localStorage を更新する。
 */
export function subscribe(userId: string): void {
  if (!supabase) return;
  if (channel) unsubscribe(); // 重複購読を防ぐ

  logger.info('購読開始', { userId }, 'realtime-service');

  channel = supabase
    .channel(`sync-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sync_data',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        // エコー防止: 自タブの変更は無視
        const source = (payload.new as Record<string, unknown>)?.[
          '__tab_session__'
        ] as string | undefined;
        if (source === TAB_SESSION_ID) return;

        const newRecord = payload.new as {
          store_key?: string;
          data?: unknown;
          updated_at?: string;
        } | null;

        if (!newRecord?.store_key) return;
        const storeKey = newRecord.store_key as SyncStoreKey;
        if (!SYNC_STORE_KEYS.includes(storeKey)) return;

        try {
          // localStorage に上書き
          localStorage.setItem(storeKey, JSON.stringify(newRecord.data));
          if (newRecord.updated_at) {
            localStorage.setItem(
              `${storeKey}__sync_updated_at__`,
              newRecord.updated_at,
            );
          }
          logger.info(`Realtime 更新: ${storeKey}`, undefined, 'realtime-service');
          // ページリロードせずにストアを再ハイドレートする（将来の最適化ポイント）
          // 現状は次回ページロード時に反映される
        } catch (err) {
          logger.error(`Realtime 更新失敗: ${storeKey}`, { err }, 'realtime-service');
        }
      },
    )
    .subscribe((status) => {
      logger.info(`購読ステータス: ${status}`, undefined, 'realtime-service');
    });
}

/** Realtime 購読を解除する */
export function unsubscribe(): void {
  if (!supabase || !channel) return;
  supabase.removeChannel(channel).catch(() => {});
  channel = null;
  logger.info('購読解除', undefined, 'realtime-service');
}
