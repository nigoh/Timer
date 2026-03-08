import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SyncUser } from '@/types/auth';
import { signOut } from '@/features/auth/auth-service';
import { logger } from '@/utils/logger';

interface UserMenuProps {
  user: SyncUser;
}

/** ログイン中ユーザーのアバター・ドロップダウンメニュー */
export function UserMenu({ user }: UserMenuProps) {
  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (user.email?.[0]?.toUpperCase() ?? 'U');

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      logger.error('ログアウトエラー', undefined, 'UserMenu');
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-full justify-start gap-2 px-2">
          <Avatar className="size-6">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName ?? ''} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm">{user.displayName ?? user.email ?? 'User'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium leading-none">
              {user.displayName ?? 'ユーザー'}
            </p>
            {user.email && (
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 size-4" />
          {user.provider === 'github' ? 'GitHub' : 'Google'} 連携
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 size-4" />
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
