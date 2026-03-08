import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SyncUser } from '@/types/auth';
import { getStorageProvider } from '@/utils/storage-adapter';

interface AuthState {
  /**
   * ログイン中のユーザー情報（メモリ保持 + 一部永続化）。
   * セッション・アクセストークンは Supabase SDK がメモリで管理し、ここには含まない。
   */
  user: SyncUser | null;
  /** 認証状態を初期化中かどうか */
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: SyncUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export type AuthStore = AuthState & AuthActions;

/** auth-store のキー（localStorage 用） */
const STORE_NAME = 'auth-store';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,

      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      clearUser: () => set({ user: null, isLoading: false }),
    }),
    {
      name: STORE_NAME,
      storage: createJSONStorage(() => getStorageProvider()),
      // セッション・トークンは含まない。ユーザーの表示情報のみ永続化。
      partialize: (state) => ({
        user: state.user
          ? {
              id: state.user.id,
              displayName: state.user.displayName,
              provider: state.user.provider,
              avatarUrl: state.user.avatarUrl,
              email: state.user.email,
            }
          : null,
      }),
    },
  ),
);

/** ログイン済みかどうかを返す（派生値） */
export const selectIsAuthenticated = (state: AuthStore): boolean =>
  state.user !== null;
