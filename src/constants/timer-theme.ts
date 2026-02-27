import { Play, Pause, AlertCircle, CheckCircle2, Circle } from "lucide-react";
import React from "react";

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'overtime' | 'warning';

export interface StatusConfig {
  color: string;      // Text color class
  bgColor: string;    // Background color class
  borderColor: string;// Border color class
  surfaceClass: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
  label: string;
}

export const TIMER_STATUS_CONFIG: Record<TimerStatus, StatusConfig> = {
  idle: {
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted",
    surfaceClass: "bg-muted/40 border-border",
    badgeVariant: "outline",
    icon: React.createElement(Circle, { className: "w-4 h-4" }),
    label: "待機中",
  },
  running: {
    color: "text-info",
    bgColor: "bg-info",
    borderColor: "border-info/30",
    surfaceClass: "bg-info/10 border-info/30",
    badgeVariant: "default",
    icon: React.createElement(Play, { className: "w-4 h-4" }),
    label: "実行中",
  },
  paused: {
    color: "text-warning",
    bgColor: "bg-warning",
    borderColor: "border-warning/30",
    surfaceClass: "bg-warning/10 border-warning/30",
    badgeVariant: "secondary",
    icon: React.createElement(Pause, { className: "w-4 h-4" }),
    label: "一時停止",
  },
  completed: {
    color: "text-success",
    bgColor: "bg-success",
    borderColor: "border-success/30",
    surfaceClass: "bg-success/10 border-success/30",
    badgeVariant: "secondary", // Shadcn doesn't have 'success' by default
    icon: React.createElement(CheckCircle2, { className: "w-4 h-4" }),
    label: "完了",
  },
  overtime: {
    color: "text-destructive",
    bgColor: "bg-destructive",
    borderColor: "border-destructive/30",
    surfaceClass: "bg-destructive/10 border-destructive/30",
    badgeVariant: "destructive",
    icon: React.createElement(AlertCircle, { className: "w-4 h-4" }),
    label: "超過中",
  },
  warning: {
    color: "text-warning",
    bgColor: "bg-warning",
    borderColor: "border-warning/30",
    surfaceClass: "bg-warning/10 border-warning/30",
    badgeVariant: "destructive",
    icon: React.createElement(AlertCircle, { className: "w-4 h-4" }),
    label: "残りわずか",
  },
};

/**
 * Get status configuration based on state flags
 */
export const getTimerStatus = (
  isRunning: boolean,
  isPaused: boolean,
  isCompleted: boolean,
  isOvertime: boolean = false
): TimerStatus => {
  if (isOvertime) return 'overtime';
  if (isCompleted) return 'completed';
  if (isRunning) return 'running';
  if (isPaused) return 'paused';
  return 'idle';
};

/**
 * Get progress color based on percentage
 */
export const getProgressColor = (percentage: number): { color: string; bgColor: string; status: TimerStatus } => {
  if (percentage > 100) return { ...TIMER_STATUS_CONFIG.overtime, status: 'overtime' };
  if (percentage >= 90) return { ...TIMER_STATUS_CONFIG.warning, status: 'warning' };
  return { ...TIMER_STATUS_CONFIG.running, status: 'running' };
};

// Pomodoro Specific Colors
export const POMODORO_PHASE_COLORS = {
  work: {
    text: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/30',
    progress: 'bg-info',
  },
  shortBreak: {
    text: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
    progress: 'bg-success',
  },
  longBreak: {
    text: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
    progress: 'bg-success',
  },
};
