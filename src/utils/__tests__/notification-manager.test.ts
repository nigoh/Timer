import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationManager } from '../notification-manager';

/** singleton の内部状態をリセット */
const resetSingleton = () => {
  (notificationManager as any).isInitialized = false;
  (notificationManager as any).audioContext = null;
};

/** Notification グローバルを window 直接定義で確実に上書き */
const stubNotification = (permission: string, requestPermission?: ReturnType<typeof vi.fn>) => {
  const rp = requestPermission ?? vi.fn();
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    writable: true,
    value: Object.assign(vi.fn(), { permission, requestPermission: rp }),
  });
  return rp;
};

describe('notificationManager', () => {
  beforeEach(() => {
    resetSingleton();
    // AudioContext 非対応状態をデフォルトとして設定
    vi.stubGlobal('AudioContext', undefined);
    (window as any).webkitAudioContext = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ─── ensureInitialized() ───────────────────────────────────────────────
  describe('ensureInitialized()', () => {
    // TC-NM-01
    // AudioContext 作成をスキップするため audioContext を事前注入し、
    // Notification チェック部分のみを検証する
    it('Notification.permission=default のとき requestPermission が呼ばれる', async () => {
      // audioContext を直接注入して AudioContext コンストラクタをスキップ
      (notificationManager as any).audioContext = { state: 'suspended', resume: vi.fn() };
      const requestPermission = stubNotification('default');

      await notificationManager.ensureInitialized();

      expect(requestPermission).toHaveBeenCalled();
    });

    // TC-NM-02
    it('Notification.permission=granted のとき requestPermission が呼ばれない', async () => {
      (notificationManager as any).audioContext = { state: 'suspended', resume: vi.fn() };
      const requestPermission = stubNotification('granted');

      await notificationManager.ensureInitialized();

      expect(requestPermission).not.toHaveBeenCalled();
    });

    // TC-NM-03
    it('AudioContext 非対応のとき throw しない', async () => {
      // audioContext = null + AudioContext = undefined → 早期 return するだけで例外なし
      await expect(notificationManager.ensureInitialized()).resolves.toBeUndefined();
    });
  });

  // ─── notify() ────────────────────────────────────────────────────────
  describe('notify()', () => {
    // TC-NM-04
    it('permission=granted のとき new Notification() が呼ばれる', async () => {
      const NotificationMock = vi.fn();
      vi.stubGlobal('Notification', Object.assign(NotificationMock, { permission: 'granted' }));

      await notificationManager.notify('テスト通知');

      expect(NotificationMock).toHaveBeenCalled();
    });

    // TC-NM-05
    it('permission=denied のとき new Notification() が呼ばれない', async () => {
      const NotificationMock = vi.fn();
      vi.stubGlobal('Notification', Object.assign(NotificationMock, { permission: 'denied' }));

      await notificationManager.notify('テスト通知');

      expect(NotificationMock).not.toHaveBeenCalled();
    });

    // TC-NM-06
    it('title と body が Notification コンストラクタへ渡される', async () => {
      const NotificationMock = vi.fn();
      vi.stubGlobal('Notification', Object.assign(NotificationMock, { permission: 'granted' }));

      await notificationManager.notify('タイトル', { body: 'メッセージ本文' });

      expect(NotificationMock).toHaveBeenCalledWith(
        'タイトル',
        expect.objectContaining({ body: 'メッセージ本文' }),
      );
    });
  });
});
