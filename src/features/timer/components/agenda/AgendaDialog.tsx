import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Clock, X } from "lucide-react";
import { useAgendaTimerInstance } from "@/features/timer/hooks/useTimerInstances";
import { useTaskId } from "@/features/timer/contexts/TaskIdContext";
import { meetingTitleSchema } from "@/features/timer/utils/input-validators";
import { AgendaItem } from "@/types/agenda";

const agendaFormSchema = z.object({
  title: meetingTitleSchema,
  duration: z
    .number()
    .int("分単位の整数で入力してください")
    .min(1, "1分以上で入力してください")
    .max(180, "180分以内で入力してください"),
  memo: z.string().max(2000),
});

type AgendaFormValues = z.infer<typeof agendaFormSchema>;

export interface AgendaDialogProps {
  meetingId: string;
  agenda?: AgendaItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AgendaDialog: React.FC<AgendaDialogProps> = ({
  meetingId,
  agenda,
  isOpen,
  onClose,
}) => {
  const taskId = useTaskId();
  const { addAgenda, updateAgenda } = useAgendaTimerInstance(taskId);

  const form = useForm<AgendaFormValues, unknown, AgendaFormValues>({
    resolver: zodResolver(agendaFormSchema),
    defaultValues: {
      title: agenda?.title || "",
      duration: agenda ? Math.ceil(agenda.plannedDuration / 60) : 10,
      memo: agenda?.memo || "",
    },
  });

  useEffect(() => {
    form.reset({
      title: agenda?.title || "",
      duration: agenda ? Math.ceil(agenda.plannedDuration / 60) : 10,
      memo: agenda?.memo || "",
    });
  }, [agenda, form]);

  const onSubmit = (values: AgendaFormValues) => {
    const durationSeconds = values.duration * 60;

    if (agenda) {
      updateAgenda(meetingId, agenda.id, {
        title: values.title,
        plannedDuration: durationSeconds,
        memo: values.memo,
        remainingTime: durationSeconds - agenda.actualDuration,
      });
    } else {
      addAgenda(meetingId, values.title, durationSeconds, values.memo);
    }

    form.reset();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {agenda ? "アジェンダを編集" : "新しいアジェンダを追加"}
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="ダイアログを閉じる"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>アジェンダタイトル</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例: 進捗報告、課題検討、次回予定"
                      {...field}
                      maxLength={200}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>予定時間（分）</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="180"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || 0)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メモ（任意）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="議論のポイント、準備資料、参加者への連絡事項など"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit">{agenda ? "更新" : "追加"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
