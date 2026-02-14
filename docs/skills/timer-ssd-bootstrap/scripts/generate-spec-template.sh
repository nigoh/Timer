#!/usr/bin/env bash
set -euo pipefail

output_path="${1:-docs/skills/timer-ssd-bootstrap/spec-template.md}"

cat > "$output_path" <<'TEMPLATE'
# 仕様テンプレート

## 背景
- 

## 要件整理
- 対象要件:
- 非機能要件:

## 仕様分解
- UI:
- 状態管理:
- 永続化:
- エラーハンドリング:

## 実装計画
1. 
2. 
3. 

## テスト観点
- 正常系:
- 異常系:
- 境界値:

## 影響範囲
- ドキュメント:
- 実装:

## 完了条件
- [ ] DoDを満たす
- [ ] 必要テストが成功
TEMPLATE

echo "Generated: $output_path"
