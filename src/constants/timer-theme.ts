import { Play, Pause, AlertCircle, CheckCircle2, Circle } from "lucide-react";
import React from "react";

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'overtime' | 'warning';

export interface StatusConfig {
  color: string;      // Text color class
  bgColor: string;    // Background color class
  borderColor: string;// Border color class
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
  label: string;
}

export const TIMER_STATUS_CONFIG: Record<TimerStatus, StatusConfig> = {
  idle: {
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted",
    badgeVariant: "outline",
    icon: React.createElement(Circle, { className: "w-4 h-4" }),
    label: "待機中",
  },
  running: {
    color: "text-blue-600",
    bgColor: "bg-blue-500",
    borderColor: "border-blue-200",
    badgeVariant: "default",
    icon: React.createElement(Play, { className: "w-4 h-4" }),
    label: "実行中",
  },
  paused: {
    color: "text-orange-600",
    bgColor: "bg-orange-500",
    borderColor: "border-orange-200",
    badgeVariant: "secondary",
    icon: React.createElement(Pause, { className: "w-4 h-4" }),
    label: "一時停止",
  },
  completed: {
    color: "text-green-600",
    bgColor: "bg-green-500",
    borderColor: "border-green-200",
    badgeVariant: "secondary", // Shadcn doesn't have 'success' by default
    icon: React.createElement(CheckCircle2, { className: "w-4 h-4" }),
    label: "完了",
  },
  overtime: {
    color: "text-purple-600",
    bgColor: "bg-purple-500",
    borderColor: "border-purple-200",
    badgeVariant: "destructive",
    icon: React.createElement(AlertCircle, { className: "w-4 h-4" }),
    label: "超過中",
  },
  warning: {
    color: "text-amber-600",
    bgColor: "bg-amber-500",
    borderColor: "border-amber-200",
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
    text: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    progress: 'bg-blue-500',
  },
  shortBreak: {
    text: 'text-green-600',
    bg: 'bg-green-100',
    border: 'border-green-200',
    progress: 'bg-green-500',
  },
  longBreak: {
    text: 'text-purple-600',
    bg: 'bg-purple-100',
    border: 'border-purple-200',
    progress: 'bg-purple-500',
  },
};
