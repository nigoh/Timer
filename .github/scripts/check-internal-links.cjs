#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 内部リンクの整合性をチェックするスクリプト
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

// 内部リンクを抽出
function extractInternalLinks(content) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[2];
    // 内部リンク（相対パス、絶対パス、アンカー）を対象
    if (!url.startsWith('http') && !url.startsWith('mailto:')) {
      links.push({
        text: match[1],
        url: url,
        fullMatch: match[0]
      });
    }
  }
  
  return links;
}

// ファイルの存在確認
function checkFileExists(linkPath, baseDir) {
  // アンカーリンクを除去
  const filePath = linkPath.split('#')[0];
  if (!filePath) return true; // アンカーのみの場合はOK
  
  let fullPath;
  if (path.isAbsolute(filePath)) {
    fullPath = path.join(process.cwd(), filePath.substring(1));
  } else {
    fullPath = path.resolve(baseDir, filePath);
  }
  
  return fs.existsSync(fullPath);
}

// アンカーリンクの確認
function checkAnchorExists(content, anchor) {
  if (!anchor) return true;
  
  // ヘッダーアンカーのパターンをチェック
  const anchorPattern = anchor.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const headerRegex = new RegExp(`^#{1,6}\\s+.*${anchor}.*$`, 'mi');
  
  return headerRegex.test(content) || content.includes(`id="${anchor}"`);
}

// メイン処理
function main() {
  const rootDir = process.cwd();
  const mdFiles = getMdFiles(rootDir);
  let hasErrors = false;
  
  console.log('🔍 Checking internal links...');
  console.log(`Found ${mdFiles.length} markdown files`);
  
  for (const mdFile of mdFiles) {
    const content = fs.readFileSync(mdFile, 'utf8');
    const baseDir = path.dirname(mdFile);
    const internalLinks = extractInternalLinks(content);
    
    if (internalLinks.length > 0) {
      console.log(`\n📄 ${path.relative(rootDir, mdFile)}:`);
      
      for (const link of internalLinks) {
        const [filePath, anchor] = link.url.split('#');
        
        // ファイル存在確認
        if (!checkFileExists(link.url, baseDir)) {
          console.log(`  ❌ Broken link: ${link.fullMatch}`);
          console.log(`     Target file not found: ${link.url}`);
          hasErrors = true;
        }
        // アンカー確認（ファイルが存在する場合のみ）
        else if (anchor) {
          let targetContent = content; // 同一ファイル内のアンカー
          
          if (filePath) {
            const targetPath = path.isAbsolute(filePath) 
              ? path.join(rootDir, filePath.substring(1))
              : path.resolve(baseDir, filePath);
            
            if (fs.existsSync(targetPath)) {
              targetContent = fs.readFileSync(targetPath, 'utf8');
            }
          }
          
          if (!checkAnchorExists(targetContent, anchor)) {
            console.log(`  ⚠️  Anchor not found: ${link.fullMatch}`);
            console.log(`     Anchor: #${anchor}`);
            hasErrors = true;
          }
        }
        
        if (!hasErrors) {
          console.log(`  ✅ ${link.fullMatch}`);
        }
      }
    }
  }
  
  console.log('\n📊 Internal link check completed');
  
  if (hasErrors) {
    console.log('❌ Found broken internal links');
    process.exit(1);
  } else {
    console.log('✅ All internal links are valid');
  }
}

if (require.main === module) {
  main();
}

module.exports = { getMdFiles, extractInternalLinks, checkFileExists, checkAnchorExists };