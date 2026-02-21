import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

export function formatDuration(totalSeconds: number): string {
  const isNegative = totalSeconds < 0;
  const absSeconds = Math.abs(totalSeconds);
  const hours = Math.floor(absSeconds / 3600);
  const mins = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;

  const timeStr =
    hours > 0
      ? `${hours}:${mins.toString().padStart(2, '0')}:${secs
          .toString()
          .padStart(2, '0')}`
      : `${mins.toString().padStart(2, '0')}:${secs
          .toString()
          .padStart(2, '0')}`;

  return isNegative ? `-${timeStr}` : timeStr;
}

/** 秒 → 「X分」または「XhYm」形式（分表示用） */
export function formatMinutes(totalSeconds: number): string {
  const totalMins = Math.ceil(Math.abs(totalSeconds) / 60);
  if (totalMins < 60) return `${totalMins}分`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** ダッシュボード用: 分数値 → 「X分」または「XhYm」形式 */
export function formatMinutesValue(mins: number): string {
  if (mins < 60) return `${mins}分`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Date → ja-JP ロケールの「YYYY/MM/DD HH:mm:ss」形式 */
export function formatTimestamp(timestamp: Date): string {
  return new Date(timestamp).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Unix タイムスタンプ (ms) → 「HH:mm:ss」形式 */
export function formatUnixTimestamp(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/** 秒 → 「m:ss」形式（議事録用: 短い表示） */
export function formatDurationShort(seconds: number): string {
  const absSeconds = Math.abs(seconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
