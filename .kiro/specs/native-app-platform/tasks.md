# タスク計画: モバイルアプリ・Windows アプリケーション化

## フェーズ概要

全体を 4 フェーズに分割し、段階的にネイティブプラットフォーム対応を進める。
各フェーズは独立してリリース可能であり、前フェーズの完了が次フェーズの前提となる。

---

## フェーズ 1: PWA 化（基盤整備）

> 目的: 最小工数でモバイル・デスクトップの両方にインストール可能にし、オフライン動作を確保する。

### タスク 1.1: PWA マニフェストを作成する

- [ ] `public/manifest.json` を作成する（name, short_name, icons, start_url, display, theme_color）
- [ ] `index.html` に `<link rel="manifest" href="/manifest.json">` を追加する
- [ ] `index.html` に `<meta name="theme-color">` を追加する
- [ ] PWA 用アイコン（192x192, 512x512）を `public/icons/` に配置する

### タスク 1.2: Service Worker を導入する

- [ ] `vite-plugin-pwa` を devDependencies に追加する
- [ ] `vite.config.ts` に VitePWA プラグインを設定する（generateSW モード）
- [ ] キャッシュ戦略を設定する（App Shell: CacheFirst、API: NetworkFirst）
- [ ] オフライン時のフォールバックページ `public/offline.html` を作成する（アプリ名とオフライン状態の説明を表示）

### タスク 1.3: プラットフォーム抽象レイヤーを作成する

- [ ] `src/services/platform/platform-service.ts` に `PlatformService` interface を定義する
- [ ] `src/services/platform/web-platform.ts` に `WebPlatformService` を実装する
- [ ] `src/services/platform/index.ts` にプラットフォーム自動検出ロジックを実装する
- [ ] `src/utils/notification-manager.ts` を `PlatformService` 経由に段階的に移行する

### タスク 1.4: 品質ゲートを実行する

- [ ] `npm run type-check` が通過すること
- [ ] `npm run test:run` が全件通過すること
- [ ] `npm run build` が成功すること
- [ ] Lighthouse PWA 監査でインストール可能と判定されること

---

## フェーズ 2: Tauri によるWindowsデスクトップアプリ化

> 目的: Windows ネイティブアプリとして配布し、トレイ常駐・OS 通知を実現する。

### タスク 2.1: Tauri プロジェクトを初期化する

- [ ] `npm install -D @tauri-apps/cli@latest` を実行する
- [ ] `npx tauri init` でプロジェクトを初期化する（frontendDist: `../dist`, devUrl: `http://localhost:3000`）
- [ ] `src-tauri/tauri.conf.json` のアプリ名・ウィンドウサイズ・アイコンを設定する
- [ ] `package.json` に `"tauri": "tauri"` スクリプトを追加する

### タスク 2.2: TauriPlatformService を実装する

- [ ] `src/services/platform/tauri-platform.ts` に `TauriPlatformService` を実装する
- [ ] `@tauri-apps/plugin-notification` による OS ネイティブ通知を実装する
- [ ] `@tauri-apps/plugin-store` によるデータ永続化を実装する
- [ ] `src/services/platform/index.ts` にTauri 検出ロジックを追加する（`window.__TAURI__` の存在チェック）

### タスク 2.3: システムトレイを実装する

- [ ] `src-tauri/tauri.conf.json` にトレイアイコン設定を追加する
- [ ] ウィンドウ閉じる操作時にトレイ最小化するロジックを `main.rs` に追加する
- [ ] トレイメニュー（表示/非表示・終了）を実装する

### タスク 2.4: 自動アップデート機能を実装する

- [ ] `@tauri-apps/plugin-updater` を設定する
- [ ] `tauri signer generate` コマンドで署名キーペア（公開鍵・秘密鍵）を生成する
- [ ] 公開鍵を `tauri.conf.json` の `plugins.updater.pubkey` に設定する
- [ ] 秘密鍵を CI/CD のシークレットとして安全に保管する
- [ ] アップデートサーバーのエンドポイントを設定する（GitHub Releases 利用可）
- [ ] 起動時にアップデートチェックを行うロジックを追加する

### タスク 2.5: Windows ビルド CI を構築する

- [ ] `.github/workflows/build-windows.yml` を作成する
- [ ] GitHub Actions で Rust + Tauri CLI のセットアップを設定する
- [ ] ビルド成果物（.msi / .exe）を GitHub Releases に公開する設定を追加する

### タスク 2.6: 品質ゲートを実行する

- [ ] `npm run type-check` が通過すること
- [ ] `npm run test:run` が全件通過すること
- [ ] `npm run tauri build` が Windows 向けバイナリを生成すること
- [ ] インストーラー実行からアプリ起動まで正常に動作すること

---

## フェーズ 3: Android モバイルアプリ化

> 目的: Android ネイティブアプリとして配布し、プッシュ通知・バックグラウンドタイマーを実現する。

### タスク 3.1: モバイルビルド環境を構築する

- [ ] Tauri 2.x Mobile（または Capacitor）を選定する（時点での成熟度で判断）
- [ ] Android SDK・NDK をセットアップする
- [ ] `npx tauri android init`（または `npx cap add android`）でプロジェクトを初期化する

### タスク 3.2: モバイル固有の UI 調整を行う

- [ ] タッチ操作に最適化したボタンサイズ・タップ領域を確認・調整する
- [ ] モバイルビューポートでのレイアウト崩れを修正する
- [ ] サイドバーをモバイルではドロワー表示に切り替える（既存レスポンシブ対応を確認）

### タスク 3.3: バックグラウンドタイマーを実装する

- [ ] ネイティブバックグラウンドサービスプラグインを導入する
- [ ] アプリバックグラウンド時のタイマー継続ロジックを実装する
- [ ] フォアグラウンド復帰時の時刻補正ロジックを確認する（既存の `lastTickTime` 補正を活用）

### タスク 3.4: プッシュ通知を実装する

- [ ] ネイティブプッシュ通知プラグインを導入する
- [ ] タイマー完了時のプッシュ通知を実装する
- [ ] 通知のパーミッション取得フローを実装する

### タスク 3.5: Android ビルド CI を構築する

- [ ] `.github/workflows/build-android.yml` を作成する
- [ ] GitHub Actions で Android SDK のセットアップを設定する
- [ ] ビルド成果物（.apk / .aab）を Artifact として保存する設定を追加する

### タスク 3.6: 品質ゲートを実行する

- [ ] `npm run type-check` が通過すること
- [ ] `npm run test:run` が全件通過すること
- [ ] Android ビルドが成功し、APK が生成されること
- [ ] 実機またはエミュレータでスモークテストが通過すること

---

## フェーズ 4: iOS モバイルアプリ化

> 目的: iOS ネイティブアプリとして配布する。

### タスク 4.1: iOS ビルド環境を構築する

- [ ] macOS 環境で Xcode をセットアップする
- [ ] `npx tauri ios init`（または `npx cap add ios`）でプロジェクトを初期化する
- [ ] CocoaPods / Swift Package Manager の依存解決を行う

### タスク 4.2: iOS 固有の調整を行う

- [ ] Safe Area（ノッチ・ホームバー）への対応を確認・修正する
- [ ] iOS のバックグラウンド実行ポリシーに適合するタイマー戦略を実装する
- [ ] iOS プッシュ通知（APNs）の設定・テストを行う

### タスク 4.3: App Store 申請準備を行う

- [ ] App Store Connect でアプリ登録を行う
- [ ] スクリーンショット・説明文・プライバシーポリシーを準備する
- [ ] TestFlight でベータ配布を行い、動作確認する

### タスク 4.4: 品質ゲートを実行する

- [ ] iOS ビルドが成功し、IPA が生成されること
- [ ] 実機またはシミュレータでスモークテストが通過すること
- [ ] App Store 審査基準への適合を確認すること
