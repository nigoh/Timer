import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface EmptyTaskViewProps {
  onCreateTask: () => void;
}

export const EmptyTaskView: React.FC<EmptyTaskViewProps> = ({
  onCreateTask,
}) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-muted-foreground">
    <PlusCircle className="h-12 w-12 opacity-30" />
    <div className="text-center">
      <p className="text-lg font-medium text-foreground">タスクがありません</p>
      <p className="mt-1 text-sm">
        タスクを作成して、タイマーやウィジェットを自由に配置できます。
      </p>
      <p className="text-xs text-muted-foreground/60">
        会議・集中作業・分析など、用途に合わせたテンプレートも選べます
      </p>
    </div>
    <Button type="button" onClick={onCreateTask} className="mt-2">
      <PlusCircle className="mr-1.5 h-4 w-4" />
      最初のタスクを作成
    </Button>
  </div>
);
