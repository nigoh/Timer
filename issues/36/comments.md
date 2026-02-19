以下、Timerリポジトリの現行技術スタック（TypeScript/React + Vite、Zustand、Tailwind/Radix UI など）を前提にした設計案です。

## 設計方針
- 既存のフロントエンド構成（React + TypeScript）に統合し、追加のバックエンドは最小限にする
- まずは GitHub/GitLab の API 連携を「手動トークン入力方式」で実装し、将来的に OAuth へ拡張可能な構成にする
- タイムログと外部タスクを「1対1のリンク」として保存し、UI/UX をシンプルに保つ

## データモデル案（フロントエンド保存 or ローカルストレージ/Zustand）
- TimeLog: { id, title, startedAt, endedAt, duration, note }
- IntegrationLink: { timeLogId, provider(github/gitlab), repo, issueOrMrId, url }

## UI案
- タイムログ詳細画面に「タスク連携」セクションを追加
- 連携先（GitHub/GitLab）とリポジトリ、Issue/MR 番号を入力して紐付け
- 連携済みの場合はリンク表示（外部URL）＋解除ボタン

## API連携（フロントから直接呼ぶ簡易案）
- GitHub REST API
  - Issue 取得: GET /repos/{owner}/{repo}/issues/{number}
  - コメント投稿（任意）: POST /repos/{owner}/{repo}/issues/{number}/comments
- GitLab REST API
  - Issue 取得: GET /projects/:id/issues/:issue_iid

※ CORS やトークン管理の都合で、必要に応じて軽量なプロキシ（Vercel/Cloudflare Workers等）を追加

## ストア設計（Zustand）
- integrationStore: 連携情報の追加・削除・取得
- timeLogStore: 既存のタイムログと紐付け

## 次のステップ
1. 画面とデータモデルの最小実装（ローカル保存）
2. GitHub API 連携（読み取りのみ）
3. コメント投稿などの双方向連携

必要であれば、UIモックや具体的なAPI呼び出しコード（TypeScript）まで落とし込みます。