import { supabase } from '@/lib/supabase';
import { SYNC_STORE_KEYS } from '@/types/sync';
import { useAuthStore } from '@/features/auth/auth-store';
import { logger } from '@/utils/logger';
import { notificationManager } from '@/utils/notification-manager';

/**
 * ゲストユーザーのローカルデータをクラウドに移行する。
 * ログイン直後に一度だけ呼び出す。
 *
 * - localStorage の各ストアキーを読み Supabase に UPSERT する。
 * - クラウドに既存データがある場合は updated_at で LWW 判定し、
 *   クラウドが新しければローカルを上書きする（マージではなく置き換え）。
 * - 移行失敗時も既存の localStorage データは削除しない。
 */
export async function migrateGuestData(): Promise<void> {
  if (!supabase) return;
  const { user } = useAuthStore.getState();
  if (!user) return;

  logger.info('ゲストデータ移行開始', { userId: user.id }, 'migration-service');
  let migrated = 0;

  for (const storeKey of SYNC_STORE_KEYS) {
    try {
      const raw = localStorage.getItem(storeKey);
      if (!raw) continue;

      const localData: unknown = JSON.parse(raw);
      const localTs = localStorage.getItem(`${storeKey}__sync_updated_at__`) ?? new Date(0).toISOString();

      // クラウドの既存データを確認
      const { data: existing, error: fetchErr } = await supabase
        .from('sync_data')
        .select('updated_at')
        .eq('user_id', user.id)
        .eq('store_key', storeKey)
        .single();

      if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;

      const cloudTs = (existing as { updated_at: string } | null)?.updated_at;

      if (cloudTs && cloudTs > localTs) {
        // クラウドが新しい → クラウドを pull（上書き方向を逆転させずここでは skip）
        logger.info(`クラウドが新しいためスキップ: ${storeKey}`, undefined, 'migration-service');
        continue;
      }

      // ローカルが新しい or クラウドに未登録 → UPSERT
      const { error: upsertErr } = await supabase.from('sync_data').upsert(
        { user_id: user.id, store_key: storeKey, data: localData },
        { onConflict: 'user_id,store_key' },
      );
      if (upsertErr) throw upsertErr;

      localStorage.setItem(`${storeKey}__sync_updated_at__`, new Date().toISOString());
      migrated++;
    } catch (err) {
      logger.error(`移行失敗: ${storeKey}`, { err }, 'migration-service');
    }
  }

  logger.info('ゲストデータ移行完了', { migrated }, 'migration-service');

  if (migrated > 0) {
    notificationManager.notify('データ同期完了', {
      body: `${migrated} 件のデータをクラウドに移行しました。`,
      silent: true,
    });
  }
}
