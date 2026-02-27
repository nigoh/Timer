import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogConfig {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmDialogState extends ConfirmDialogConfig {
  open: boolean;
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const confirm = useCallback(
    (config: ConfirmDialogConfig, onConfirm: () => void) => {
      setState({ ...config, open: true, onConfirm });
    },
    [],
  );

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setState((prev) => ({ ...prev, open: false }));
    }
  }, []);

  const handleConfirm = useCallback(() => {
    state.onConfirm();
    setState((prev) => ({ ...prev, open: false }));
  }, [state.onConfirm]);

  const ConfirmDialog = (
    <AlertDialog open={state.open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>{state.title}</AlertDialogTitle>
        <AlertDialogDescription>{state.description}</AlertDialogDescription>
        <div className="mt-4 flex justify-end gap-2">
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline">
              {state.cancelLabel ?? "キャンセル"}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button type="button" variant="destructive" onClick={handleConfirm}>
              {state.confirmLabel ?? "削除"}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, ConfirmDialog };
}
