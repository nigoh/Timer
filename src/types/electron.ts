// Electron API types for TypeScript
export interface ElectronAPI {
  // アプリケーション情報
  platform: NodeJS.Platform;
  isElectron: true;

  // 通知機能
  sendNotification: (title: string, message: string) => void;

  // ウィンドウ制御
  minimizeWindow: () => void;
  closeWindow: () => void;

  // 自動起動設定
  getAutoLaunch: () => Promise<boolean>;
  setAutoLaunch: (enabled: boolean) => Promise<boolean>;

  // イベント受信
  onShowSettings: (callback: () => void) => void;
  onCreateNewTimer: (callback: () => void) => void;

  // イベントリスナーの削除
  removeAllListeners: (channel: string) => void;
}

// グローバルな electronAPI の型定義
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}