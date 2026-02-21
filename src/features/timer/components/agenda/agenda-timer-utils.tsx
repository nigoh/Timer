import { Clock, AlertCircle, Timer } from "lucide-react";
import { TIMER_STATUS_CONFIG } from "@/constants/timer-theme";

export const DEFAULT_AGENDA_DURATION_MINUTES = 10;

export const createAgendaSelectionMap = (
  size: number,
): Record<number, boolean> =>
  Object.fromEntries(Array.from({ length: size }, (_, index) => [index, true]));

export const parseAgendaDraftLines = (input: string) =>
  input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawTitle, rawMinutes] = line.split("|").map((item) => item.trim());
      const parsedMinutes = Number.parseInt(rawMinutes ?? "", 10);
      return {
        title: rawTitle,
        plannedDurationMinutes:
          Number.isFinite(parsedMinutes) && parsedMinutes > 0
            ? parsedMinutes
            : DEFAULT_AGENDA_DURATION_MINUTES,
      };
    })
    .filter((item) => item.title.length > 0);

export const getProgressDisplay = (percentage: number) => {
  if (percentage <= 70) {
    return {
      color: TIMER_STATUS_CONFIG.completed.color,
      bgColor: TIMER_STATUS_CONFIG.completed.bgColor,
      icon: <Clock className="w-4 h-4" />,
      label: "余裕",
    };
  }
  if (percentage <= 90) {
    return {
      color: TIMER_STATUS_CONFIG.paused.color,
      bgColor: TIMER_STATUS_CONFIG.paused.bgColor,
      icon: <AlertCircle className="w-4 h-4" />,
      label: "残り少",
    };
  }
  if (percentage <= 100) {
    return {
      color: TIMER_STATUS_CONFIG.warning.color,
      bgColor: TIMER_STATUS_CONFIG.warning.bgColor,
      icon: <Timer className="w-4 h-4" />,
      label: "終了間近",
    };
  }
  return {
    color: TIMER_STATUS_CONFIG.overtime.color,
    bgColor: TIMER_STATUS_CONFIG.overtime.bgColor,
    icon: <AlertCircle className="w-4 h-4" />,
    label: "超過中",
  };
};
