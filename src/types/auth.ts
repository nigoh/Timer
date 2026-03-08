/** OAuth プロバイダー種別 */
export type AuthProvider = 'github' | 'google';

/** ログイン済みユーザー情報（表示用・非秘密）*/
export interface SyncUser {
  id: string;
  email: string | null;
  displayName: string | null;
  provider: AuthProvider;
  avatarUrl: string | null;
}
