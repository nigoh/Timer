import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicTimer } from "./BasicTimer";
import { EnhancedPomodoroTimer } from "./EnhancedPomodoroTimer";
import { MultiTimer } from "./MultiTimer";
import ErrorBoundary from "@/components/ErrorBoundary";

const SUB_TABS = [
  { value: "basic", label: "基本タイマー" },
  { value: "pomodoro", label: "ポモドーロ" },
  { value: "multi", label: "複数タイマー" },
] as const;

type SubTabValue = (typeof SUB_TABS)[number]["value"];

function getInitialSubTab(): SubTabValue {
  try {
    const stored = localStorage.getItem("timer-sub-tab");
    if (stored && SUB_TABS.some((t) => t.value === stored)) {
      return stored as SubTabValue;
    }
  } catch {
    /* noop */
  }
  return "basic";
}

export const UnifiedTimer: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTabValue>(getInitialSubTab);

  const handleSubTabChange = (value: string) => {
    setSubTab(value as SubTabValue);
    try {
      localStorage.setItem("timer-sub-tab", value);
    } catch {
      /* noop */
    }
  };

  return (
    <Tabs
      value={subTab}
      onValueChange={handleSubTabChange}
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
