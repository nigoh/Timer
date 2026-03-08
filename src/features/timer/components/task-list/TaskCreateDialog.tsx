import React, { useState } from "react";
import * as LucideIcons from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { X, Users, Timer, BarChart3, LayoutGrid } from "lucide-react";
import type { LucideIconName } from "@/types/task";
import { useTaskStore } from "@/features/timer/stores/task-store";
import {
  WIDGET_TEMPLATES,
  createWidgetLayoutItem,
  type WidgetTemplateId,
} from "@/features/timer/utils/widget-catalog";
import { cn } from "@/lib/utils";

// よく使うアイコン（全量だと重いため厳選）
const ICON_LIST: LucideIconName[] = [
  "Timer",
  "Clock",
  "BookOpen",
  "Code",
  "Briefcase",
  "Coffee",
  "Dumbbell",
  "Flame",
  "GraduationCap",
  "HeartPulse",
  "Lightbulb",
  "ListTodo",
  "Mail",
  "Mic",
  "Music",
  "Pencil",
  "Phone",
  "Presentation",
  "Rocket",
  "Search",
  "Settings",
  "ShoppingCart",
  "Star",
  "Target",
  "Users",
  "Video",
  "Wrench",
  "Zap",
  "FileText",
  "Folder",
  "Globe",
  "Home",
  "Laptop",
  "MessageSquare",
  "Monitor",
  "Palette",
  "PiggyBank",
  "Shield",
  "Smile",
  "Trophy",
];

const TEMPLATE_ICONS: Record<WidgetTemplateId, React.ElementType> = {
  meeting: Users,
  focus: Timer,
  analytics: BarChart3,
  custom: LayoutGrid,
};

const taskCreateSchema = z.object({
  name: z
    .string()
    .min(1, "タスク名は必須です")
    .max(60, "タスク名は60文字以内で入力してください")
    .regex(/^[^\x00-\x1f\x7f]*$/, "使用できない文字が含まれています"),
  icon: z.string().min(1),
});

type TaskCreateFormValues = z.infer<typeof taskCreateSchema>;

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskCreateDialog: React.FC<TaskCreateDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { createTask, addWidget } = useTaskStore();
  const [selectedTemplate, setSelectedTemplate] =
    useState<WidgetTemplateId>("focus");

  const form = useForm<TaskCreateFormValues, unknown, TaskCreateFormValues>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: { name: "", icon: "Timer" },
  });

  const onSubmit = (values: TaskCreateFormValues) => {
    const taskId = createTask(values.name.trim(), values.icon as LucideIconName);
    const template = WIDGET_TEMPLATES.find((t) => t.id === selectedTemplate);
    if (template) {
      let existing: { type: string; y: number; h: number }[] = [];
      for (const widgetType of template.widgetTypes) {
        const item = createWidgetLayoutItem(widgetType, existing as never);
        addWidget(taskId, item);
        existing = [...existing, { ...item }];
      }
    }
    form.reset();
    setSelectedTemplate("focus");
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>新しいタスクを作成</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              aria-label="閉じる"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タスク名</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例: ポモドーロ集中"
                      {...field}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      maxLength={60}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={() => (
                <FormItem>
                  <FormLabel>テンプレート</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {WIDGET_TEMPLATES.map((tpl) => {
                      const TplIcon = TEMPLATE_ICONS[tpl.id];
                      const isSelected = selectedTemplate === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setSelectedTemplate(tpl.id)}
                          className={cn(
                            "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:bg-accent/50",
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <TplIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">{tpl.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {tpl.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>アイコン</FormLabel>
                  <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto rounded-md border p-2">
                    {ICON_LIST.map((iconName) => {
                      const IconComp = (
                        LucideIcons as unknown as Record<
                          string,
                          | React.ComponentType<{ className?: string }>
                          | undefined
                        >
                      )[iconName];
                      if (!IconComp) return null;
                      const isSelected = field.value === iconName;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => field.onChange(iconName)}
                          className={`flex items-center justify-center rounded-sm p-1 transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent text-muted-foreground hover:text-foreground"
                          }`}
                          aria-label={iconName}
                          title={iconName}
                        >
                          <IconComp className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={!form.formState.isValid}>
                作成
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
