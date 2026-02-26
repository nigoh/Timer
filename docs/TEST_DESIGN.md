# テスト設計書 (Test Design Specification)

> 作成日: 2026-02-21  
> バージョン: 1.0  
> 対象アプリ: Focuso (React + TypeScript + Vite + Zustand)  
> テストフレームワーク: Vitest + happy-dom

---

## 1. テスト方針

### 1.1 目的

本設計書は Focuso における「追加すべきユニットテスト」の設計指針を示す。  
テストは**仕様の信頼できる実行可能ドキュメント**として機能することを目標とし、  
以下の優先順位でカバレッジを拡大する。

```
優先度 High   : ビジネスロジック（ストア・サービス）
優先度 Medium : UIコンポーネント（表示・ユーザー操作）
優先度 Low    : コンテナ（配線のみ・E2E でカバーが望ましい）
```

### 1.2 テスト種別と適用範囲

| 種別            | 対象                                     | ツール              | 粒度                  |
| --------------- | ---------------------------------------- | ------------------- | --------------------- |
| **Unit**        | ストア・サービス・ユーティリティ・フック | Vitest              | 関数/メソッド単位     |
| **Component**   | Viewコンポーネント                       | Vitest + createRoot | render + ユーザー操作 |
| **Integration** | コンテナ (store ↔ View)                  | Vitest              | 省略可（E2E 推奨）    |

### 1.3 モック戦略

```
外部依存（通知・ログ・API・音声認識）→ vi.mock / vi.stubGlobal でスタブ
UIライブラリ（shadcn/Radix）       → 最小HTMLに置き換えるモック
タイマー/日付                        → vi.useFakeTimers / vi.spyOn(Date, 'now')
Zustandストア                        → setState で直接初期化（beforeEach）
```

### 1.4 命名規約

- ファイル: `{対象ファイル名}.test.ts(x)`
- テスト名: 日本語で「〇〇のとき〇〇になる（する）」
- `describe` 階層: `対象 > メソッド/機能 > ケース`

---

## 2. 未テスト領域の設計

### 2.1 `notification-manager.ts`
**優先度**: Medium

#### 設計意図
`notificationManager` はアプリ全体の通知 API の抽象化レイヤーであり、  
ストアから呼ばれる副作用の入口。モックではなく実装自体のテストが必要。

#### テストケース設計

```
describe('notificationManager', () => {
  describe('ensureInitialized()', () => {
    TC-NM-01: Notification.permission = 'default' のとき requestPermission が呼ばれる
    TC-NM-02: Notification.permission = 'granted' のとき requestPermission が呼ばれない
    TC-NM-03: Notification API 非対応時（window.Notification なし）でも throw しない
  })

  describe('notify()', () => {
    TC-NM-04: permission = 'granted' のとき new Notification() が呼ばれる
    TC-NM-05: permission = 'denied' のとき new Notification() が呼ばれない
    TC-NM-06: title と body が Notification コンストラクタへ渡される
  })
})
```

---

### 2.2 `meeting-report-store.ts`
**優先度**: High

#### 設計意図
会議レポートの生成・保存は REQ-5.4 の要件。  
ストアのミューテーション全体をカバーする。

#### テストケース設計

```
describe('useMeetingReportStore', () => {
  describe('createReport()', () => {
    TC-MR-01: 会議データから MeetingReport を生成できる
    TC-MR-02: 生成されたレポートに id・createdAt が付与される
    TC-MR-03: 同一会議の再生成でレポートが上書きされる
  })

  describe('updateReport()', () => {
    TC-MR-04: summary / decisions / nextActions を更新できる
    TC-MR-05: todos を追加・更新・削除できる
    TC-MR-06: participants リストを更新できる
  })

  describe('deleteReport()', () => {
    TC-MR-07: 指定 ID のレポートを削除できる
    TC-MR-08: 未知 ID の削除で throw しない
  })

  describe('getReportByMeetingId()', () => {
    TC-MR-09: meetingId に一致するレポートを返す
    TC-MR-10: 存在しない meetingId には undefined を返す
  })
})
```

---

### 2.3 `new-agenda-timer-store.ts`
**優先度**: High  

> ⚠️ このストアの内容を先に確認し、`agenda-timer-store.ts` との重複が  
> ないか調査したうえで設計する（同一責務の場合は削除を検討）。

#### テストケース設計（仮）

```
describe('useNewAgendaTimerStore', () => {
  TC-NA-01: 既存 agenda-timer-store と同等の CRUD ができる（または利用されていない場合は削除確認）
})
```

---

### 2.4 `BasicTimerView.tsx`
**優先度**: Medium

#### 設計意図
タイマーの表示状態とボタン操作を検証する。  
ストアは `resetBasicTimerStore()` でリセットし、モックなしで使用する。

#### テストケース設計

```
describe('BasicTimerView', () => {
  describe('表示', () => {
    TC-BV-01: 初期状態で残り時間 "25:00" が表示される
    TC-BV-02: isRunning=false のとき「開始」ボタンが表示される
    TC-BV-03: isRunning=true のとき「一時停止」ボタンが表示される
    TC-BV-04: isPaused=true のとき「再開」ボタンが表示される
    TC-BV-05: 完了時に完了メッセージが表示される
  })
  describe('操作', () => {
    TC-BV-06: 「開始」ボタンクリックで timer.start() が呼ばれる
    TC-BV-07: 「一時停止」ボタンクリックで timer.pause() が呼ばれる
    TC-BV-08: 「リセット」ボタンクリックで timer.reset() が呼ばれる
    TC-BV-09: 「時間設定」入力で setDuration() が呼ばれる
  })
  describe('履歴', () => {
    TC-BV-10: showHistory=true のとき履歴リストが表示される
    TC-BV-11: 履歴が空のとき「履歴なし」が表示される
  })
})
```

---

### 2.5 `EnhancedPomodoroTimerView.tsx`
**優先度**: Medium

#### テストケース設計

```
describe('EnhancedPomodoroTimerView', () => {
  describe('フェーズ表示', () => {
    TC-PV-01: currentPhase='work' のとき「作業」ラベルが表示される
    TC-PV-02: currentPhase='short-break' のとき「短休憩」ラベルが表示される
    TC-PV-03: currentPhase='long-break' のとき「長休憩」ラベルが表示される
    TC-PV-04: 残り時間が正しくフォーマット表示される（例: "24:59"）
  })
  describe('操作', () => {
    TC-PV-05: 「開始」クリックで store.start() が呼ばれる
    TC-PV-06: 「一時停止」クリックで store.pause() が呼ばれる
    TC-PV-07: 「リセット」クリックで store.reset() が呼ばれる
    TC-PV-08: タスク名入力で store.setTaskName() が呼ばれる
  })
  describe('設定', () => {
    TC-PV-09: 設定パネル開閉ができる
    TC-PV-10: 作業時間スライダー変更で store.updateSettings() が呼ばれる
  })
  describe('統計', () => {
    TC-PV-11: todayStats の完了ポモドーロ数が表示される
    TC-PV-12: 効率（efficiency）がパーセント表示される
  })
})
```

---

### 2.6 `MultiTimerView.tsx`
**優先度**: Medium

#### テストケース設計

```
describe('MultiTimerView', () => {
  describe('タイマー一覧', () => {
    TC-MV-01: timers が空のとき「タイマーなし」プレースホルダーが表示される
    TC-MV-02: タイマーカードが timers の数だけ表示される
  })
  describe('個別タイマー操作', () => {
    TC-MV-03: 「開始」クリックで store.startTimer(id) が呼ばれる
    TC-MV-04: 「一時停止」クリックで store.pauseTimer(id) が呼ばれる
    TC-MV-05: 「停止」クリックで store.stopTimer(id) が呼ばれる
    TC-MV-06: 「複製」クリックで store.duplicateTimer(id) が呼ばれる
    TC-MV-07: 「削除」クリックで store.deleteTimer(id) が呼ばれる
  })
  describe('全体操作', () => {
    TC-MV-08: 「全開始」クリックで store.startAllTimers() が呼ばれる
    TC-MV-09: 「全停止」クリックで store.stopAllTimers() が呼ばれる
  })
  describe('追加フォーム', () => {
    TC-MV-10: 名前・時間・カテゴリ入力後「追加」クリックで addTimer が呼ばれる
    TC-MV-11: 名前が空のとき「追加」ボタンが disabled
  })
  describe('完了表示', () => {
    TC-MV-12: isCompleted=true のタイマーに完了バッジが表示される
  })
})
```

---

### 2.7 `TaskWidgetCanvas.tsx`
**優先度**: Medium-High（タスクベースウィジェットキャンバスはコア機能）

> **注**: 旧 `AgendaTimerView.tsx` は削除済み。アジェンダ機能は `TaskWidgetCanvas` 内のウィジェットとして統合。

#### テストケース設計

```
describe('TaskWidgetCanvas', () => {
  describe('会議なし状態', () => {
    TC-AV-01: currentMeeting=null のとき「会議を作成」プロンプトが表示される
  })
  describe('アジェンダ一覧', () => {
    TC-AV-02: アジェンダリストが agenda の件数分表示される
    TC-AV-03: 現在議題がハイライト（current）表示される
    TC-AV-04: 完了済み議題に "completed" マーカーが表示される
    TC-AV-05: overtime ステータスの議題に超過バッジが表示される
  })
  describe('タイマー操作', () => {
    TC-AV-06: 「開始」クリックで store.startTimer() が呼ばれる
    TC-AV-07: 「停止」クリックで store.stopTimer() が呼ばれる
    TC-AV-08: 「次の議題」クリックで store.nextAgenda() が呼ばれる
    TC-AV-09: isRunning=true のとき「次の議題」ボタンが disabled
  })
  describe('議事録', () => {
    TC-AV-10: アジェンダ行クリックで議事録エリアが展開する
    TC-AV-11: 議事録テキスト変更で store.updateAgendaMinutes() が呼ばれる
  })
})
```

---

### 2.8 `MeetingReportDialog.tsx`
**優先度**: Medium

#### テストケース設計

```
describe('MeetingReportDialog', () => {
  TC-RD-01: isOpen=false のときダイアログが表示されない
  TC-RD-02: isOpen=true のとき会議タイトルが表示される
  TC-RD-03: 参加者リストが表示される
  TC-RD-04: アジェンダ項目が actual/planned 時間とともに表示される
  TC-RD-05: 超過アジェンダが赤ハイライトで表示される
  TC-RD-06: 「AI 提案取得」クリックで generateMeetingAiAssist が呼ばれる
  TC-RD-07: AI 提案結果がテキストエリアに反映される
  TC-RD-08: 「投稿プレビュー」表示で buildPostPreviewMarkdown が呼ばれる
  TC-RD-09: 「閉じる」クリックで onClose が呼ばれる
})
```

---

### 2.9 `MeetingReportHistory.tsx`
**優先度**: Low

#### テストケース設計

```
describe('MeetingReportHistory', () => {
  TC-RH-01: reports が空のとき「履歴なし」が表示される
  TC-RH-02: 各レポートに会議タイトルと日時が表示される
  TC-RH-03: レポート行クリックで詳細が表示される（または MeetingReportDialog が開く）
})
```

---

### 2.10 `SettingsDialog.tsx`
**優先度**: Low-Medium

#### テストケース設計

```
describe('SettingsDialog', () => {
  TC-SD-01: isOpen=false のときダイアログが表示されない
  TC-SD-02: GitHub PAT 入力欄が表示される
  TC-SD-03: PAT 入力後「保存」クリックで store.setGithubPat() が呼ばれる
  TC-SD-04: AI プロバイダー選択セレクトが表示される
  TC-SD-05: AI 設定保存で store.setAiProviderConfig() が呼ばれる
  TC-SD-06: 不正な AI 設定で保存ボタンが disabled（またはエラー表示）
})
```

---

### 2.11 `GitHubIssueLinking.tsx`
**優先度**: Medium

#### テストケース設計

```
describe('GitHubIssueLinking', () => {
  TC-GL-01: timeLogId に紐づくリンク一覧が表示される
  TC-GL-02: 「リンク追加」フォームで owner/repo/issueNumber を入力できる
  TC-GL-03: 「追加」クリックで fetchGitHubIssue が呼ばれ、成功後 store.addLink() が呼ばれる
  TC-GL-04: 「追加」クリックで 404 エラー時にエラーメッセージが表示される
  TC-GL-05: 「削除」クリックで store.removeLink() が呼ばれる
})
```

---

### 2.12 `TimerHistory.tsx`
**優先度**: Low

#### テストケース設計

```
describe('TimerHistory', () => {
  TC-TH-01: 履歴が空のとき「履歴なし」が表示される
  TC-TH-02: 各エントリの duration / label / 日時が表示される
  TC-TH-03: completed=true のエントリに完了マークが表示される
  TC-TH-04: completed=false のエントリに未完了マークが表示される
})
```

---

## 3. 既存テストの拡充（Gap の補完）

### 3.1 `basic-timer-store.ts` の追加ケース
**優先度**: Medium

```
TC-BS-04: setDuration でduration と remainingTime が同時に更新される
TC-BS-05: setLabel でセッションラベルを設定できる
TC-BS-06: showHistory / showSettings のトグルが動作する
TC-BS-07: 実行中に setDuration を呼んでも remainingTime が変わらない（仕様確認要）
TC-BS-08: isRunning=false のとき tick は何もしない
```

---

### 3.2 `pomodoro-store.ts` の追加ケース
**優先度**: Medium（現在のテストは主要パスのみ）

```
TC-PO-05: long-break-interval に達したとき long-break フェーズへ遷移する
TC-PO-06: autoStartWork=true のとき休憩完了後に自動で work が開始される
TC-PO-07: todayStats.completedPomodoros が work 完了ごとに増加する
TC-PO-08: todayStats.totalFocusTime が work 完了時間を累計する
TC-PO-09: sessions に完了セッションが追加される（id / startTime / endTime）
TC-PO-10: skip() で現在フェーズをスキップして次フェーズへ移れる（skip が存在する場合）
```

---

### 3.3 `analytics.ts` の追加ケース
**優先度**: Low（既存が充実）

```
TC-AN-25: timerKind=agenda フィルタが agenda のみを集計する
TC-AN-26: timerKind=multi フィルタが multi-timer セッションのみを集計する
TC-AN-27: 月次粒度で trend が 1 ヶ月未満の範囲でも正しいラベル数になる
```

---

### 3.4 `meeting-ai-assist.ts` の追加ケース
**優先度**: Low

```
TC-MA-02: 全アジェンダが予定内のとき facilitationAssist に「予定通り」が含まれる
TC-MA-03: 参加者 0 人のとき例外を投げずデフォルト文を返す
```

---

## 4. テスト実装ガイドライン

### 4.1 ストアのテストパターン

```typescript
// ① beforeEach でストアを固定初期値にリセット
beforeEach(() => {
  useXxxStore.setState({ /* 初期値 */ });
});

// ② getState() でアクションを取得して実行
const store = useXxxStore.getState();
store.someAction(params);

// ③ getState() で結果を検証
expect(useXxxStore.getState().someField).toBe(expected);
```

### 4.2 コンポーネントのテストパターン

```typescript
// ① 依存モジュールを vi.mock でスタブ（UI は最小 HTML に変換）
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) =>
    <button onClick={onClick} disabled={disabled}>{children}</button>,
}));

// ② createRoot + act でレンダリング
await act(async () => {
  createRoot(container).render(<TargetView {...props} />);
});

// ③ DOM クエリで検証
expect(container.textContent).toContain('期待文字列');
const btn = container.querySelector('button')!;
expect(btn.disabled).toBe(false);

// ④ ユーザー操作
await act(async () => { btn.click(); });
expect(mockFn).toHaveBeenCalledWith(expectedArgs);
```

### 4.3 時間依存テストのパターン

```typescript
// vi.useFakeTimers() を使う場合
it('タイムアウト後に状態が変わる', () => {
  vi.useFakeTimers();
  try {
    store.start();
    vi.advanceTimersByTime(1000);
    expect(store.getState().phase).toBe('break');
  } finally {
    vi.useRealTimers();
  }
});

// Date.now() をスパイする場合
const nowSpy = vi.spyOn(Date, 'now');
nowSpy.mockReturnValue(1000);
store.tick();
nowSpy.mockReturnValue(2000);
store.tick();
nowSpy.mockRestore();
```

### 4.4 要件番号との紐付け

テストを特定の要件と紐付ける場合は、テストコメントに `// REQ-X.X` を付与する。

```typescript
// REQ-5.4
it('アジェンダが時間超過でovertimeになる', () => { ... });
```

---

## 5. テスト実装優先順位ロードマップ

| 優先度   | 対象                            | 理由                                       |
| -------- | ------------------------------- | ------------------------------------------ |
| 🔴 High   | `meeting-report-store.ts`       | コア機能・テストゼロ                       |
| 🔴 High   | `basic-timer-store.ts` 拡充     | カバレッジ不足（setDuration/Label/toggle） |
| 🔴 High   | `pomodoro-store.ts` 拡充        | long-break 遷移・統計・sessions 未テスト   |
| 🟡 Medium | `notification-manager.ts`       | ストア全体が依存しているが実装未テスト     |
| 🟡 Medium | `TaskWidgetCanvas.tsx`          | タスクベースウィジェットキャンバス         |
| 🟡 Medium | `BasicTimerView.tsx`            | 最もよく使われるView                       |
| 🟡 Medium | `EnhancedPomodoroTimerView.tsx` | ポモドーロView                             |
| 🟡 Medium | `MultiTimerView.tsx`            | マルチタイマーView                         |
| 🟡 Medium | `SettingsDialog.tsx`            | PAT/AI設定の保存フロー                     |
| 🟡 Medium | `GitHubIssueLinking.tsx`        | GitHub連携フロー                           |
| 🟢 Low    | `MeetingReportDialog.tsx`       | レポート生成フロー                         |
| 🟢 Low    | `MeetingReportHistory.tsx`      | 履歴表示                                   |
| 🟢 Low    | `TimerHistory.tsx`              | 履歴表示                                   |
| 🟢 Low    | コンテナ全般                    | 配線のみ・E2E でカバー推奨                 |

---

## 6. 品質チェックリスト（PR前）

- [ ] `npm run type-check` が成功
- [ ] `npm run test:run` が成功
- [ ] 新規テストが `describe` 階層で整理されている
- [ ] `beforeEach` でストアがリセットされている
- [ ] モック後の `vi.clearAllMocks()` または `vi.restoreAllMocks()` がある
- [ ] 要件変更を伴う場合 `TEST_INVENTORY.md` を更新
- [ ] 追加ケースはテスト設計書の TC 番号と一致する
