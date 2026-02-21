# 設計書: リアルタイム音声認識（文字起こし）機能

> **ステータス**: 設計中
> **関連ドキュメント**: [REQUIREMENTS.md](./REQUIREMENTS.md) / [TECHNICAL_SPECS.md](./TECHNICAL_SPECS.md) / [UX_DESIGN_SPEC.md](./UX_DESIGN_SPEC.md)

---

## 1. 概要・目標

会議中にマイクから発言をリアルタイムで文字起こしし、アジェンダタイマーの議事録入力を補助する。

**主な目標**

- 会議の発言をリアルタイムにテキスト化し、議題ごとの議事録作成コストを削減する。
- 外部 API キーを不要とし、ブラウザ内蔵 Web Speech API のみで動作させる。
- 文字起こし結果はユーザーが確認してから議事録フィールドへ挿入する（自動反映はしない）。

**スコープ外（本フェーズ）**

- 音声コマンドによるタイマー操作（次議題への遷移・開始・停止等）
- 外部 STT API（DeepGram / Azure / Google Cloud）との連携
- 録音データのファイル保存・サーバーアップロード
- 話者識別（Speaker Diarization）

---

## 2. ブラウザ対応状況

| ブラウザ     | Web Speech API | 備考                     |
| ------------ | -------------- | ------------------------ |
| Chrome 33+   | ✅ 対応         | 高精度・継続認識可       |
| Edge 79+     | ✅ 対応         | Chromium ベース          |
| Firefox      | ❌ 非対応       | 2026年2月時点で未実装    |
| Safari 14.1+ | ⚠️ 限定対応     | 短文認識のみ・継続不安定 |

非対応環境では録音ボタンをグレーアウト + ツールチップで理由を表示し、既存の手動入力フローは継続できる。

---

## 3. アーキテクチャ概要

```
[マイク]
   |
   ▼
SpeechRecognition API（ブラウザ内蔵）
   |
   ▼
voice-recognition-service.ts
  ・SpeechRecognition ラッパー
  ・自動再起動（Chrome 約1分自動停止対策）
  ・言語切り替え（ja-JP / en-US）
  ・マイク権限エラーハンドリング
   |
   ▼
useVoiceRecognition.ts（hook）
  ・interim / confirmed テキスト管理
  ・voice-store への書き込み
   |
   ▼
voice-store.ts（Zustand）
  ・isListening / isSupported / language
  ・interimTranscript（暫定テキスト）
  ・confirmedEntries（確定済みエントリリスト）
  ・error 状態
   |
   ├─────────────────────┐
   ▼                     ▼
VoiceRecognitionButton   VoiceTranscriptPanel（折りたたみ）
（録音開始/停止 UI）       ・リアルタイムテキスト表示
                          ・「議事録に追加」ボタン
                               |
               ┌───────────────┴───────────────┐
         議題が markdown 形式               議題が richtext 形式
               ▼                                   ▼
       直接 minutesContent                VoiceTranscriptSummaryDialog
       末尾にテキスト挿入                  ・生テキスト表示
       （Markdown フォーマット）           ・AI 要約生成
               |                          ・ユーザー編集・確認
               |                               |
               └───────────┬───────────────────┘
                            ▼
                    agenda-timer-store
                    .updateAgendaItem({ minutesContent })
                    ※ richtext の場合は Quill Delta API 経由
```

---

## 4. ファイル構成

### 新規追加ファイル

```
src/
├── types/
│   └── voice.ts                                    # 音声認識ドメイン型
├── features/timer/
│   ├── services/
│   │   └── voice-recognition-service.ts            # SpeechRecognition ラッパー
│   ├── hooks/
│   │   └── useVoiceRecognition.ts                  # React フック
│   ├── stores/
│   │   └── voice-store.ts                          # Zustand ストア
│   └── components/
│       └── voice/
│           ├── VoiceRecognitionButton.tsx           # 録音開始/停止ボタン
│           ├── VoiceTranscriptPanel.tsx             # 文字起こしパネル（折りたたみ）
│           └── VoiceTranscriptSummaryDialog.tsx     # richtext 議題向け AI 要約・挿入ダイアログ
```

### 変更対象サービス

| ファイル                                                   | 変更内容                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/features/timer/services/meeting-ai-assist-service.ts` | `summarizeVoiceTranscript()` 関数を追加（既存の LangChain + AiProviderConfig 基盤を再利用） |

### 変更対象ファイル

| ファイル                                                   | 変更内容                                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/features/timer/components/agenda/AgendaTimerView.tsx` | `VoiceRecognitionButton` / `VoiceTranscriptPanel` を議事録エリア近傍に組み込む |
| `docs/REQUIREMENTS.md`                                     | RQ-03 へ音声文字起こし要件を追記                                               |
| `docs/FEATURES.md`                                         | アジェンダタイマー機能一覧に音声機能を追記                                     |

---

## 5. 型定義

```typescript
// src/types/voice.ts

/** 確定済み文字起こしエントリ */
export interface VoiceTranscriptEntry {
  id: string
  text: string
  timestamp: number        // エポックミリ秒
  agendaId: string | null  // 録音開始時の議題 ID
}

/** voice-store の State */
export interface VoiceState {
  isSupported: boolean
  isListening: boolean
  language: 'ja-JP' | 'en-US'
  interimTranscript: string           // 認識中テキスト（暫定）
  confirmedEntries: VoiceTranscriptEntry[]  // 確定済みエントリ
  error: 'permission-denied' | 'not-supported' | 'network' | 'aborted' | null
}

/** voice-store の Actions */
export interface VoiceActions {
  startListening: (agendaId: string | null) => void
  stopListening: () => void
  setLanguage: (lang: 'ja-JP' | 'en-US') => void
  setInterimTranscript: (text: string) => void
  addConfirmedEntry: (entry: VoiceTranscriptEntry) => void
  clearTranscript: () => void
  setError: (error: VoiceState['error']) => void
  setIsSupported: (val: boolean) => void
  setIsListening: (val: boolean) => void
}
```

---

## 6. サービス設計

### `voice-recognition-service.ts`

```typescript
// 責務: Web Speech API の生ライフサイクルを管理する
// - SpeechRecognition インスタンスの生成・設定・開始・停止
// - Chrome の約1分自動停止に対する onend での自動再起動
// - マイク権限エラー（permission-denied）の捕捉と通知
// - isListening フラグは外部（hook）の ref で制御し、
//   サービス自身は「再起動すべきか」の判定のみ行う

interface VoiceRecognitionCallbacks {
  onInterim: (text: string) => void
  onConfirmed: (text: string) => void
  onError: (error: VoiceState['error']) => void
  onStopped: () => void
}

class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null
  private shouldRestart: boolean = false

  isSupported(): boolean
  start(lang: 'ja-JP' | 'en-US', callbacks: VoiceRecognitionCallbacks): void
  stop(): void
  setLanguage(lang: 'ja-JP' | 'en-US'): void
}
```

**自動再起動ロジック（疑似コード）**

```
onend イベント発火
  └─ shouldRestart === true
       ├─ YES → recognition.start() を200ms後に再呼び出し
       └─ NO  → onStopped() コールバックを呼ぶ
```

---

## 7. フック設計

### `useVoiceRecognition.ts`

```typescript
// 責務: voice-recognition-service と voice-store を橋渡しする
// - コンポーネントに startListening / stopListening を提供
// - サービスコールバックを受け取り voice-store を更新
// - アンマウント時に自動停止（クリーンアップ）

function useVoiceRecognition(): {
  isListening: boolean
  isSupported: boolean
  interimTranscript: string
  confirmedEntries: VoiceTranscriptEntry[]
  language: 'ja-JP' | 'en-US'
  error: VoiceState['error']
  start: (agendaId: string | null) => void
  stop: () => void
  setLanguage: (lang: 'ja-JP' | 'en-US') => void
  clearTranscript: () => void
}
```

---

## 8. ストア設計

### `voice-store.ts`

```typescript
// 永続化: なし（セッション中のみ保持）
// 理由: 発話テキストは議事録フィールドへ挿入した時点で
//       agenda-timer-store（永続化あり）に保存される

export const useVoiceStore = create<VoiceState & VoiceActions>()((set) => ({
  isSupported: false,
  isListening: false,
  language: 'ja-JP',
  interimTranscript: '',
  confirmedEntries: [],
  error: null,
  // ... Actions
}))
```

> ストアを持つ理由: `VoiceTranscriptPanel` と `VoiceRecognitionButton` は別 DOM 位置に配置されるため、`useVoiceRecognition` hook を複数インスタンスで呼び出すと SpeechRecognition が二重起動する可能性がある。ストアを唯一の真実源とし、hook インスタンスが増えても安全に参照できる。

---

## 9. コンポーネント設計

### `VoiceRecognitionButton`

```
[マイクアイコン]
  ・非録音中: グレーのマイクアイコン
  ・録音中:   赤の点滅マイクアイコン + "録音中" バッジ
  ・非対応:   グレーアウト + Tooltip "このブラウザは音声認識に対応していません"
  ・言語切り替えセレクトボックス（ja-JP / en-US）を隣に配置
```

### `VoiceTranscriptPanel`（折りたたみ）

```
▼ 文字起こし  [クリアボタン]                        [▲折りたたむ]
┌───────────────────────────────────────────────────┐
│ 00:00 今日の会議のアジェンダを確認します。            │ （確定済み・通常色）
│ 00:15 まず第一議題として...                         │ （確定済み・通常色）
│ ░最初の議題に関して検討を... ░                      │ （暫定中・薄色・イタリック）
└───────────────────────────────────────────────────┘
[議事録に追加]  ←  議題の形式によって動作が変わる（下記参照）
```

**折りたたみ状態のデフォルト**: 閉じた状態（録音開始時に自動展開）

**「議事録に追加」の動作ルール（議題の `minutesFormat` に応じて分岐）**

| 議題形式   | ボタン表示                 | 動作                                                               |
| ---------- | -------------------------- | ------------------------------------------------------------------ |
| `markdown` | 「議事録に追加」           | 確定エントリをフォーマット変換して `minutesContent` 末尾に直接挿入 |
| `richtext` | 「AI要約して議事録に追加」 | `VoiceTranscriptSummaryDialog` を開く                              |

**markdown 挿入フォーマット**:
```markdown

**文字起こし** (HH:MM)
- エントリ1
- エントリ2
```

---

### `VoiceTranscriptSummaryDialog`（richtext 議題専用）

```
┌─────────────────────────────────────────────────────────────┐
│ AI要約して議事録に追加                               [×閉じる]│
├─────────────────────────────────────────────────────────────┤
│ ■ 文字起こし原文                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 00:00 今日の会議のアジェンダを確認します。             │   │
│ │ 00:15 まず第一議題として予算の件をお話しします。       │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ■ AI 要約結果                              [再生成]          │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ・アジェンダ確認後、第一議題として予算審議を開始した。 │   │
│ │ （編集可能テキストエリア）                            │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ※ AI 設定が未構成の場合は要約なしで原文を挿入できます。    │
│                                                              │
│                         [キャンセル]  [Quill に挿入して確定]  │
└─────────────────────────────────────────────────────────────┘
```

**AI 要約フロー**
- 既存の `AiProviderConfig`（AI 設定画面で設定済みの provider / model / api key）を参照する。
- `meeting-ai-assist-service.ts` に追加する `summarizeVoiceTranscript(entries, config)` を呼び出す。
- AI 設定が未構成（`config === null` または validation 失敗）の場合: 要約エリアに「AI 設定が未構成のため要約できません。原文をそのまま挿入するか、手動で編集してください。」と表示し、テキストエリアには原文を初期値として入れる。
- **Quill への挿入**: `getEditor()` で Quill インスタンスを取得し、`insertText` / `insertEmbed` の Delta API で末尾に追記する。`AgendaTimerView` から ref 経由でインスタンスを受け取る。

---

## 10. UX フロー

```
① 録音ボタン押下
      ↓
② マイク権限チェック（ブラウザが自動プロンプト表示）
      ├─ 拒否 → error: 'permission-denied' → エラートースト表示
      └─ 許可 → 録音開始
                  ↓
             VoiceTranscriptPanel が自動展開
                  ↓
③ リアルタイム表示
      ・暫定テキスト（薄色・イタリック）がリアルタイム更新
      ・確定するとタイムスタンプ付きエントリとして追加
                  ↓
④ 必要な分だけ話す
                  ↓
⑤ 停止ボタン押下（または議題終了）
      → 録音停止・transcriptは保持
                  ↓
⑥ 「議事録に追加」ボタン押下
    │
    ├─ markdown 形式の議題
    │       → 確定エントリを Markdown フォーマットで minutesContent 末尾に直接挿入
    │       → 挿入後にパネルのエントリをクリア
    │
    └─ richtext 形式の議題
            → VoiceTranscriptSummaryDialog を開く
                  ↓
            ⑦ ダイアログ内で AI 要約を自動生成（AI 設定済みの場合）
                  ├─ AI 設定未構成 → 原文をテキストエリアの初期値として表示
                  └─ AI 設定あり  → 要約を生成・テキストエリアに表示
                  ↓
            ⑧ ユーザーが要約テキストを確認・編集
                  ↓
            ⑨ 「Quill に挿入して確定」押下
                  → Quill Delta API で Quill エディタ末尾に追記
                  → ダイアログを閉じ、パネルのエントリをクリア
```

---

## 11. エラーハンドリング

| エラー種別          | 原因                           | 表示                                                               |
| ------------------- | ------------------------------ | ------------------------------------------------------------------ |
| `permission-denied` | マイクアクセス拒否             | トースト「マイクへのアクセスを許可してください」                   |
| `not-supported`     | ブラウザ非対応                 | ボタングレーアウト + Tooltip                                       |
| `network`           | 一部ブラウザのネットワーク依存 | トースト「音声認識に失敗しました。ネットワークを確認してください」 |
| `aborted`           | タブ非アクティブ等で中断       | 自動再起動を試みる（最大3回）                                      |

---

## 12. 実装フェーズ

### Phase 1 — 基盤 + 文字起こし基本動作（MVP）

- [ ] `src/types/voice.ts` 型定義作成
- [ ] `voice-recognition-service.ts` 作成（start/stop/自動再起動）
- [ ] `voice-store.ts` 作成
- [ ] `useVoiceRecognition.ts` 作成
- [ ] `VoiceRecognitionButton.tsx` 作成（非対応時グレーアウト対応）
- [ ] `VoiceTranscriptPanel.tsx` 作成（折りたたみ・暫定/確定テキスト表示）
- [ ] `AgendaTimerView.tsx` への組み込み（議事録エリアの上部）
- [ ] `npm run type-check` 通過確認

### Phase 2 — 議事録挿入・言語切り替え

- [x] 「議事録に追加」ボタン実装（`minutesFormat` で markdown / richtext を判定）
- [x] markdown 形式: Markdown フォーマット挿入
- [x] `meeting-ai-assist-service.ts` に `summarizeVoiceTranscript()` 追加
- [x] `VoiceTranscriptSummaryDialog.tsx` 作成
  - [x] 原文表示エリア
  - [x] AI 要約生成（AiProviderConfig 参照・未構成フォールバック）
  - [x] 要約テキスト編集エリア・再生成ボタン
  - [x] Quill Delta API を使った末尾挿入（`AgendaTimerView` 内 `MinutesEditor` から Quill ref を props 経由で渡す）
- [x] 言語切り替えセレクト実装（ja-JP / en-US）
- [x] タイムスタンプ表示
- [x] エラーハンドリング強化（自動再起動・上限管理）

### Phase 3 — 外部 API 対応（将来）

- [ ] `VoiceRecognitionService` を interface に抽象化
- [ ] DeepGram / Azure STT 実装を差し替え可能にする
- [ ] AI 設定画面（既存）から STT プロバイダを選択できるようにする

---

## 13. テスト方針

| 対象                               | 種別              | 検証内容                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------ |
| `voice-recognition-service.ts`     | Unit              | SpeechRecognition モック: start/stop/自動再起動/エラー伝播         |
| `voice-store.ts`                   | Unit              | State 変化: startListening/clearTranscript/addConfirmedEntry       |
| `useVoiceRecognition.ts`           | Unit (renderHook) | サービスとストアの橋渡し、クリーンアップ                           |
| `VoiceTranscriptPanel.tsx`         | Integration       | 確定エントリ表示・折りたたみ動作・markdown/richtext でのボタン差異 |
| `VoiceRecognitionButton.tsx`       | Integration       | 非対応環境でのグレーアウト・録音中状態の視覚表現                   |
| `VoiceTranscriptSummaryDialog.tsx` | Integration       | AI 設定あり/なしの要約表示分岐・Quill 挿入のコール確認             |
| `summarizeVoiceTranscript()`       | Unit              | AI 呼び出しモック: 正常/失敗時のフォールバック                     |

---

## 14. 既存仕様との整合

| 既存仕様                                         | 整合内容                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| `notification-manager.ts` 経由のみ通知           | エラートーストも通知マネージャー経由で表示する                           |
| `logger.ts` 経由のみログ                         | 録音開始/停止/エラーを INFO/WARN レベルで記録する                        |
| Zustand ストア State/Actions を interface で明示 | `VoiceState` / `VoiceActions` を型で分離する                             |
| `useState` は UI ローカル状態のみ                | パネル開閉状態は `useState`、認識状態は voice-store に持つ               |
| `src/types/*` をドメイン型の正本とする           | `VoiceTranscriptEntry` / `VoiceState` を `src/types/voice.ts` に定義する |

---

## 15. 未解決事項

| #   | 事項                                        | 優先度 | 方針案                                                                                              |
| --- | ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| 1   | ~~`richtext`（Quill）形式議題への挿入対応~~ | ✅ 解決 | `VoiceTranscriptSummaryDialog` で AI 要約→Quill Delta API 挿入（Section 9 参照）                    |
| 2   | 会議終了時の transcript 自動クリア          | 低     | 会議終了アクションに clearTranscript を連動させるか検討                                             |
| 3   | 議題切り替え時のエントリ紐付け表示          | 低     | `agendaId` フィールドを利用したフィルタ表示を Phase 2 で検討                                        |
| 4   | ~~Quill ref の受け渡し方法~~                | ✅ 解決 | `MinutesEditor` 内で `useRef<ReactQuill>` を生成し、`VoiceTranscriptSummaryDialog` props 経由で渡す |
