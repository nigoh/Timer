import { Cloud, CloudOff, Loader2, CloudAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useSyncStore } from "@/features/sync/sync-store";
import {
  useAuthStore,
  selectIsAuthenticated,
} from "@/features/auth/auth-store";
import { SyncStatus } from "@/types/sync";

const STATUS_CONFIG: Record<
  SyncStatus,
  { icon: React.ElementType; label: string; iconClassName: string }
> = {
  idle: {
    icon: Cloud,
    label: "同期済み",
    iconClassName: "text-muted-foreground",
  },
  syncing: {
    icon: Loader2,
    label: "同期中…",
    iconClassName: "text-blue-500 animate-spin",
  },
  error: {
    icon: CloudAlert,
    label: "同期エラー",
    iconClassName: "text-destructive",
  },
  offline: {
    icon: CloudOff,
    label: "オフライン",
    iconClassName: "text-warning",
  },
};

/** サイドバーフッターに表示する同期ステータス（ログイン時のみ表示）。
 * アイコンモード時はアイコン＋ツールチップ、展開時はテキスト付きで表示する。 */
export function SyncStatusIndicator() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { status, lastSyncAt } = useSyncStore();

  if (!isAuthenticated) return null;

  const { icon: Icon, label, iconClassName } = STATUS_CONFIG[status];

  const lastSyncLabel = lastSyncAt
    ? `最終同期: ${new Date(lastSyncAt).toLocaleTimeString("ja-JP")}`
    : "未同期";

  return (
    <SidebarMenuButton
      tooltip={`${label} — ${lastSyncLabel}`}
      className="cursor-default text-xs"
      tabIndex={-1}
    >
      <Icon className={cn("size-4 shrink-0", iconClassName)} />
      <span>{label}</span>
    </SidebarMenuButton>
  );
}
