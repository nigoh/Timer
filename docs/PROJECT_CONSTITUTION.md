# Timer App Constitution (プロジェクト原則)

最終更新: 2025-10-26

## 1. ビジョン / 成功基準
- 目的: 会議・作業の時間管理を改善し、集中とチーム効率を高める。
- 非目的: サーバーサイドや認証は当面対象外。高度なクラウド同期は将来検討。
- 成功基準: 1タップ開始、誤差の少ない時間計測、モバイル快適。主要操作3タップ以内。ビルド/テスト/品質ゲート常にPASS。

## 2. 技術スタック（固定）
- React 19 + TypeScript 5 + Vite 6
- 状態: Zustand 5（統一）
- UI: shadcn/ui 準拠（Radix UI + Tailwind CSS）、デザインシステム/トークン準拠
- データ: IndexedDB（Dexie）
- 通知: Web Notification API / 音: Web Audio API
- テスト: Vitest / Lint: ESLint + @typescript-eslint / Format: Prettier

## 3. ディレクトリ構造 / 命名
- features 配下の構造を厳守（`.github/copilot-instructions.md` 参照）。
- `index.ts` でエクスポート集約。コンポーネントは原則100行以内に分割。

## 4. レイアウト / UX ルール
- `src/components/layout` の `FeatureLayout`/`FeatureHeader`/`FeatureContent` を必須使用。
- `maxWidth={false}` を基本。レスポンシブは xs〜 必須。
- デザイントークン（spacingTokens/shapeTokens）必須。ハードコード値禁止。
- 統一スクロール/テーマ/アクセシビリティ（WCAG 2.1 AA）遵守。
- 参考: `.github/instructions/layout_rule.instructions.md`

## 5. 状態管理ポリシー
- Zustand 5 に統一。props バケツリレーや useState 乱用禁止。
- コンポーネント内での API 直接呼び出し禁止（hooks/stores に集約）。
- 無限ループ防止: 同値時は set しない update パターンを徹底。
- 定数/マスタは `constants/` に集約し重複禁止。型を厳格化。

## 6. ロギング / 可観測性
- `src/utils/logger.ts` を使用（ERROR/WARN/INFO/DEBUG/TRACE）。
- カテゴリ: timer, ui, store, notification, performance, api, app, error。
- PII/秘匿情報はログしない。パフォーマンス/メモリの閾値超過は警告ログ。
- エラーバウンダリー適用、ユーザー向けフォールバック提供。

## 7. 品質ゲート（必須）
- build / lint / type-check / test / spec-kit-check すべて PASS 必須。
- 新規公開APIには最小ユニットテスト（ハッピーパス+境界1〜2件）。

## 8. Git / PR 運用
- ブランチ命名: `feat/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*`。
- Conventional Commits：例 `feat(timer): add agenda overrun color`。
- PR テンプレ遵守。説明/スクショ/確認手順/影響を記載。
- 必須チェック: build, lint, type-check, test, spec-kit-check。

## 9. ドキュメント
- 仕様/設計は `docs/` に保管。`REQUIREMENTS.md`, `UX_DESIGN_SPEC.md`, `LOGGING_SPEC.md` を随時更新。
- Spec Kit 生成物（spec/plan/tasks/checklist）は適切に配置し参照可能に。

## 10. パフォーマンス / アクセシビリティ
- 主要操作の応答は体感100ms目安。レンダリング>16msは警告。
- メモリ使用率の閾値を監視。画像/音声は遅延ロードを検討。
- A11y: キーボード操作/コントラスト/ARIA を整備。

## 11. セキュリティ / 依存
- 重大脆弱性は速やかにアップデート。不要依存の追加禁止。
- 外部送信は明示合意のない限り行わない。

## 12. Non-negotiables（非交渉事項）
- レイアウト統一/デザイントークン/100行ルール/状態はZustand統一。
- コンポーネント内 API 直呼び禁止/定数重複禁止/useCallback 徹底/shadcn/ui 準拠。
