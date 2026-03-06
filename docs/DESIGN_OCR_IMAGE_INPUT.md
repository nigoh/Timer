# 設計書: 画像 OCR テキスト入力機能

> **ステータス**: 実装済み  
> **関連ドキュメント**: [REQUIREMENTS.md](./REQUIREMENTS.md)

---

## 背景・目的

ホワイトボードの板書やアジェンダ資料の写真から、テキストをアプリに取り込む機能を提供する。  
手動入力の手間を削減し、会議前後の情報整理を効率化することが目的。

---

## 技術選定

### 比較検討した OCR ライブラリ

| ライブラリ | 方式 | 日本語精度 | バックエンド不要 | ライセンス | 採用判定 |
|-----------|------|-----------|----------------|-----------|---------|
| **Tesseract.js** | ブラウザ内 WASM | ★★★☆ | ✅ | Apache-2.0 | ✅ **採用** |
| NDL OCR-Lite | Python サーバー | ★★★★★ | ❌ | Apache-2.0 | 将来オプション |
| Google Cloud Vision API | クラウド API | ★★★★★ | ❌（要 API キー） | 商用 | 将来オプション |
| Azure Computer Vision | クラウド API | ★★★★☆ | ❌（要 API キー） | 商用 | 将来オプション |

### NDL OCR-Lite について

[NDL OCR-Lite](https://github.com/ndl-lab/ndlocr-lite) は国立国会図書館が公開する高精度な日本語 OCR エンジンで、
印刷物・縦書き・旧字体など複雑な日本語文書の認識精度が非常に高い。

**現状の制約**:
- Python 3.8 以上が必要なサーバーサイドツール（CLI / REST サーバー）
- ブラウザから直接呼び出すことはできない
- 推論環境として CUDA GPU またはそれなりの CPU が必要

**将来の統合パス**:
1. NDL OCR-Lite を `fastapi` でラップしたローカルサーバー（例: `http://localhost:8000/ocr`）を起動
2. 本アプリの設定画面に「OCR サーバー URL」を追加
3. `ocrService` を拡張して URL が設定されている場合はリモート API を呼び出す

```
[ブラウザ] → POST /ocr (multipart/form-data) → [NDL OCR-Lite サーバー] → JSON レスポンス
```

### Tesseract.js 採用理由

- バックエンドサーバー不要でブラウザ内で完結する
- 現行アーキテクチャ（フロントエンドのみ）に適合する
- 日本語（横書き `jpn` / 縦書き `jpn_vert`）に対応
- 初回のみ言語データを CDN からダウンロード（後述の注意事項参照）

---

## アーキテクチャ

### ファイル構成

```
src/
├── types/
│   └── ocr.ts                    # OCR ドメイン型
├── features/timer/
│   ├── services/
│   │   └── ocr-service.ts        # Tesseract.js ラッパー
│   └── components/agenda/
│       ├── OcrImportDialog.tsx   # 画像アップロード + OCR UI
│       ├── MeetingDialog.tsx     # 「画像から読み込む」ボタンを追加
│       └── MinutesEditor.tsx     # OCR アイコンボタンを追加
```

### データフロー

```
[ユーザー]
  ↓ 画像を選択（ファイル or カメラ）
[OcrImportDialog]
  ↓ File オブジェクト
[ocrService.recognize()]
  ↓ Tesseract.js WASM
  ↓ 認識結果テキスト
[OcrImportDialog] ← ユーザーがテキストを編集
  ↓ onImport(text)
[MeetingDialog]    → agendaDraft に追記（アジェンダ下書き）
[MinutesEditor]    → Quill エディタのカーソル位置に挿入
```

---

## コンポーネント設計

### `OcrImportDialog`

| プロパティ | 型 | 説明 |
|----------|-----|------|
| `isOpen` | `boolean` | ダイアログ表示フラグ |
| `mode` | `'agenda' \| 'minutes'` | 使用コンテキスト |
| `onClose` | `() => void` | 閉じる時のコールバック |
| `onImport` | `(text: string) => void` | 確定テキストを渡すコールバック |

**UI フロー**:

1. ファイルドロップ / ファイル選択 / カメラ撮影で画像を取得
2. 画像プレビュー表示・認識言語選択（日本語横書き / 縦書き / 英語）
3. 「文字を認識する」ボタンで OCR 実行（進捗バー表示）
4. 認識結果をユーザーが編集
5. 「アジェンダ下書きに反映」または「議事録に挿入」で確定

### `ocrService`

```typescript
interface OcrService {
  recognize(image: File | Blob, options?: OcrOptions): Promise<OcrResult>;
}
```

- 内部で `createWorker(language)` を呼び出し、終了後に `worker.terminate()` する
- 進捗は `logger (status === 'recognizing text')` イベントで `onProgress` に通知

---

## 使用場面

### 1. アジェンダ下書きへの取り込み（MeetingDialog）

「新しい会議を作成」ダイアログの **「画像から読み込む」** ボタンをクリック。

- 認識テキストは「アジェンダ下書き」テキストエリアに追記される
- 1 行 = 1 議題として解釈（「タイトル | 分数」形式に対応）
- 既存の手動入力・GitHub Issue 連携と併用可能

### 2. 議事録への挿入（MinutesEditor）

議事録エディタのヘッダーにある **カメラアイコンボタン** をクリック。

- 認識テキストは Quill エディタのカーソル位置に挿入される
- Quill 未初期化時は既存 minutesContent の末尾に追記

---

## 制約・注意事項

### 認識精度

| 対象 | 精度 | 備考 |
|------|------|------|
| 印刷物（横書き） | ★★★★ | Tesseract.js が得意 |
| 印刷物（縦書き） | ★★★ | `jpn_vert` モードで改善 |
| ホワイトボード手書き | ★★ | OCR 全般が苦手。高精度が必要なら NDL OCR-Lite / Google Vision を推奨 |
| スキャン品質が低い画像 | ★ | 前処理なしでは厳しい |

### パフォーマンス

- Tesseract.js は WebAssembly で動作し、言語データ（jpn: 約 8 MB）を初回に CDN からダウンロードする
- ダウンロード後はブラウザキャッシュが使われる
- 認識処理は画像サイズに依存するが通常 5–30 秒程度
- 同時に複数の OCR は実行せず、ワーカーは認識後に終了する

### セキュリティ

- 画像ファイルはサーバーに送信されず、ブラウザ内でのみ処理される
- 認識結果テキストはユーザーが確認・編集してから挿入されるため、自動反映はしない
- ファイルサイズ上限を 20 MB に設定し、極端に大きなファイルを拒否する

---

## 将来の拡張ポイント

1. **NDL OCR-Lite サーバー連携**: 設定画面に OCR サーバー URL を追加し、`ocrService` でリモート API を呼び出す
2. **Google Cloud Vision API**: 既存の AI API 設定（`integration-link-store`）を拡張して Google Vision API キーを登録
3. **画像前処理**: グレースケール化・コントラスト強調などの前処理を追加し、手書き認識精度を向上
4. **バッチ処理**: 複数画像を連続処理してアジェンダリストを生成

---

## NDL OCR-Lite ローカル統合手順（参考）

NDL OCR-Lite をローカルで動かしてアプリと連携する場合の手順:

```bash
# 1. NDL OCR-Lite のインストール
git clone https://github.com/ndl-lab/ndlocr-lite.git
cd ndlocr-lite
pip install -r requirements.txt

# 2. fastapi でラップ（別途 wrapper_server.py を作成）
pip install fastapi uvicorn python-multipart

# 3. サーバー起動（例）
uvicorn wrapper_server:app --host 0.0.0.0 --port 8000
```

`wrapper_server.py` の実装例（概略）:

```python
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import ndlocrlite

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

@app.post("/ocr")
async def ocr(file: UploadFile):
    image_bytes = await file.read()
    result = ndlocrlite.recognize(image_bytes)
    return {"text": result["text"]}
```

アプリ側の `ocrService` は `OCR_SERVER_URL` 環境変数が設定されている場合にリモート API を優先する仕組みを将来追加予定。
