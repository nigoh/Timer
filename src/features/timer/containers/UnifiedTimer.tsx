import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicTimer } from "./BasicTimer";
import { EnhancedPomodoroTimer } from "./EnhancedPomodoroTimer";
import { MultiTimer } from "./MultiTimer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useUIPreferencesStore } from "@/features/timer/stores/ui-preferences-store";

const SUB_TABS = [
  { value: "basic", label: "基本タイマー" },
  { value: "pomodoro", label: "ポモドーロ" },
  { value: "multi", label: "複数タイマー" },
] as const;

export const UnifiedTimer: React.FC = () => {
  const timerSubTab = useUIPreferencesStore((s) => s.timerSubTab);
  const setTimerSubTab = useUIPreferencesStore((s) => s.setTimerSubTab);

  return (
    <Tabs
      value={timerSubTab}
      onValueChange={setTimerSubTab}
      className="flex flex-col"
    >
      <TabsList className="mb-2 w-full justify-start">
        {SUB_TABS.map(({ value, label }) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="basic">
        <ErrorBoundary componentName="BasicTimer">
          <BasicTimer />
        </ErrorBoundary>
      </TabsContent>

      <TabsContent value="pomodoro">
        <ErrorBoundary componentName="EnhancedPomodoroTimer">
          <EnhancedPomodoroTimer />
        </ErrorBoundary>
      </TabsContent>

      <TabsContent value="multi">
        <ErrorBoundary componentName="MultiTimer">
          <MultiTimer />
        </ErrorBoundary>
      </TabsContent>
    </Tabs>
  );
};
