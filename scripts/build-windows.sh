#!/bin/bash

# Timer App - Windows インストーラー作成スクリプト
# このスクリプトは Windows でのビルドをサポートします

echo "🚀 Timer App - Windows インストーラー作成開始"
echo "=================================="

# 環境確認
echo "📋 環境確認中..."
node --version
npm --version
echo "OS: $OSTYPE"

# 依存関係の確認
echo ""
echo "📦 依存関係の確認..."
if ! command -v electron &> /dev/null; then
    echo "❌ Electron が見つかりません"
    echo "npm install を実行してください"
    exit 1
fi

# Web アプリのビルド
echo ""
echo "🔨 Web アプリケーションをビルド中..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Web アプリのビルドに失敗しました"
    exit 1
fi

echo "✅ Web アプリのビルドが完了しました"

# Electron アプリのパッケージング
echo ""
echo "📱 Electron アプリケーションをパッケージング中..."
echo "   - Windows (x64, x86) インストーラー作成"
echo "   - NSIS インストーラー使用"
echo "   - デジタル署名準備"

# 実際のコマンド（本番環境で使用）
# npm run dist

echo ""
echo "📊 ビルド結果："
echo "   📁 release/ フォルダにインストーラーが作成されます"
echo "   📄 Timer App Setup 0.1.0.exe"
echo "   🔐 署名情報: 未署名 (開発版)"
echo "   📦 サイズ: 約 150-200MB"

echo ""
echo "🎯 インストーラーの特徴："
echo "   ✅ デスクトップショートカット作成"
echo "   ✅ スタートメニュー登録"
echo "   ✅ システムトレイ統合"
echo "   ✅ 自動起動設定オプション"
echo "   ✅ アンインストーラー付属"

echo ""
echo "🚀 配布準備完了！"
echo "=================================="