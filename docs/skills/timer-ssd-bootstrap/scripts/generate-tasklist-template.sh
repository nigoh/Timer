#!/usr/bin/env bash
set -euo pipefail

output_path="${1:-docs/skills/timer-ssd-bootstrap/tasklist-template.md}"

cat > "$output_path" <<'TEMPLATE'
# タスクリスト雛形

## 0. 前提
- 対象Issue:
- 参照仕様:

## 1. 要件確認
- [ ] 要件と制約を整理する
- [ ] 影響範囲を洗い出す

## 2. 設計
- [ ] 変更方針を定義する
- [ ] 対象ファイルを特定する
- [ ] 検証方法を定義する

## 3. 実装
- [ ] 最小差分で実装する
- [ ] ドキュメントと実装の整合を確認する

## 4. 検証
- [ ] テスト実行
- [ ] 静的解析
- [ ] 動作確認

## 5. PR作成
- [ ] 背景/変更点/影響範囲/検証手順/未解決事項を記載
- [ ] 仕様影響の有無を明記
TEMPLATE

echo "Generated: $output_path"
