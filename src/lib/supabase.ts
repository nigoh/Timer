import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Supabase クライアントシングルトン。
 * 環境変数未設定の場合は null を返す（ゲストモードで graceful degradation）。
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/** Supabase が設定済みかどうかを返す */
export const isSupabaseConfigured = (): boolean => supabase !== null;
