import { Cloud, CloudOff, Loader2, CloudAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSyncStore } from '@/features/sync/sync-store';
import { useAuthStore, selectIsAuthenticated } from '@/features/auth/auth-store';
import { SyncStatus } from '@/types/sync';

const STATUS_CONFIG: Record<
  SyncStatus,
  { icon: React.ElementType; label: string; className: string }
> = {
  idle: { icon: Cloud, label: '同期済み', className: 'text-muted-foreground' },
  syncing: { icon: Loader2, label: '同期中…', className: 'text-info animate-spin' },
  error: { icon: CloudAlert, label: '同期エラー', className: 'text-destructive' },
  offline: { icon: CloudOff, label: 'オフライン', className: 'text-warning' },
};

/** サイドバーフッターに表示する同期ステータスアイコン（ログイン時のみ表示） */
export function SyncStatusIndicator() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { status, lastSyncAt } = useSyncStore();

  if (!isAuthenticated) return null;

  const { icon: Icon, label, className } = STATUS_CONFIG[status];

  const lastSyncLabel = lastSyncAt
    ? `最終同期: ${new Date(lastSyncAt).toLocaleTimeString('ja-JP')}`
    : '未同期';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`flex items-center gap-1 text-xs ${className}`}>
          <Icon className="size-3.5" />
          <span className="hidden group-data-[state=expanded]:inline">{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
        <p className="text-xs text-muted-foreground">{lastSyncLabel}</p>
      </TooltipContent>
    </Tooltip>
  );
}
