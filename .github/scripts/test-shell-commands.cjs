#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Markdownファイル内のシェルコマンド例をチェックするスクリプト
 */

// Markdown ファイルを再帰的に取得
function getMdFiles(dir, files = []) {
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      getMdFiles(fullPath, files);
    } else if (entry.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// シェルコマンドブロックを抽出
function extractShellCommands(content) {
  const commands = [];
  const shellCodeRegex = /```(?:bash|shell|sh|console|terminal)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = shellCodeRegex.exec(content)) !== null) {
    const commandText = match[1].trim();
    
    // 各行を分析
    const lines = commandText.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      // コメント行やプロンプト記号を除外
      if (trimmed && 
          !trimmed.startsWith('#') && 
          !trimmed.startsWith('$') && 
          !trimmed.startsWith('>')) {
        
        // プロンプト記号を削除
        const cleanCommand = trimmed.replace(/^\$\s*/, '').replace(/^>\s*/, '');
        
        if (cleanCommand) {
          commands.push({
            command: cleanCommand,
            originalLine: line,
            fullBlock: match[0]
          });
        }
      }
    }
  }
  
  return commands;
}

// 安全でないコマンドの検出
function isUnsafeCommand(command) {
  const unsafePatterns = [
    /rm\s+-rf?\s+\//, // システムディレクトリの削除
    /sudo\s+rm/, // sudo rm
    /mkfs/, // ファイルシステムフォーマット
    /dd\s+if=/, // ディスクイメージ操作
    />\s*\/dev\//, // デバイスファイルへの書き込み
    /chmod\s+777/, // 危険な権限設定
    /curl.*\|\s*sh/, // curl | sh パターン
    /wget.*\|\s*sh/, // wget | sh パターン
    /:(){ :|:& };:/, // フォークボム
  ];
  
  return unsafePatterns.some(pattern => pattern.test(command));
}

// コマンドの構文チェック
function validateCommandSyntax(command) {
  try {
    // 危険なコマンドはスキップ
    if (isUnsafeCommand(command)) {
      return { valid: false, reason: 'unsafe-command', error: 'Unsafe command detected' };
    }
    
    // 基本的な構文チェック
    
    // パイプの検証
    if (command.includes('|')) {
      const parts = command.split('|');
      if (parts.some(part => part.trim() === '')) {
        return { valid: false, reason: 'invalid-pipe', error: 'Empty pipe segment' };
      }
    }
    
    // リダイレクトの検証
    if (command.includes('>')) {
      // 基本的なリダイレクト構文チェック
      if (/>\s*$/.test(command)) {
        return { valid: false, reason: 'invalid-redirect', error: 'Redirect without target' };
      }
    }
    
    // 引用符の対応チェック
    const singleQuotes = (command.match(/'/g) || []).length;
    const doubleQuotes = (command.match(/"/g) || []).length;
    
    if (singleQuotes % 2 !== 0) {
      return { valid: false, reason: 'unmatched-quotes', error: 'Unmatched single quotes' };
    }
    
    if (doubleQuotes % 2 !== 0) {
      return { valid: false, reason: 'unmatched-quotes', error: 'Unmatched double quotes' };
    }
    
    // よく使われる安全なコマンドのリスト
    const safeCommands = [
      'ls', 'cat', 'echo', 'pwd', 'whoami', 'date', 'which', 'whereis',
      'npm', 'node', 'git', 'cd', 'mkdir', 'touch', 'cp', 'mv',
      'grep', 'find', 'wc', 'head', 'tail', 'sort', 'uniq',
      'curl', 'wget', 'ping', 'ssh', 'scp',
      'docker', 'kubectl', 'helm',
      'yarn', 'pnpm', 'npx'
    ];
    
    const firstWord = command.split(/\s+/)[0];
    const baseCommand = firstWord.split('/').pop(); // パスを除去
    
    if (safeCommands.includes(baseCommand)) {
      return { valid: true, reason: 'safe-command' };
    }
    
    // その他のコマンドは注意が必要だが、構文的にはOK
    return { valid: true, reason: 'unknown-command', warning: 'Unknown command - manual verification recommended' };
    
  } catch (error) {
    return { valid: false, reason: 'syntax-error', error: error.message };
  }
}

// コマンド例の実行可能性チェック
function checkCommandExecutability(command) {
  // プレースホルダーやサンプル値を検出
  const placeholderPatterns = [
    /<[^>]+>/, // <placeholder>
    /\$\{[^}]+\}/, // ${variable}
    /YOUR_[A-Z_]+/, // YOUR_API_KEY
    /REPLACE_[A-Z_]+/, // REPLACE_WITH_YOUR_VALUE
    /\[YOUR_[^\]]+\]/, // [YOUR_VALUE]
    /example\.com/, // example.com
    /username/, // username
    /password/, // password
  ];
  
  const hasPlaceholders = placeholderPatterns.some(pattern => pattern.test(command));
  
  if (hasPlaceholders) {
    return { executable: false, reason: 'has-placeholders' };
  }
  
  // 対話的なコマンドの検出
  const interactiveCommands = ['vim', 'nano', 'emacs', 'less', 'more', 'top', 'htop'];
  const firstWord = command.split(/\s+/)[0].split('/').pop();
  
  if (interactiveCommands.includes(firstWord)) {
    return { executable: false, reason: 'interactive-command' };
  }
  
  return { executable: true, reason: 'looks-executable' };
}

// メイン処理
function main() {
  const rootDir = process.cwd();
  const mdFiles = getMdFiles(rootDir);
  let hasErrors = false;
  const stats = {
    totalCommands: 0,
    validCommands: 0,
    invalidCommands: 0,
    unsafeCommands: 0,
    withWarnings: 0
  };
  
  console.log('🐚 Validating shell command examples...');
  console.log(`Found ${mdFiles.length} markdown files`);
  
  for (const mdFile of mdFiles) {
    const content = fs.readFileSync(mdFile, 'utf8');
    const shellCommands = extractShellCommands(content);
    
    if (shellCommands.length > 0) {
      console.log(`\n📄 ${path.relative(rootDir, mdFile)}:`);
      
      for (const cmdInfo of shellCommands) {
        stats.totalCommands++;
        const validation = validateCommandSyntax(cmdInfo.command);
        const executability = checkCommandExecutability(cmdInfo.command);
        
        if (validation.reason === 'unsafe-command') {
          stats.unsafeCommands++;
          hasErrors = true;
          console.log(`  ⚠️  UNSAFE: ${cmdInfo.command}`);
          console.log(`     Reason: ${validation.error}`);
        } else if (!validation.valid) {
          stats.invalidCommands++;
          hasErrors = true;
          console.log(`  ❌ INVALID: ${cmdInfo.command}`);
          console.log(`     Error: ${validation.error}`);
        } else {
          stats.validCommands++;
          
          if (validation.warning) {
            stats.withWarnings++;
            console.log(`  ⚠️  ${cmdInfo.command}`);
            console.log(`     Warning: ${validation.warning}`);
          } else {
            console.log(`  ✅ ${cmdInfo.command}`);
          }
          
          if (!executability.executable) {
            console.log(`     Note: ${executability.reason}`);
          }
        }
      }
    }
  }
  
  // 統計情報の表示
  console.log('\n📊 Shell command validation summary:');
  console.log(`  Total commands: ${stats.totalCommands}`);
  console.log(`  Valid commands: ${stats.validCommands}`);
  console.log(`  Invalid commands: ${stats.invalidCommands}`);
  console.log(`  Unsafe commands: ${stats.unsafeCommands}`);
  console.log(`  Commands with warnings: ${stats.withWarnings}`);
  
  if (hasErrors) {
    console.log('\n❌ Found invalid or unsafe shell commands');
    process.exit(1);
  } else {
    console.log('\n✅ All shell commands passed validation');
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  getMdFiles, 
  extractShellCommands, 
  isUnsafeCommand, 
  validateCommandSyntax, 
  checkCommandExecutability 
};