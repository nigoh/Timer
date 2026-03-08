import { useAuthStore, selectIsAuthenticated } from '@/features/auth/auth-store';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { SyncStatusIndicator } from '@/features/auth/components/SyncStatusIndicator';

/**
 * 認証状態に応じて LoginButton / UserMenu を切り替えるコンテナ。
 * サイドバーフッターに配置する。
 */
export function AuthContainer() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;

  return (
    <div className="flex flex-col gap-1">
      <SyncStatusIndicator />
      {isAuthenticated && user ? <UserMenu user={user} /> : <AuthModal />}
    </div>
  );
}
