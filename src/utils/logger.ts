/**
 * 包括的ログ管理システム
 * 開発・デバッグ・運用時のトラブルシューティング支援
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  categories: string[];
  enableStackTrace: boolean;
}

class Logger {
  private config: LoggerConfig;
  private sessionId: string;
  private storageKey = 'timer-app-logs';

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: true,
      maxStorageEntries: 1000,
      categories: ['timer', 'ui', 'store', 'notification', 'error', 'performance'],
      enableStackTrace: true,
      ...config
    };
    
    this.sessionId = this.generateSessionId();
    this.setupErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupErrorHandlers(): void {
    // グローバルエラーハンドラー
    window.addEventListener('error', (event) => {
      this.error('Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }, 'error');
    });

    // Promise rejection ハンドラー
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      }, 'error');
    });
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: any,
    category: string = 'general'
  ): LogEntry {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId
    };

    // スタックトレース追加（エラー・警告時）
    if (this.config.enableStackTrace && level <= LogLevel.WARN) {
      entry.stackTrace = new Error().stack;
    }

    return entry;
  }

  private outputToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const timestamp = entry.timestamp.toISOString();
    const category = `[${entry.category.toUpperCase()}]`;
    const prefix = `${timestamp} ${category}`;

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.data || '');
        if (entry.stackTrace) console.error(entry.stackTrace);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.TRACE:
        console.trace(prefix, entry.message, entry.data || '');
        break;
    }
  }

  private saveToStorage(entry: LogEntry): void {
    if (!this.config.enableStorage) return;

    try {
      const existingLogs = this.getStoredLogs();
      const updatedLogs = [entry, ...existingLogs];
      
      // 最大保存数を超えた場合は古いログを削除
      if (updatedLogs.length > this.config.maxStorageEntries) {
        updatedLogs.splice(this.config.maxStorageEntries);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Failed to save log to storage:', error);
    }
  }

  private log(level: LogLevel, message: string, data?: any, category: string = 'general'): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, data, category);
    
    this.outputToConsole(entry);
    this.saveToStorage(entry);
  }

  // パブリックAPI
  error(message: string, data?: any, category: string = 'error'): void {
    this.log(LogLevel.ERROR, message, data, category);
  }

  warn(message: string, data?: any, category: string = 'general'): void {
    this.log(LogLevel.WARN, message, data, category);
  }

  info(message: string, data?: any, category: string = 'general'): void {
    this.log(LogLevel.INFO, message, data, category);
  }

  debug(message: string, data?: any, category: string = 'debug'): void {
    this.log(LogLevel.DEBUG, message, data, category);
  }

  trace(message: string, data?: any, category: string = 'trace'): void {
    this.log(LogLevel.TRACE, message, data, category);
  }

  // タイマー特化ログメソッド
  timerStart(timerId: string, timerType: string, duration?: number): void {
    this.info('Timer started', {
      timerId,
      timerType,
      duration,
      startTime: new Date().toISOString()
    }, 'timer');
  }

  timerStop(timerId: string, timerType: string, elapsedTime?: number): void {
    this.info('Timer stopped', {
      timerId,
      timerType,
      elapsedTime,
      stopTime: new Date().toISOString()
    }, 'timer');
  }

  timerComplete(timerId: string, timerType: string, actualDuration: number): void {
    this.info('Timer completed', {
      timerId,
      timerType,
      actualDuration,
      completionTime: new Date().toISOString()
    }, 'timer');
  }

  userAction(action: string, context?: any): void {
    this.info('User action', {
      action,
      context,
      timestamp: new Date().toISOString()
    }, 'ui');
  }

  stateChange(store: string, previousState?: any, newState?: any): void {
    this.debug('State change', {
      store,
      previousState,
      newState,
      timestamp: new Date().toISOString()
    }, 'store');
  }

  notification(type: string, message: string, success: boolean): void {
    this.info('Notification sent', {
      type,
      message,
      success,
      timestamp: new Date().toISOString()
    }, 'notification');
  }

  performance(operation: string, duration: number, details?: any): void {
    this.info('Performance metric', {
      operation,
      duration,
      details,
      timestamp: new Date().toISOString()
    }, 'performance');
  }

  // ログ管理機能
  getStoredLogs(): LogEntry[] {
    try {
      const logs = localStorage.getItem(this.storageKey);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to retrieve logs from storage:', error);
      return [];
    }
  }

  getLogsByCategory(category: string): LogEntry[] {
    return this.getStoredLogs().filter(log => log.category === category);
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.getStoredLogs().filter(log => log.level === level);
  }

  getLogsByDateRange(startDate: Date, endDate: Date): LogEntry[] {
    return this.getStoredLogs().filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  clearLogs(): void {
    try {
      localStorage.removeItem(this.storageKey);
      this.info('Logs cleared', {}, 'system');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  exportLogs(): string {
    const logs = this.getStoredLogs();
    return JSON.stringify(logs, null, 2);
  }

  getLogStatistics(): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByCategory: Record<string, number>;
    sessionCount: number;
    oldestLog?: Date;
    newestLog?: Date;
  } {
    const logs = this.getStoredLogs();
    
    const logsByLevel: Record<string, number> = {};
    const logsByCategory: Record<string, number> = {};
    const sessions = new Set<string>();

    logs.forEach(log => {
      // レベル別集計
      const levelName = LogLevel[log.level];
      logsByLevel[levelName] = (logsByLevel[levelName] || 0) + 1;
      
      // カテゴリ別集計
      logsByCategory[log.category] = (logsByCategory[log.category] || 0) + 1;
      
      // セッション集計
      sessions.add(log.sessionId);
    });

    const timestamps = logs.map(log => new Date(log.timestamp)).sort();

    return {
      totalLogs: logs.length,
      logsByLevel,
      logsByCategory,
      sessionCount: sessions.size,
      oldestLog: timestamps[0],
      newestLog: timestamps[timestamps.length - 1]
    };
  }

  // 設定更新
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.info('Logger configuration updated', newConfig, 'system');
  }
}

// シングルトンインスタンス
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 1000,
  enableStackTrace: true
});

// 開発環境での便利関数
if (process.env.NODE_ENV === 'development') {
  (window as any).logger = logger;
  (window as any).LogLevel = LogLevel;
}

export default logger;
