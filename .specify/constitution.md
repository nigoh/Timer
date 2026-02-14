# Timer Spec Constitution

## 目的
このConstitutionは、Timerリポジトリでの仕様管理を **Spec Kit（`.specify/`）中心** に統一し、実装と仕様の乖離を防ぐための最上位ルールを定義する。

## 基本原則
1. **正式要件の単一情報源（SSOT）**
   - 正式な要件・受け入れ条件・実装タスクは `.specify/` を唯一の正本とする。
2. **実装前仕様の原則**
   - 仕様影響を伴う変更は、コード変更より先に該当Specを更新する。
3. **トレーサビリティ**
   - Pull Requestでは、変更対象Specパスを明示し、実装差分との対応関係を記録する。
4. **継続的検証**
   - `specify check` が成功し、必須成果物（constitution / spec / tasks）が存在しないPRはマージしない。

## 成果物構成
- `.specify/constitution.md`: プロジェクト横断ルール
- `.specify/specs/<feature>/spec.md`: 機能仕様（要件・受け入れ条件）
- `.specify/specs/<feature>/tasks.md`: 実装計画・作業分解

## docs/ との責務分離
- `.specify/`: 規範的ドキュメント（Normative）
  - 要件、受け入れ条件、実装タスク、変更の正当性。
- `docs/`: 説明的ドキュメント（Informative）
  - 背景説明、設計解説、運用手順、オンボーディング資料。

## 改定ポリシー
- Constitution改定はPRで行い、影響範囲と移行方針をPR本文に明記する。
