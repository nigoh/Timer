# Focuso 開発フロー（Spec-Driven Development）

cc-sdd ベースの仕様駆動開発（SDD）ワークフロー。
既存の AGENTS.md / CLAUDE.md の手順を cc-sdd ライフサイクルに統合する。

## ワークフロー概要

```
┌─────────────────────────────────────────────────────────┐
│  Phase 0: Steering（プロジェクトメモリ）                   │
│  .kiro/steering/ を最新に保つ                              │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 1: Spec Initiation                               │
│  /kiro-spec-init <feature-description>                  │
│  → .kiro/specs/<feature>/spec.json + requirements.md    │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 2: Requirements（要件定義）                        │
│  /kiro-spec-requirements <feature>                      │
│  → requirements.md（EARS 形式）                           │
│  ⛳ 人間レビュー＆承認ゲート                                │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 2.5: Gap Analysis（Brownfield 時のみ）             │
│  /kiro-validate-gap <feature>                           │
│  → gap-report.md                                        │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 3: Design（設計）                                 │
│  /kiro-spec-design <feature>                            │
│  → research.md（必要時）+ design.md                       │
│  ⛳ 人間レビュー＆承認ゲート                                │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 4: Task Planning（タスク計画）                      │
│  /kiro-spec-tasks <feature>                             │
│  → tasks.md（P0/P1 並列ラベル付き）                        │
│  ⛳ 人間レビュー＆承認ゲート                                │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 5: Implementation（実装）                          │
│  /kiro-spec-impl <feature> <task-ids>                   │
│  TDD: RED → GREEN → REFACTOR                            │
│  タスクごとにチェックボックスを更新                           │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 6: Validation（検証）                              │
│  /kiro-validate-impl <feature>                          │
│  品質ゲート:                                              │
│    npm run type-check                                   │
│    npm run test:run                                     │
│    npm run build                                        │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 7: Documentation Sync                            │
│  docs/ の関連ドキュメントを更新                              │
│  - REQUIREMENTS.md / FEATURES.md / TECHNICAL_SPECS.md   │
│  - UX_DESIGN_SPEC.md                                    │
└─────────────────────────────────────────────────────────┘
```

## フェーズ詳細

### Phase 0: Steering

プロジェクトメモリの更新。新機能開発前に最新化を推奨。

| ファイル | 内容 |
|---------|------|
| `.kiro/steering/product.md` | プロダクト目的・コア機能 |
| `.kiro/steering/structure.md` | アーキテクチャパターン・ディレクトリ規約 |
| `.kiro/steering/tech.md` | 技術スタック・開発標準 |
| `.kiro/steering/dev-flow.md` | 本ドキュメント（開発フロー） |

更新タイミング:
- 新しいアーキテクチャパターンを導入した場合
- 技術スタックに変更があった場合
- 定期的なメンテナンス（月 1 回推奨）

### Phase 1: Spec Initiation

```
/kiro-spec-init <feature-description>
```

- `.kiro/specs/<feature>/spec.json` が生成される
- `requirements.md` の初期スタブが作成される
- 機能名は `kebab-case`（例: `mape-k-meeting-optimization`）

### Phase 2: Requirements

```
/kiro-spec-requirements <feature>
```

- EARS 形式（Easy Approach to Requirements Syntax）で要件を記述
- パターン: `When [event], the Focuso shall [action]`
- 各要件に Acceptance Criteria を付与
- **人間レビューゲート**: 承認前に要件の妥当性を確認

### Phase 2.5: Gap Analysis（Brownfield）

```
/kiro-validate-gap <feature>
```

- 既存コードと新要件の差分を分析
- Focuso は既存コードベースがあるため、新機能追加時は実施推奨

### Phase 3: Design

```
/kiro-spec-design <feature>
```

- `research.md`: 調査ログ（必要な場合のみ）
- `design.md`: 技術設計書（コンポーネント・インターフェース・データモデル）
- Mermaid 図でアーキテクチャ・システムフローを可視化
- **人間レビューゲート**: 設計の妥当性を確認

### Phase 4: Task Planning

```
/kiro-spec-tasks <feature>
```

- タスクは最大 2 階層（Major + Sub-task）
- サブタスクは 1〜3 時間サイズ
- `(P)` マーカーで並列実行可能なタスクを明示
- 各タスクに `_Requirements: X.X_` で要件マッピング

### Phase 5: Implementation

```
/kiro-spec-impl <feature> <task-ids>
```

TDD サイクル:
1. 🔴 RED: 失敗するテストを先に書く
2. 🟢 GREEN: テストを通す最小限のコードを書く
3. 🔵 REFACTOR: テストが通る状態でリファクタ
4. ✅ VERIFY: リグレッションなしを確認
5. 📝 MARK: tasks.md のチェックボックスを更新

### Phase 6: Validation

```
/kiro-validate-impl <feature>
```

品質ゲート（既存の CLAUDE.md と統合）:

| ゲート | コマンド | タイミング |
|-------|---------|-----------|
| 型チェック | `npm run type-check` | 常に必須 |
| テスト | `npm run test:run` | 機能変更時 |
| ビルド | `npm run build` | リリース前・大規模変更時 |

### Phase 7: Documentation Sync

仕様・挙動・要件の変更があれば、コードと同一変更で更新する。

| 変更の種類 | 更新対象 |
|-----------|---------|
| 要件変更 | `docs/REQUIREMENTS.md` |
| 機能追加・削除 | `docs/FEATURES.md` |
| アーキテクチャ変更 | `docs/TECHNICAL_SPECS.md` |
| UX・画面仕様変更 | `docs/UX_DESIGN_SPEC.md` |

## 既存プロセスとのマッピング

| 既存（AGENTS.md / CLAUDE.md） | cc-sdd フロー |
|-------------------------------|--------------|
| 新機能追加時の実装順序 | Phase 1→2→3→4→5 |
| 品質ゲート（変更後に必ず実行） | Phase 6 |
| ドキュメント更新義務 | Phase 7 |
| コーディング規約 | `.kiro/steering/structure.md` + `.kiro/steering/tech.md` |
| AI API 連携時の注意 | `.kiro/steering/tech.md` Key Technical Decisions |

## コマンド一覧（GitHub Copilot）

| コマンド | 用途 | 出力 |
|---------|------|------|
| `/kiro-steering` | プロジェクトメモリ更新 | `.kiro/steering/*.md` |
| `/kiro-steering-custom` | ドメイン固有ステアリング追加 | `.kiro/steering/*.md` |
| `/kiro-spec-init <desc>` | スペック初期化 | `.kiro/specs/<feature>/` |
| `/kiro-spec-requirements <feature>` | 要件定義 | `requirements.md` |
| `/kiro-validate-gap <feature>` | ギャップ分析 | `gap-report.md` |
| `/kiro-spec-design <feature>` | 設計 | `design.md` |
| `/kiro-validate-design <feature>` | 設計レビュー | `design-validation.md` |
| `/kiro-spec-tasks <feature>` | タスク計画 | `tasks.md` |
| `/kiro-spec-impl <feature> [tasks]` | 実装 | コード変更 |
| `/kiro-validate-impl <feature>` | 実装検証 | バリデーションレポート |
| `/kiro-spec-status <feature>` | 進捗確認 | サマリー |

## Brownfield vs Greenfield の使い分け

### 既存機能の改善（Brownfield）
```
/kiro-steering → /kiro-spec-init → /kiro-spec-requirements
→ /kiro-validate-gap → /kiro-spec-design → /kiro-spec-tasks → /kiro-spec-impl
```

### 新規機能の追加（Greenfield）
```
/kiro-steering → /kiro-spec-init → /kiro-spec-requirements
→ /kiro-spec-design → /kiro-spec-tasks → /kiro-spec-impl
```

---
_updated_at: 2026-02-27_
