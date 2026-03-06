# タスク計画: 画像 OCR テキスト入力機能

## フェーズ概要

新機能のフルスクラッチ実装。ブラウザ内 OCR（Tesseract.js）によるテキスト取り込みを
アジェンダ下書き（MeetingDialog）と議事録エディタ（MinutesEditor）に統合する。

---

## P0: ドメイン型・サービス層

### タスク 1.1: OCR ドメイン型を定義する

- [x] `src/types/ocr.ts` を作成する
- [x] `OcrLanguage = 'jpn' | 'jpn_vert' | 'eng'` を定義する
- [x] `OcrOptions` インターフェース（`language?`, `onProgress?`）を定義する
- [x] `OcrResult` インターフェース（`text: string`, `confidence: number`）を定義する
- [x] `OcrImportMode = 'agenda' | 'minutes'` を定義する

### タスク 1.2: `ocrService` を実装する

- [x] `src/features/timer/services/ocr-service.ts` を作成する
- [x] `tesseract.js@7.0.0` を依存に追加する（`npm install tesseract.js`）
- [x] `OcrService` クラスに `recognize(image, options)` メソッドを実装する
- [x] `createWorker(language)` でワーカーを生成し、認識後に `worker.terminate()` する
- [x] `status === 'recognizing text'` イベントで `onProgress` に 0–100% の進捗を通知する
- [x] 開始・完了・失敗を `logger.ts` に記録する（カテゴリ `'ocr'`）
- [x] `ocrService` シングルトンをエクスポートする

---

## P1: UI コンポーネント

### タスク 2.1: `OcrImportDialog` を実装する

- [x] `src/features/timer/components/agenda/OcrImportDialog.tsx` を作成する
- [x] ファイル選択・ドラッグ&ドロップ・カメラ撮影（`capture="environment"`）で画像を取得する
- [x] 画像サイズ上限チェック（20 MB 超過時にエラー表示）を実装する
- [x] 画像プレビューと言語選択ラジオボタン（jpn / jpn_vert / eng）を表示する
- [x] 「文字を認識する」ボタンで `ocrService.recognize` を呼び出す
- [x] OCR 実行中は `Progress` コンポーネントでプログレスバーを表示する
- [x] 認識結果を編集可能な `Textarea` に表示する
- [x] `mode` に応じてボタンラベル（「アジェンダ下書きに反映」/「議事録に挿入」）を切り替える
- [x] 「確定」ボタンで `onImport(text)` を呼び出してダイアログを閉じる
- [x] ダイアログを閉じた際に `URL.revokeObjectURL` でオブジェクト URL を解放する

---

## P2: 統合

### タスク 3.1: `MeetingDialog` に OCR ボタンを追加する

- [x] `MeetingDialog.tsx` に「画像から読み込む」ボタンを追加する
- [x] `isOcrOpen` ステートを追加し、ボタンクリックで `OcrImportDialog` を開く
- [x] `onImport` で受け取ったテキストを `agendaDraft` テキストエリアに追記する（既存内容は保持）

### タスク 3.2: `MinutesEditor` に OCR ボタンを追加する

- [x] `MinutesEditor.tsx` のヘッダーにカメラアイコンボタンを追加する
- [x] `isOcrOpen` ステートを追加し、ボタンクリックで `OcrImportDialog` を開く
- [x] `onImport` で受け取ったテキストを Quill カーソル位置に挿入する
- [x] Quill 未初期化時は `minutesContent` 末尾に追記するフォールバックを実装する
- [x] 改行の二重追加を防止するロジックを実装する

---

## P3: ドキュメント

### タスク 4.1: ドキュメントを更新する

- [x] `docs/REQUIREMENTS.md` に RQ-08（OCR テキスト入力）を追加する
- [x] `docs/FEATURES.md` に OCR 機能の説明を追加する
- [x] `docs/DESIGN_OCR_IMAGE_INPUT.md` を新規作成する（NDL OCR-Lite 比較・将来統合パス）
- [x] `docs/TECHNICAL_SPECS.md` に Tesseract.js スタック・`ocr-service.ts`・OCR 仕様セクションを追記する
- [x] `.kiro/specs/ocr-image-input/` に cc-sdd スペックを作成する

---

## P4: 品質ゲート

### タスク 5.1: 品質ゲートを実行する

- [x] `npm run type-check` が通過すること
- [x] `npm run test:run` が全件通過すること
- [x] `npm run build` が成功すること
