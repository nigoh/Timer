import { supabase } from '@/lib/supabase';
import { SYNC_STORE_KEYS, SyncStoreKey } from '@/types/sync';
import { useSyncStore } from '@/features/sync/sync-store';
import { useAuthStore } from '@/features/auth/auth-store';
import { logger } from '@/utils/logger';

/** localStorage に保存する「最終同期タイムスタンプ」のキー接尾辞 */
const SYNC_TS_SUFFIX = '__sync_updated_at__';

function getSyncTsKey(storeKey: string): string {
  return `${storeKey}${SYNC_TS_SUFFIX}`;
}

/** localStorage から raw JSON を読む（Zustand persist が書いた形式） */
function readLocalData(storeKey: string): unknown | null {
  try {
    const raw = localStorage.getItem(storeKey);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

/** localStorage の同期タイムスタンプを読む */
function readLocalSyncTs(storeKey: string): string | null {
  return localStorage.getItem(getSyncTsKey(storeKey));
}

/** localStorage の同期タイムスタンプを書く */
function writeLocalSyncTs(storeKey: string, ts: string): void {
  localStorage.setItem(getSyncTsKey(storeKey), ts);
}

/**
 * 指定ストアのデータを Supabase に UPSERT する。
 * 未認証・Supabase 未設定・オフライン時はスキップ。
 */
export async function push(storeKey: SyncStoreKey): Promise<void> {
  if (!supabase) return;
  const { user } = useAuthStore.getState();
  if (!user) return;

  const data = readLocalData(storeKey);
  if (data === null) return;

  try {
    const { error } = await supabase.from('sync_data').upsert(
      { user_id: user.id, store_key: storeKey, data },
      { onConflict: 'user_id,store_key' },
    );
    if (error) throw error;

    writeLocalSyncTs(storeKey, new Date().toISOString());
    logger.info(`push 完了: ${storeKey}`, undefined, 'sync-service');
  } catch (err) {
    logger.error(`push 失敗: ${storeKey}`, { err }, 'sync-service');
    throw err;
  }
}

/**
 * 指定ストアのデータを Supabase から取得し LWW で localStorage に反映する。
 * クラウドのデータが新しければ localStorage を上書きする。
 */
export async function pull(storeKey: SyncStoreKey): Promise<boolean> {
  if (!supabase) return false;
  const { user } = useAuthStore.getState();
  if (!user) return false;

  try {
    const { data, error } = await supabase
      .from('sync_data')
      .select('data, updated_at')
      .eq('user_id', user.id)
      .eq('store_key', storeKey)
      .single();

    if (error?.code === 'PGRST116') return false; // 行なし
    if (error) throw error;
    if (!data) return false;

    const localTs = readLocalSyncTs(storeKey);
    const cloudTs = data.updated_at as string;

    // クラウドが新しい場合のみ上書き（LWW）
    if (!localTs || cloudTs > localTs) {
      localStorage.setItem(storeKey, JSON.stringify(data.data));
      writeLocalSyncTs(storeKey, cloudTs);
      logger.info(`pull で更新: ${storeKey}`, { cloudTs, localTs }, 'sync-service');
      return true; // 更新あり
    }

    return false; // 変更なし
  } catch (err) {
    logger.error(`pull 失敗: ${storeKey}`, { err }, 'sync-service');
    throw err;
  }
}

/** 全ストアを同期する（push → 次回起動時の pull は syncAll で実施） */
export async function syncAll(): Promise<void> {
  if (!supabase) return;
  const { user } = useAuthStore.getState();
  if (!user) return;

  const { setStatus, setLastSyncAt } = useSyncStore.getState();
  const { isOnline } = useSyncStore.getState();
  if (!isOnline) {
    setStatus('offline');
    return;
  }

  setStatus('syncing');
  try {
    // まず pull で最新を取得してから push で差分を書き込む
    for (const key of SYNC_STORE_KEYS) {
      await pull(key);
    }
    for (const key of SYNC_STORE_KEYS) {
      await push(key);
    }
    setStatus('idle');
    setLastSyncAt(new Date().toISOString());
    logger.info('syncAll 完了', undefined, 'sync-service');
  } catch (err) {
    setStatus('error');
    logger.error('syncAll 失敗', { err }, 'sync-service');
  }
}
