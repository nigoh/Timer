import { useState } from "react";
import { LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { LoginButton } from "./LoginButton";
import { isSupabaseConfigured } from "@/lib/supabase";

/** ログインモーダル — Supabase 未設定時は非表示 */
export function AuthModal() {
  const [open, setOpen] = useState(false);

  if (!isSupabaseConfigured()) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton tooltip="ログイン">
          <LogIn className="size-4" />
          <span>ログイン</span>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>アカウントでログイン</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          ログインするとデータがクラウドに保存され、複数デバイスで同期されます。
        </p>
        <LoginButton onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
