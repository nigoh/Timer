# 📋 ドキュメント改善計画 - GitHubイシュー作成ガイド

このディレクトリには、`docs/DOCUMENTATION_IMPROVEMENT_PLAN.md` に基づくGitHubイシューテンプレートが含まれています。

## 📁 イシューテンプレート一覧

### Phase 1: 基盤整備 (Week 1-2)

1. **📋 ドキュメンテーションルールの策定**
   - ファイル: `documentation-rules.md`
   - 期間: 3日
   - 優先度: High

2. **📊 既存ドキュメントの棚卸しと分析**
   - ファイル: `documentation-audit.md`
   - 期間: 2日
   - 優先度: Medium

3. **🗂️ 新ディレクトリ構造の作成**
   - ファイル: `new-directory-structure.md`
   - 期間: 1日
   - 優先度: Medium

### Phase 2: コンテンツ移行 (Week 3-4)

4. **🏗️ アーキテクチャドキュメントの統合と更新**
   - ファイル: `architecture-docs-migration.md`
   - 期間: 5日
   - 優先度: High

5. **📱 機能別ドキュメントの整理と統合**
   - ファイル: `feature-docs-integration.md`
   - 期間: 7日
   - 優先度: High

6. **👨‍💻 開発ガイドの作成**
   - ファイル: `development-guide.md`
   - 期間: 4日
   - 優先度: Medium

### Phase 3: 品質向上 (Week 5-6)

7. **🧹 古いドキュメントの削除とクリーンアップ**
   - ファイル: `documentation-cleanup.md`
   - 期間: 2日
   - 優先度: Low

### Phase 4: 継続的改善 (Week 7-)

10. **🤖 ドキュメント品質チェック自動化**
    - ファイル: `documentation-automation.md`
    - 期間: 5日
    - 優先度: Enhancement

## 🚀 イシュー作成手順

### 1. GitHubでイシュー作成

各テンプレートファイルの内容をコピーして、以下の手順でイシューを作成してください：

1. GitHubリポジトリの「Issues」タブを開く
2. 「New issue」をクリック
3. テンプレートファイルの内容をコピー&ペースト
4. 適切なラベルとマイルストーンを設定
5. 担当者をアサイン

### 2. ラベル設定

各イシューには以下のラベルを設定してください：

- `documentation` (すべてのイシューに必須)
- 優先度: `high-priority`, `medium-priority`, `low-priority`
- カテゴリ: `standards`, `audit`, `structure`, `architecture`, `features`, `development`, `cleanup`, `automation`

### 3. マイルストーン設定

以下のマイルストーンを作成し、各イシューに設定してください：

- **Documentation Foundation** (Phase 1)
- **Content Migration** (Phase 2)
- **Quality Improvement** (Phase 3)
- **Continuous Improvement** (Phase 4)

### 4. 依存関係の管理

イシューの説明に記載されている依存関係を確認し、適切な順序で作業を進めてください。

## 📊 進捗管理

### プロジェクトボードの活用

1. GitHub Projectsでボードを作成
2. 各フェーズ用のカラムを設定
3. イシューを適切なカラムに配置
4. 進捗状況を定期的に更新

### 成果指標

#### 定量的指標
- ドキュメントファイル数: 58個 → 目標35個以下
- 重複率: < 10%
- 壊れたリンク: 0個

#### 定性的指標
- 新規開発者のオンボーディング時間短縮
- ドキュメント検索性の向上
- 情報の一貫性確保

## 📝 注意事項

### イシュー作成時の確認点

- [ ] タイトルが分かりやすい
- [ ] 受け入れ基準が明確
- [ ] 期間とマイルストーンが適切
- [ ] 依存関係が明記されている
- [ ] 担当者が決まっている

### 品質保証

- [ ] 各イシューにレビュープロセスを含める
- [ ] 完了基準を明確にする
- [ ] チーム内での合意を取る

## 🔗 関連ドキュメント

- `docs/DOCUMENTATION_IMPROVEMENT_PLAN.md` - 元となる改善計画
- `.github/copilot-instructions.md` - 開発ガイドライン

---

**このイシューテンプレートを活用して、体系的にドキュメント改善を進めてください。**
