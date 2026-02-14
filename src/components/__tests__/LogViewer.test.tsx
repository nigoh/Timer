import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger, LogLevel } from '@/utils/logger';

const { mockLogger, mockLogLevel } = vi.hoisted(() => ({
  mockLogger: {
    getStoredLogs: vi.fn(),
    getLogStatistics: vi.fn(),
    exportLogs: vi.fn(),
    clearLogs: vi.fn(),
  },
  mockLogLevel: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4,
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: mockLogger,
  LogLevel: mockLogLevel,
}));

describe('LogViewer logger mock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger.getStoredLogs.mockReturnValue([
      {
        id: 'log-1',
        timestamp: new Date('2025-01-01T00:00:00.000Z'),
        level: LogLevel.INFO,
        category: 'ui',
        message: 'テストログ',
      },
    ]);
    mockLogger.getLogStatistics.mockReturnValue({
      total: 1,
      byLevel: {
        [LogLevel.ERROR]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.INFO]: 1,
        [LogLevel.DEBUG]: 0,
        [LogLevel.TRACE]: 0,
      },
      byCategory: { ui: 1 },
      oldestEntry: new Date('2025-01-01T00:00:00.000Z'),
      newestEntry: new Date('2025-01-01T00:00:00.000Z'),
    });
  });

  it('beforeEach で設定した mockLogger を利用できる', () => {
    const logs = logger.getStoredLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.message).toBe('テストログ');
    expect(mockLogger.getStoredLogs).toHaveBeenCalledTimes(1);
  });
});
