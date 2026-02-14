# Spec: Spec Kit運用基盤の導入

## 背景
現状の仕様情報は `docs/` 中心で管理されており、正式要件と説明資料の境界が曖昧になっている。

## 要件
- R1: リポジトリに `.specify/constitution.md` を配置し、仕様管理原則を定義する。
- R2: 少なくとも1つの機能Specを `.specify/specs/<feature>/spec.md` として配置する。
- R3: CIで `specify check` を実行し、失敗時はPRをブロックする。
- R4: CIで `constitution.md` / `spec.md` / `tasks.md` の存在を検証する。
- R5: PRテンプレートに spec更新有無と該当specパスを必須入力として追加する。

## 受け入れ条件
1. ルートに `.specify/` が存在し、constitutionと機能specが確認できる。
2. `npm run spec:check` で `specify check` が実行できる。
3. `.github/workflows/spec-kit-check.yml` に成果物存在チェックが含まれる。
4. PRテンプレートにspec更新確認項目が存在する。
