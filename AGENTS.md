# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `.kiro/specs/` for active specifications
- Use `/kiro-spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, generate responses in Japanese. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

## ⚠️ Mandatory cc-sdd Rule

**すべての新機能追加・既存機能の大幅改修は、必ず cc-sdd フロー（Spec-Driven Development）を通じて設計を完了してから実装を開始すること。**

- `.kiro/specs/<feature>/` に `requirements.md`・`design.md`・`tasks.md` が揃っていない状態での実装開始は禁止。
- specなしでコードを書き始めることは、いかなる理由があっても認められない。
- ユーザーから実装を直接依頼された場合でも、まず cc-sdd フローでスペックを作成し、承認を得てから実装する。

## Minimal Workflow
- Phase 0 (optional): `/kiro-steering`, `/kiro-steering-custom`
- Phase 1 (Specification) — **必須**:
  - `/kiro-spec-init "description"` — スペック初期化
  - `/kiro-spec-requirements {feature}` — 要件定義（⛳ 人間レビュー必須）
  - `/kiro-validate-gap {feature}` (既存コードベースへの変更時は必須)
  - `/kiro-spec-design {feature}` — 設計（⛳ 人間レビュー必須）
  - `/kiro-validate-design {feature}` (推奨)
  - `/kiro-spec-tasks {feature}` — タスク計画（⛳ 人間レビュー必須）
  - > ※ `-y` フラグは人間が明示的に承認したうえで fast-track する場合にのみ使用可。
- Phase 2 (Implementation) — **スペック承認後のみ開始可能**: `/kiro-spec-impl {feature} [tasks]`
  - `/kiro-validate-impl {feature}` (推奨)
- Progress check: `/kiro-spec-status {feature}` (use anytime)

## Development Rules
- **cc-sdd ファースト**: 実装より先にスペックを作る。スペックなし実装は禁止。
- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro-spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Steering Configuration
- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro-steering-custom`)
