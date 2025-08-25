import { useEffect, useState, useCallback } from 'react';
import type { ElectronAPI } from '../types/electron';

// Electron API 使用のためのカスタムフック
export const useElectron = () => {
  const [isElectronApp, setIsElectronApp] = useState(false);
  const [electronAPI, setElectronAPI] = useState<ElectronAPI | null>(null);

  useEffect(() => {
    // Electron環境での実行確認
    if (typeof window !== 'undefined' && window.electronAPI) {
      setIsElectronApp(true);
      setElectronAPI(window.electronAPI);
    }
  }, []);

  // 通知送信
  const sendNotification = useCallback((title: string, message: string) => {
    if (electronAPI) {
      electronAPI.sendNotification(title, message);
    } else {
      // ブラウザ環境での代替実装
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
      }
    }
  }, [electronAPI]);

  // ウィンドウ最小化
  const minimizeWindow = useCallback(() => {
    if (electronAPI) {
      electronAPI.minimizeWindow();
    }
  }, [electronAPI]);

  // ウィンドウ閉じる
  const closeWindow = useCallback(() => {
    if (electronAPI) {
      electronAPI.closeWindow();
    } else {
      // ブラウザ環境では何もしない
      console.log('Window close requested (browser environment)');
    }
  }, [electronAPI]);

  // 自動起動設定の取得
  const getAutoLaunch = useCallback(async (): Promise<boolean> => {
    if (electronAPI) {
      return await electronAPI.getAutoLaunch();
    }
    return false;
  }, [electronAPI]);

  // 自動起動設定の変更
  const setAutoLaunch = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (electronAPI) {
      return await electronAPI.setAutoLaunch(enabled);
    }
    return false;
  }, [electronAPI]);

  // プラットフォーム取得
  const platform = electronAPI?.platform || 'browser';

  return {
    isElectronApp,
    electronAPI,
    platform,
    sendNotification,
    minimizeWindow,
    closeWindow,
    getAutoLaunch,
    setAutoLaunch,
  };
};

// Electron イベントリスナー用のカスタムフック
export const useElectronEvents = () => {
  const { electronAPI } = useElectron();

  // 設定画面表示イベント
  const onShowSettings = useCallback((callback: () => void) => {
    if (electronAPI) {
      electronAPI.onShowSettings(callback);
      // クリーンアップ関数を返す
      return () => {
        electronAPI.removeAllListeners('show-settings');
      };
    }
    return () => {};
  }, [electronAPI]);

  // 新しいタイマー作成イベント
  const onCreateNewTimer = useCallback((callback: () => void) => {
    if (electronAPI) {
      electronAPI.onCreateNewTimer(callback);
      // クリーンアップ関数を返す
      return () => {
        electronAPI.removeAllListeners('create-new-timer');
      };
    }
    return () => {};
  }, [electronAPI]);

  return {
    onShowSettings,
    onCreateNewTimer,
  };
};