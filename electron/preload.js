const { contextBridge, ipcRenderer } = require('electron');

// Electronのメインプロセスとレンダープロセス間の安全な通信を提供
contextBridge.exposeInMainWorld('electronAPI', {
  // アプリケーション情報
  platform: process.platform,
  isElectron: true,

  // 通知機能
  sendNotification: (title, message) => {
    ipcRenderer.send('timer-notification', { title, message });
  },

  // ウィンドウ制御
  minimizeWindow: () => {
    ipcRenderer.send('minimize-window');
  },

  closeWindow: () => {
    ipcRenderer.send('close-window');
  },

  // 自動起動設定
  getAutoLaunch: () => {
    return ipcRenderer.invoke('get-auto-launch');
  },

  setAutoLaunch: (enabled) => {
    return ipcRenderer.invoke('set-auto-launch', enabled);
  },

  // レンダープロセスからのイベント受信
  onShowSettings: (callback) => {
    ipcRenderer.on('show-settings', callback);
  },

  onCreateNewTimer: (callback) => {
    ipcRenderer.on('create-new-timer', callback);
  },

  // イベントリスナーの削除
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// 開発環境でのログ
if (process.env.NODE_ENV === 'development') {
  console.log('Preload script loaded');
}