# 要件定義: データ永続化

## はじめに

データ永続化は、Focuso の全タイマーストア（基本タイマー / ポモドーロ / 複数タイマー / アジェンダタイマー）のユーザーデータをブラウザリロード後も保持する機能である。
ユーザーはタイマー設定・実行履歴・会議データを失うことなく、継続的にアプリケーションを利用できる。
将来的なデータベース移行（IndexedDB / リモートDB）に対応可能なストレージ抽象レイヤーを導入する。

## 要件

### 要件 1: ストレージアダプター抽象化

**目的:** 開発者として、ストレージバックエンドを抽象化したい。そうすれば、将来的に localStorage から IndexedDB やリモートDB へ移行する際、ストア側の変更を最小限に抑えられる。

#### 受け入れ基準

1. The システム shall `IStorageProvider` インターフェース（`getItem` / `setItem` / `removeItem`）を提供する
2. The システム shall デフォルトで `LocalStorageProvider`（localStorage ラッパー）を使用する
3. The システム shall `setStorageProvider()` で任意のストレージプロバイダーに差し替えできる
4. The システム shall 同期・非同期の両方のストレージプロバイダーをサポートする

### 要件 2: 基本タイマーの永続化

**目的:** ユーザーとして、基本タイマーの設定と実行履歴をブラウザリロード後も保持したい。そうすれば、作業の振り返りやタイマー設定のやり直しが不要になる。

#### 受け入れ基準

1. When ユーザーがブラウザをリロードする, the システム shall 基本タイマーの設定時間（duration）を復元する
2. When ユーザーがブラウザをリロードする, the システム shall セッションラベル（sessionLabel）を復元する
3. When ユーザーがブラウザをリロードする, the システム shall 実行履歴（history）を復元する
4. When ユーザーがブラウザをリロードする, the システム shall ランタイム状態（isRunning, lastTickTime 等）をデフォルト値にリセットする
5. When データが復元される, the システム shall remainingTime を保存された duration から復元する

### 要件 3: ポモドーロの永続化

**目的:** ユーザーとして、ポモドーロの設定・統計・セッション履歴をブラウザリロード後も保持したい。そうすれば、カスタマイズした作業/休憩時間と日次統計を維持できる。

#### 受け入れ基準

1. When ユーザーがブラウザをリロードする, the システム shall ポモドーロ設定（workDuration, shortBreakDuration, longBreakDuration, longBreakInterval, autoStart 設定）を復元する
2. When ユーザーがブラウザをリロードする, the システム shall 本日の統計（completedPomodoros, totalFocusTime, totalBreakTime, efficiency）を復元する
3. When ユーザーがブラウザをリロードする, the システム shall セッション履歴を復元する
4. When データが復元される, the システム shall ランタイム状態（isRunning, timeRemaining, currentPhase 等）をデフォルト値にリセットする

### 要件 4: 複数タイマーの永続化

**目的:** ユーザーとして、複数タイマーの定義・カテゴリ・設定をブラウザリロード後も保持したい。そうすれば、タイマーの再作成が不要になる。

#### 受け入れ基準

1. When ユーザーがブラウザをリロードする, the システム shall タイマー定義（名前, 時間, カテゴリ, 色）を復元する
2. When ユーザーがブラウザをリロードする, the システム shall カテゴリ一覧を復元する
3. When ユーザーがブラウザをリロードする, the システム shall グローバル設定（autoStartNext, showNotifications, soundEnabled）を復元する
4. When ユーザーがブラウザをリロードする, the システム shall セッション履歴を復元する
5. When データが復元される, the システム shall タイマーの実行状態（isRunning, isPaused）を停止状態にリセットする
6. When データが復元される, the システム shall タイマーの remainingTime を元の duration にリセットする（完了済みタイマーは 0 を維持）

### 要件 5: アジェンダタイマーの永続化

**目的:** ユーザーとして、会議データ（会議一覧・議題・設定）をブラウザリロード後も保持したい。そうすれば、会議情報の再入力が不要になる。

#### 受け入れ基準

1. When ユーザーがブラウザをリロードする, the システム shall 会議一覧（meetings）を復元する
2. When ユーザーがブラウザをリロードする, the システム shall 現在選択中の会議（currentMeeting）を復元する
3. When データが復元される, the システム shall ランタイム状態（isRunning, currentTime, meetingStartTime, lastTickTime）をデフォルト値にリセットする

### 要件 6: セキュリティ

**目的:** ユーザーとして、機密情報が永続化されないことを保証したい。そうすれば、セキュリティリスクを最小限に抑えられる。

#### 受け入れ基準

1. The システム shall API キー・PAT を永続化対象から除外する
2. The システム shall `partialize` により各ストアの永続化対象フィールドを明示的に制御する
