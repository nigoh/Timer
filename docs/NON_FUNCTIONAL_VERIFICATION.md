# 非機能要件 検証手順（REQUIREMENTS 7章対応）

本書は `docs/REQUIREMENTS.md` 7章（非機能要件）を、PRで再現可能な計測手順に落とし込んだ運用手順です。  
測定結果はすべて `docs/verification/` 配下に保存し、PRに添付（または内容を転記）します。

---

## 1. 前提条件

- Node.js / npm が利用可能であること
- 依存関係インストール済みであること
- 計測時はバックグラウンド負荷を抑えること（他アプリ終了、電源接続推奨）

### 1.1 ローカル起動

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 4173
```

> CIなどで本番ビルド対象を測定する場合は以下を使用する。

```bash
npm ci
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

---

## 2. 成果物保存ルール（`docs/verification/` 統一）

### 2.1 命名規則

ファイル名は以下の形式で統一する。

```txt
YYYYMMDD-HHMM_<branch>_<metric>.<ext>
```

- `YYYYMMDD-HHMM`: 計測開始日時（ローカル時刻）
- `<branch>`: Gitブランチ名（`/` は `-` に置換）
- `<metric>`: 計測種別
  - `lcp`
  - `longtask`
  - `tab-switch`
  - `axe`
  - `lighthouse-accessibility`
  - `logging-traceability`
- `<ext>`: `json` / `md` / `csv` / `txt` など

例:

- `20260214-1015_feature-nfr_lcp.json`
- `20260214-1018_feature-nfr_axe.json`
- `20260214-1022_feature-nfr_logging-traceability.md`

### 2.2 PR添付必須ファイル

最低限、次をPRに添付（または本文に要約+ファイルパス記載）する。

1. パフォーマンス結果（`lcp`, `longtask`, `tab-switch`）
2. アクセシビリティ結果（`axe`, `lighthouse-accessibility`）
3. ログ追跡率結果（`logging-traceability`）

---

## 3. REQUIREMENTS 7章 対応表

| REQUIREMENTS 7章基準 | 計測方法 | 判定基準 | 出力ファイル例 |
|---|---|---|---|
| 7.1 LCP ≤ 2.5秒（3回平均） | Lighthouse Performance JSONを3回取得しLCP平均算出 | 3回平均が2,500ms以下で合格 | `*_lcp.json`, `*_lcp-summary.md` |
| 7.1 Long Task（>50ms） < 5件/分 | ブラウザPerformance計測またはLong Task計測スクリプト | 1分あたり4件以下で合格 | `*_longtask.json`, `*_longtask-summary.md` |
| 7.1 タブ切替 ≤ 200ms | タブ切替操作の開始〜初回描画までを3回以上記録 | 最大値200ms以下で合格 | `*_tab-switch.csv`, `*_tab-switch-summary.md` |
| 7.2 重大違反（critical）0件 | axe CLIの自動検査 | `critical` 件数が0で合格 | `*_axe.json` |
| 7.2 自動検査の担保 | Lighthouse Accessibility JSON取得 | Accessibility score 100を目標、重大違反0件必須 | `*_lighthouse-accessibility.json` |
| 7.3 ログ追跡率 100% | 再現シナリオ単位で操作〜エラーのログ連結確認 | 対象シナリオで追跡漏れ0件（100%） | `*_logging-traceability.md` |

---

## 4. 計測手順

## 4.1 パフォーマンス

### 4.1.1 LCP（3回平均）

```bash
npx -y lighthouse http://127.0.0.1:4173 \
  --only-categories=performance \
  --output=json \
  --output-path=docs/verification/$(date +%Y%m%d-%H%M)_$(git rev-parse --abbrev-ref HEAD | tr '/' '-')_lcp-run1.json \
  --chrome-flags='--headless=new'
```

- 上記を `run1`〜`run3` で3回実行。
- `audits.largest-contentful-paint.numericValue`（ms）を平均化し、2,500ms以下を合格とする。
- 平均値と各回値を `*_lcp-summary.md` に記録する。

### 4.1.2 Long Task（>50ms）

1分間、タイマー稼働中に開始/停止/タブ切替など主要操作を実施し、Long Task発生数を集計する。

```bash
# 例: DevTools Performance記録をJSONで保存した後に集計スクリプトを実行
node scripts/verification/summarize-longtask.mjs \
  --input docs/verification/<raw-performance-trace.json> \
  --output docs/verification/$(date +%Y%m%d-%H%M)_$(git rev-parse --abbrev-ref HEAD | tr '/' '-')_longtask-summary.md
```

- 合格条件: `Long Task件数 / 計測分` が **5未満**。
- 本リポジトリに集計スクリプト未整備の場合は、計測ログから手集計して `*_longtask-summary.md` を作成する。

### 4.1.3 タブ切替（200ms）

- 主要タブ（基本 / ポモドーロ / アジェンダ / 複数）を対象に、切替開始時刻と初回描画完了時刻を3回以上計測。
- 計測値を `*_tab-switch.csv` に保存する（列: `tab,run,duration_ms`）。

判定:

- 合格: 全計測の最大値が200ms以下
- 不合格: 1件でも200ms超過

---

## 4.2 アクセシビリティ

### 4.2.1 axe（critical 0件）

```bash
npx -y @axe-core/cli http://127.0.0.1:4173 \
  --save docs/verification/$(date +%Y%m%d-%H%M)_$(git rev-parse --abbrev-ref HEAD | tr '/' '-')_axe.json
```

判定:

- 合格: `critical` 0件
- 不合格: `critical` 1件以上

### 4.2.2 Lighthouse Accessibility

```bash
npx -y lighthouse http://127.0.0.1:4173 \
  --only-categories=accessibility \
  --output=json \
  --output-path=docs/verification/$(date +%Y%m%d-%H%M)_$(git rev-parse --abbrev-ref HEAD | tr '/' '-')_lighthouse-accessibility.json \
  --chrome-flags='--headless=new'
```

判定:

- 必須: 重大違反（critical）0件（axe判定を採用）
- 参考目標: Lighthouse Accessibility Score 100

---

## 4.3 ログ追跡率（100%）

### 4.3.1 対象シナリオ

最低3シナリオ（開始/停止、タブ切替、エラー発生）を定義し、各シナリオで以下を確認する。

1. 操作ログ（開始/停止/タブ切替）が構造化で記録される
2. エラー時に `level`, `message`, `timestamp`, `category` が欠落なく残る
3. ログビューアで絞り込み・検索により、操作〜エラーを連結追跡できる

### 4.3.2 記録フォーマット

`*_logging-traceability.md` に以下を記録する。

- シナリオID
- 再現手順
- 期待ログ
- 実ログ抜粋
- 追跡可否（Yes/No）

判定:

- 合格: 全シナリオで `追跡可否=Yes`（追跡率100%）
- 不合格: 1シナリオでも `No`

---

## 5. CI組み込み（次段の実装手順）

以下は将来拡張に向けた「実装ステップ」であり、PR単位で順次導入する。

1. `package.json` に検証用スクリプトを追加
   - `verify:axe`
   - `verify:lighthouse:accessibility`
2. GitHub Actionsワークフロー `/.github/workflows/non-functional-verification.yml` を追加
   - `npm ci`
   - `npm run build`
   - `npm run preview -- --host 0.0.0.0 --port 4173`
   - `npm run verify:axe`
   - `npm run verify:lighthouse:accessibility`
3. 成果物アップロードを有効化
   - `docs/verification/*.json`
   - `docs/verification/*-summary.md`
4. PRゲート条件を設定
   - axe critical > 0 で fail
   - Lighthouse Accessibilityが閾値未満で fail（閾値は段階導入）
5. ローカル運用とCI運用の差分を `docs/TECHNICAL_SPECS.md` に同期記載

---

## 6. PR記載テンプレート（検証結果欄）

```md
- Performance:
  - LCP average: xxxx ms (pass/fail)
  - Long Task per min: x.x (pass/fail)
  - Tab switch max: xxx ms (pass/fail)
- Accessibility:
  - axe critical: 0 (pass/fail)
  - Lighthouse accessibility score: xxx
- Logging traceability:
  - scenarios: n
  - traceability: xxx% (pass/fail)
- Evidence files:
  - docs/verification/YYYYMMDD-HHMM_<branch>_lcp-summary.md
  - docs/verification/YYYYMMDD-HHMM_<branch>_axe.json
  - docs/verification/YYYYMMDD-HHMM_<branch>_logging-traceability.md
```
