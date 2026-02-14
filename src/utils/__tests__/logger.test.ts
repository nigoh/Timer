import { beforeEach, describe, expect, it } from 'vitest';
import { logger, LogLevel } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    localStorage.clear();
    logger.updateConfig({
      level: LogLevel.TRACE,
      enableConsole: false,
      enableStorage: true,
      maxStorageEntries: 1000,
      enableStackTrace: false,
    });
  });

  // REQ-5.6
  it('レベルフィルタとカテゴリフィルタでログを取得できる', () => {
    logger.info('通常情報', { from: 'info' }, 'ui');
    logger.error('重大エラー', { from: 'error' }, 'error');
    logger.warn('警告', { from: 'warn' }, 'timer');

    const errors = logger.getLogsByLevel(LogLevel.ERROR);
    const uiLogs = logger.getLogsByCategory('ui');

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('重大エラー');
    expect(uiLogs).toHaveLength(1);
    expect(uiLogs[0].message).toBe('通常情報');
  });

  // REQ-5.6
  it('clearLogsで保存済みログがクリアされる', () => {
    logger.info('削除対象ログ', {}, 'system');
    expect(logger.getStoredLogs().length).toBeGreaterThan(0);

    logger.clearLogs();
    const logs = logger.getStoredLogs();

    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('Logs cleared');
  });
});
