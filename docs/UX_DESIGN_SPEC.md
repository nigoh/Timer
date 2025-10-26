# 🎯 UX親しみめE��ぁE��ザイン仕様書

## 📱 全体デザイン方釁E

### 🎨 親しみめE��さを重視したUX設訁E
- **1タチE�E操佁E*: 最重要な操作（開姁E停止�E��E大きなボタンで直感的に
- **視覚的フィードバチE��**: 色相変化とアイコンで状況を即座に琁E��
- **カード�EースレイアウチE*: 惁E��の整琁E��見やすさを両竁E
- **レスポンシブ対忁E*: チE��クトップ�EタブレチE��・モバイル完�E対忁E

## 🚀 会議タイマ�E新仕槁E

### 📋 基本構造
```
会議�E�Eeeting�E�E
├── 褁E��のアジェンダ�E�Egenda�E�E
━E  ├── タイトル
━E  ├── 予定時閁E
━E  └── メモ
└── 設宁E
    ├── 自動�E移
    ├── サイレントモーチE
    └── ベル設宁E
```

### ⏱�E�Eタイマ�E機�E

#### 1タチE�E開姁E
- **大きな冁E��ボタン**: 画面中央に配置、タチE�Eしやすいサイズ
- **開姁E*: 緑色の再生ボタン + "開姁EチE��スチE
- **一時停止**: オレンジ色の一時停止ボタン + "一時停止"チE��スチE

#### 進捗表示
- **リアルタイム更新**: 残り時間を秒単位で表示
- **進捗バー**: 0%ↁE00%ↁE50%まで対応（趁E��表示�E�E
- **パ�EセンチE�Eジ表示**: 小数点1桁まで正確表示

#### 色相シスチE��
```css
/* 70%まで�E�緑（余裕！E*/
.progress-safe {
  background: #10b981; /* bg-green-500 */
  color: #059669; /* text-green-600 */
}

/* 71-90%�E�橙（残り少！E*/
.progress-warning {
  background: #f97316; /* bg-orange-500 */
  color: #ea580c; /* text-orange-600 */
}

/* 91-100%�E�赤�E�E到達！E*/
.progress-critical {
  background: #ef4444; /* bg-red-500 */
  color: #dc2626; /* text-red-600 */
}

/* 101%以上：紫�E�趁E���E�E*/
.progress-overtime {
  background: #8b5cf6; /* bg-purple-500 */
  color: #7c3aed; /* text-purple-600 */
}
```

### 🔔 多段ベルシスチE��

#### ベル音の種顁E
1. **単発ベル** (`bell-single.mp3`)
   - 短ぁE回�Eベル音
   - 通常の通知に使用

2. **二打ベル** (`bell-double.mp3`)
   - 2回連続�Eベル音
   - 重要な通知に使用

3. **ループ�Eル** (`bell-loop.mp3`)
   - 5秒間のループ音
   - 緊急時�E趁E��時に使用

#### 通知タイミング
- **開始時**: アジェンダ開姁E
- **残り5刁E*: 終亁E��近�E警呁E
- **終亁E��**: 予定時間�E終亁E
- **趁E��晁E*: 1刁E���E趁E��警呁E

#### サイレントモーチE
- **音声OFF**: すべてのベル音を無効匁E
- **バイブレーション**: `navigator.vibrate([200, 100, 200])`
- **視覚通知**: ブラウザ通知のみ表示

### ⚙︁E遷移シスチE��

#### 自動�E移
```typescript
// 設定でON/OFF刁E��可能
settings: {
  autoTransition: boolean; // チE��ォルチE false
}

// 自動�E移の流れ
currentAgenda.status = 'completed'
  ↁE1秒征E��E
nextAgenda.status = 'running' (自動開始�E場吁E
```

#### 手動遷移
- **次へボタン**: 現在のアジェンダを完亁E��態に変更
- **前へボタン**: 前�Eアジェンダに戻めE
- **停止ボタン**: 全体を一時停止状態に

### 📱 バックグラウンド対忁E

#### 時間同期メカニズム
```typescript
// 最後�Etick時刻を記録
lastTickTime: number;

// 復帰時�E誤差補正
const timeDiff = now - lastTickTime;
currentTime += Math.round(timeDiff / 1000);
```

#### ローカル通知
- **アジェンダ墁E��**: 自動�E移時�E通知
- **Permission管琁E*: 初回起動時の権限リクエスチE
- **タグ付き通知**: 重褁E��止機�E

## 🎨 コンポ�Eネント設訁E

### メインタイマ�E表示
```tsx
<TimerDisplay>
  ├── ヘッダー�E�アジェンダ名�EスチE�Eタス�E�E
  ├── 時間表示�E�大きなフォント�E残り時間�E�E
  ├── 進捗バー�E�色相変化・パ�EセンチE�Eジ�E�E
  ├── 1タチE�E開始�Eタン�E�中央配置�E�E
  └── 制御ボタン�E�前へ・停止・次へ�E�E
</TimerDisplay>
```

### アジェンダ一覧
```tsx
<AgendaList>
  ├── ヘッダー�E�追加ボタン�E�E
  └── アジェンダカード[]
      ├── スチE�Eタスアイコン
      ├── タイトル・メモ
      ├── 時間惁E���E�予定�E実績�E�E
      ├── 進捗バー
      └── 編雁E�E削除ボタン
</AgendaList>
```

### 設定ダイアログ
```tsx
<SettingsDialog>
  ├── 基本設宁E
  ━E  ├── 自動�E移
  ━E  └── サイレントモーチE
  └── ベル通知設宁E
      ├── 音の種類選抁E
      └── 通知タイミング設宁E
</SettingsDialog>
```

## 📊 状態管琁E

### Zustandストア構造
```typescript
interface AgendaTimerState {
  // 会議チE�Eタ
  currentMeeting: Meeting | null;
  meetings: Meeting[];
  
  // タイマ�E状慁E
  isRunning: boolean;
  currentTime: number;
  lastTickTime?: number; // バックグラウンド対忁E
  
  // アクション
  startTimer: () => void;
  pauseTimer: () => void;
  nextAgenda: () => void;
  syncTime: () => void; // 時間同期
}
```

## 🔧 技術スタチE��

### 新規追加コンポ�EネンチE
- `bellSoundManager.ts`: 音声管琁E��ーチE��リチE��
- `NewAgendaTimer.tsx`: 新仕様�Eメインコンポ�EネンチE
- `features/timer/stores/new-agenda-timer-store.ts`: Zustand状態管琁E

### UI/UXライブラリ
- **shadcn/ui**: Switch, Slider, Progress, Select, Textarea
- **Lucide React**: アイコンセチE���E�親しみめE��ぁE��ザイン�E�E
- **Tailwind CSS**: レスポンシブ�E色相シスチE��

## 🎯 ユーザー体騁E

### 使ぁE��すさの特徴
1. **直感的操佁E*: 1タチE�Eで開始、視覚的フィードバチE��
2. **惁E��の整琁E*: カード�Eースで惁E��を�EかりめE��く表示
3. **状況認譁E*: 色とアイコンで現在の状況を即座に把握
4. **柔軟な設宁E*: 自勁E手動の刁E��、E��声のカスタマイズ

### アクセシビリチE��
- **キーボ�Eド操佁E*: タブナビゲーション対忁E
- **スクリーンリーダー**: ARIA属性による音声読み上げ
- **色覚対忁E*: アイコンと色の併用による惁E��伝達
- **レスポンシチE*: 様、E��チE��イスサイズに対忁E

## 📈 パフォーマンス

### 最適化�EインチE
- **useCallback**: 重い処琁E�E最適匁E
- **バックグラウンド対忁E*: 正確な時間同期
- **音声管琁E*: Web Audio APIによる高品質再生
- **状態管琁E*: Zustandによる効玁E��な状態更新

こ�E新仕様により、会議タイマ�Eはより親しみめE��く、使ぁE��すいチE��インに進化しました、E

