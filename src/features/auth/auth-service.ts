import { supabase } from '@/lib/supabase';
import { SyncUser, AuthProvider } from '@/types/auth';
import { logger } from '@/utils/logger';

/** Supabase User メタデータから SyncUser に変換する */
function toSyncUser(supabaseUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, string | null | undefined>;
  app_metadata?: { provider?: string };
}): SyncUser {
  const meta = supabaseUser.user_metadata ?? {};
  const provider = (supabaseUser.app_metadata?.provider ?? 'github') as AuthProvider;

  const displayName =
    (meta['full_name'] as string | undefined) ??
    (meta['user_name'] as string | undefined) ??
    (meta['name'] as string | undefined) ??
    null;

  const avatarUrl =
    (meta['avatar_url'] as string | undefined) ??
    (meta['picture'] as string | undefined) ??
    null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? null,
    displayName,
    provider,
    avatarUrl,
  };
}

/** GitHub OAuth でログインする（リダイレクトフロー） */
export async function signInWithGitHub(): Promise<void> {
  if (!supabase) {
    logger.warn('Supabase 未設定のため GitHub ログインをスキップ', undefined, 'auth-service');
    return;
  }
  logger.info('GitHub ログイン開始', undefined, 'auth-service');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: window.location.origin },
  });
  if (error) {
    logger.error('GitHub ログイン失敗', { error: error.message }, 'auth-service');
    throw error;
  }
}

/** Google OAuth でログインする（リダイレクトフロー） */
export async function signInWithGoogle(): Promise<void> {
  if (!supabase) {
    logger.warn('Supabase 未設定のため Google ログインをスキップ', undefined, 'auth-service');
    return;
  }
  logger.info('Google ログイン開始', undefined, 'auth-service');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) {
    logger.error('Google ログイン失敗', { error: error.message }, 'auth-service');
    throw error;
  }
}

/** ログアウトする */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  logger.info('ログアウト開始', undefined, 'auth-service');
  const { error } = await supabase.auth.signOut();
  if (error) {
    logger.error('ログアウト失敗', { error: error.message }, 'auth-service');
    throw error;
  }
  logger.info('ログアウト完了', undefined, 'auth-service');
}

/**
 * 認証状態変化を購読する。
 * @returns クリーンアップ関数（購読解除）
 */
export function onAuthStateChange(
  callback: (user: SyncUser | null) => void,
): () => void {
  if (!supabase) {
    callback(null);
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback(toSyncUser(session.user as Parameters<typeof toSyncUser>[0]));
    } else {
      callback(null);
    }
  });

  return () => subscription.unsubscribe();
}

/** 現在のセッションを取得して SyncUser に変換する（初期化用） */
export async function getCurrentUser(): Promise<SyncUser | null> {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return toSyncUser(session.user as Parameters<typeof toSyncUser>[0]);
}
