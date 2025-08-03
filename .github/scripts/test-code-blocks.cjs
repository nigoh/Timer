#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Markdownファイル内のコードブロックを抽出してテストするスクリプト
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

// コードブロックを抽出
function extractCodeBlocks(content) {
  const codeBlocks = [];
  const fencedCodeRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  
  while ((match = fencedCodeRegex.exec(content)) !== null) {
    const language = match[1] || 'text';
    const code = match[2].trim();
    
    codeBlocks.push({
      language: language.toLowerCase(),
      code: code,
      fullMatch: match[0]
    });
  }
  
  return codeBlocks;
}

// JavaScript/TypeScript コードブロックのテスト
function testJavaScriptCode(code, language) {
  try {
    // 一時ファイルに書き込み
    const tempFile = path.join('/tmp', `test-${Date.now()}.${language === 'typescript' ? 'ts' : 'js'}`);
    
    // TypeScriptの場合は型チェックを無効化
    let testCode = code;
    if (language === 'typescript') {
      testCode = `// @ts-nocheck\n${code}`;
    }
    
    // import/export文がある場合は実行しない（構文チェックのみ）
    if (code.includes('import ') || code.includes('export ')) {
      // 構文チェックのみ実行
      fs.writeFileSync(tempFile, testCode);
      
      if (language === 'typescript') {
        execSync(`npx tsc --noEmit --skipLibCheck ${tempFile}`, { stdio: 'pipe' });
      } else {
        execSync(`node --check ${tempFile}`, { stdio: 'pipe' });
      }
      
      fs.unlinkSync(tempFile);
      return { success: true, type: 'syntax-check' };
    }
    
    // 実行可能なコードかチェック
    const hasConsoleLog = code.includes('console.log');
    const hasFunction = code.includes('function') || code.includes('=>');
    
    if (hasConsoleLog || hasFunction) {
      fs.writeFileSync(tempFile, testCode);
      
      if (language === 'typescript') {
        // TypeScriptは一度JSにコンパイルしてから実行
        const jsFile = tempFile.replace('.ts', '.js');
        execSync(`npx tsc --target es2017 --module commonjs --outFile ${jsFile} ${tempFile}`, { stdio: 'pipe' });
        execSync(`node ${jsFile}`, { stdio: 'pipe', timeout: 5000 });
        fs.unlinkSync(jsFile);
      } else {
        execSync(`node ${tempFile}`, { stdio: 'pipe', timeout: 5000 });
      }
      
      fs.unlinkSync(tempFile);
      return { success: true, type: 'execution' };
    }
    
    return { success: true, type: 'skipped', reason: 'No executable code found' };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      type: 'error'
    };
  }
}

// JSON構文チェック
function testJsonCode(code) {
  try {
    JSON.parse(code);
    return { success: true, type: 'syntax-check' };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      type: 'syntax-error'
    };
  }
}

// YAML構文チェック（簡易）
function testYamlCode(code) {
  try {
    // 基本的なYAML構文チェック
    const lines = code.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        // 基本的な構文エラーをチェック
        if (trimmed.includes(': ') && trimmed.indexOf(': ') === 0) {
          throw new Error('Invalid YAML syntax: key cannot start with colon');
        }
      }
    }
    return { success: true, type: 'basic-syntax-check' };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      type: 'syntax-error'
    };
  }
}

// メイン処理
function main() {
  const rootDir = process.cwd();
  const mdFiles = getMdFiles(rootDir);
  let hasErrors = false;
  const stats = {
    totalBlocks: 0,
    testedBlocks: 0,
    passedBlocks: 0,
    failedBlocks: 0,
    skippedBlocks: 0
  };
  
  console.log('🧪 Testing code blocks in documentation...');
  console.log(`Found ${mdFiles.length} markdown files`);
  
  for (const mdFile of mdFiles) {
    const content = fs.readFileSync(mdFile, 'utf8');
    const codeBlocks = extractCodeBlocks(content);
    
    if (codeBlocks.length > 0) {
      console.log(`\n📄 ${path.relative(rootDir, mdFile)}:`);
      
      for (const block of codeBlocks) {
        stats.totalBlocks++;
        let result;
        
        switch (block.language) {
          case 'javascript':
          case 'js':
          case 'typescript':
          case 'ts':
            stats.testedBlocks++;
            result = testJavaScriptCode(block.code, block.language);
            break;
            
          case 'json':
            stats.testedBlocks++;
            result = testJsonCode(block.code);
            break;
            
          case 'yaml':
          case 'yml':
            stats.testedBlocks++;
            result = testYamlCode(block.code);
            break;
            
          default:
            result = { success: true, type: 'not-tested', reason: `Language ${block.language} not supported` };
            stats.skippedBlocks++;
        }
        
        if (result.success) {
          stats.passedBlocks++;
          const typeMsg = result.type === 'execution' ? '(executed)' :
                         result.type === 'syntax-check' ? '(syntax checked)' :
                         result.type === 'basic-syntax-check' ? '(basic syntax checked)' :
                         '(skipped)';
          console.log(`  ✅ ${block.language} code block ${typeMsg}`);
          if (result.reason) {
            console.log(`     Reason: ${result.reason}`);
          }
        } else {
          stats.failedBlocks++;
          hasErrors = true;
          console.log(`  ❌ ${block.language} code block failed`);
          console.log(`     Error: ${result.error}`);
        }
      }
    }
  }
  
  // 統計情報の表示
  console.log('\n📊 Code block test summary:');
  console.log(`  Total code blocks: ${stats.totalBlocks}`);
  console.log(`  Tested blocks: ${stats.testedBlocks}`);
  console.log(`  Passed blocks: ${stats.passedBlocks}`);
  console.log(`  Failed blocks: ${stats.failedBlocks}`);
  console.log(`  Skipped blocks: ${stats.skippedBlocks}`);
  
  if (hasErrors) {
    console.log('\n❌ Some code blocks failed validation');
    process.exit(1);
  } else {
    console.log('\n✅ All tested code blocks are valid');
  }
}

if (require.main === module) {
  main();
}

module.exports = { getMdFiles, extractCodeBlocks, testJavaScriptCode, testJsonCode, testYamlCode };