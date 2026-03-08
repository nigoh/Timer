import { SidebarMenuItem } from "@/components/ui/sidebar";
import {
  useAuthStore,
  selectIsAuthenticated,
} from "@/features/auth/auth-store";
import { AuthModal } from "@/features/auth/components/AuthModal";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { SyncStatusIndicator } from "@/features/auth/components/SyncStatusIndicator";

/**
 * 認証状態に応じて LoginButton / UserMenu を切り替えるコンテナ。
 * サイドバーフッターの SidebarMenu に直接置く。
 */
export function AuthContainer() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;

  return (
    <>
      {isAuthenticated && user && (
        <SidebarMenuItem>
          <SyncStatusIndicator />
        </SidebarMenuItem>
      )}
      <SidebarMenuItem>
        {isAuthenticated && user ? <UserMenu user={user} /> : <AuthModal />}
      </SidebarMenuItem>
    </>
  );
}
