import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SyncUser } from "@/types/auth";
import { signOut } from "@/features/auth/auth-service";
import { logger } from "@/utils/logger";

interface HeaderUserAvatarProps {
  user: SyncUser;
}

/** ヘッダー右端に表示するアバター + ドロップダウンメニュー */
export function HeaderUserAvatar({ user }: HeaderUserAvatarProps) {
  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (user.email?.[0]?.toUpperCase() ?? "U");

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("ログアウトしました");
    } catch (err) {
      logger.error("ログアウトエラー", { err }, "HeaderUserAvatar");
      toast.error("ログアウトに失敗しました。もう一度お試しください。");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${user.displayName ?? user.email ?? "ユーザー"} のメニュー`}
        >
          <Avatar className="size-7">
            <AvatarImage
              src={user.avatarUrl ?? undefined}
              alt={user.displayName ?? ""}
            />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2">
            <Avatar className="size-8 shrink-0">
              <AvatarImage
                src={user.avatarUrl ?? undefined}
                alt={user.displayName ?? ""}
              />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5 overflow-hidden">
              <p className="truncate text-sm font-medium leading-none">
                {user.displayName ?? "ユーザー"}
              </p>
              {user.email && (
                <p className="truncate text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 size-4" />
          {user.provider === "github" ? "GitHub" : "Google"} 連携
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
