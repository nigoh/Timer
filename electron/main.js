const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// セキュリティの設定
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

class TimerApp {
  constructor() {
    this.mainWindow = null;
    this.tray = null;
    this.isQuitting = false;
  }

  async createWindow() {
    // メインウィンドウの作成
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: this.getIcon(),
      show: false, // 初期状態では非表示
      title: 'Timer App - 業務効率化タイマー',
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    });

    // ウィンドウの準備完了時に表示
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      // 開発環境の場合はDevToolsを開く
      if (isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // ウィンドウが閉じられる時の処理
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow.hide();
        this.showNotification('Timer App', 'アプリはシステムトレイで動作しています');
      }
    });

    // ウィンドウが閉じられた時
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // 外部リンクは既定のブラウザで開く
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // アプリケーションの読み込み
    const startUrl = isDev 
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, '../dist/index.html')}`;
    
    await this.mainWindow.loadURL(startUrl);
  }

  createTray() {
    const iconPath = this.getIcon();
    this.tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '表示',
        click: () => this.showWindow()
      },
      {
        label: '設定',
        click: () => this.showSettings()
      },
      { type: 'separator' },
      {
        label: 'Timer App について',
        click: () => this.showAbout()
      },
      { type: 'separator' },
      {
        label: '終了',
        click: () => this.quit()
      }
    ]);

    this.tray.setToolTip('Timer App - 業務効率化タイマー');
    this.tray.setContextMenu(contextMenu);

    // トレイアイコンをダブルクリックしたらウィンドウを表示
    this.tray.on('double-click', () => {
      this.showWindow();
    });
  }

  getIcon() {
    // アイコンファイルのパス（プラットフォーム別）
    const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
    const iconPath = path.join(__dirname, 'assets', iconName);
    
    // アイコンが存在しない場合はデフォルトアイコンを作成
    try {
      return nativeImage.createFromPath(iconPath);
    } catch (error) {
      // デフォルトアイコンを作成（16x16の白いアイコン）
      return nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVDiNpZM9SwNBEIafgwQLwcJCG1sLG1sLbW1tLLSxsLGwsLCwsLGwsLCwsLGwsLCwsLGwsLCwsLGwsLCwsLGwsLCwsLGwsLCwsLCwsLGwsLCwsLCwsLGwsLCwsLCwsLCwsLGwsLCwsLCwsLCwsLGwsLCwsLCwsLCwsLGwsLCwsLCwsLCwsLGwsLCwsLCwsLCwsLGwsLCwsLCwsLCwsLGwsLCwsLCwsLCwsLGwsLCwsLCwsLCwsLGwsLCwsLCw');
    }
  }

  createMenu() {
    const template = [
      {
        label: 'ファイル',
        submenu: [
          {
            label: '新しいタイマー',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.createNewTimer()
          },
          { type: 'separator' },
          {
            label: process.platform === 'darwin' ? '終了' : '終了(&X)',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => this.quit()
          }
        ]
      },
      {
        label: '表示',
        submenu: [
          { role: 'reload', label: '再読み込み' },
          { role: 'forceReload', label: '強制再読み込み' },
          { role: 'toggleDevTools', label: '開発者ツール' },
          { type: 'separator' },
          { role: 'resetZoom', label: 'ズームリセット' },
          { role: 'zoomIn', label: 'ズームイン' },
          { role: 'zoomOut', label: 'ズームアウト' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: 'フルスクリーン' }
        ]
      },
      {
        label: 'ウィンドウ',
        submenu: [
          { role: 'minimize', label: '最小化' },
          { role: 'close', label: '閉じる' }
        ]
      },
      {
        label: 'ヘルプ',
        submenu: [
          {
            label: 'Timer App について',
            click: () => this.showAbout()
          }
        ]
      }
    ];

    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about', label: 'Timer App について' },
          { type: 'separator' },
          { role: 'services', label: 'サービス', submenu: [] },
          { type: 'separator' },
          { role: 'hide', label: 'Timer App を隠す' },
          { role: 'hideothers', label: '他を隠す' },
          { role: 'unhide', label: 'すべて表示' },
          { type: 'separator' },
          { role: 'quit', label: 'Timer App を終了' }
        ]
      });

      // Windowメニューの調整
      template[3].submenu = [
        { role: 'close', label: '閉じる' },
        { role: 'minimize', label: '最小化' },
        { role: 'zoom', label: 'ズーム' },
        { type: 'separator' },
        { role: 'front', label: '最前面に移動' }
      ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  showWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  showSettings() {
    // 設定ページへの遷移をレンダープロセスに送信
    if (this.mainWindow) {
      this.mainWindow.webContents.send('show-settings');
    }
  }

  showAbout() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Timer App について',
      message: 'Timer App',
      detail: '業務効率化を目的とした多機能タイマーアプリケーション\n\nVersion: ' + app.getVersion(),
      buttons: ['OK']
    });
  }

  createNewTimer() {
    // 新しいタイマー作成をレンダープロセスに送信
    if (this.mainWindow) {
      this.mainWindow.webContents.send('create-new-timer');
    }
  }

  showNotification(title, body) {
    if (this.tray && !this.mainWindow.isVisible()) {
      this.tray.displayBalloon({
        title: title,
        content: body
      });
    }
  }

  quit() {
    this.isQuitting = true;
    app.quit();
  }

  setupIPC() {
    // タイマー通知
    ipcMain.on('timer-notification', (event, data) => {
      this.showNotification(data.title, data.message);
    });

    // ウィンドウ制御
    ipcMain.on('minimize-window', () => {
      if (this.mainWindow) {
        this.mainWindow.minimize();
      }
    });

    ipcMain.on('close-window', () => {
      if (this.mainWindow) {
        this.mainWindow.close();
      }
    });

    // 自動起動設定
    ipcMain.handle('get-auto-launch', () => {
      return app.getLoginItemSettings().openAtLogin;
    });

    ipcMain.handle('set-auto-launch', (event, enabled) => {
      app.setLoginItemSettings({
        openAtLogin: enabled
      });
      return enabled;
    });
  }

  async initialize() {
    // Electronアプリの初期化完了を待つ
    await app.whenReady();

    // ウィンドウとメニューの作成
    await this.createWindow();
    this.createMenu();
    this.createTray();
    this.setupIPC();

    // 自動更新の設定（本番環境のみ）
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }

    console.log('Timer App が起動しました');
  }
}

// アプリケーションの実行
const timerApp = new TimerApp();

app.on('ready', () => {
  timerApp.initialize();
});

app.on('window-all-closed', () => {
  // macOS以外では、すべてのウィンドウが閉じられたらアプリを終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  // macOSでDockアイコンをクリックした時にウィンドウを再作成
  if (BrowserWindow.getAllWindows().length === 0) {
    await timerApp.createWindow();
  } else {
    timerApp.showWindow();
  }
});

app.on('before-quit', () => {
  timerApp.isQuitting = true;
});

// セキュリティ: 新しいウィンドウの作成を制限
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, url) => {
    navigationEvent.preventDefault();
    shell.openExternal(url);
  });
});

module.exports = timerApp;