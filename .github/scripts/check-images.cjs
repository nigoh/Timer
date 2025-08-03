#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 画像ファイル参照の整合性をチェックするスクリプト
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

// 画像参照を抽出
function extractImageReferences(content) {
  const images = [];
  
  // Markdown画像記法: ![alt](src)
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = markdownImageRegex.exec(content)) !== null) {
    images.push({
      type: 'markdown',
      alt: match[1],
      src: match[2],
      fullMatch: match[0]
    });
  }
  
  // HTML img タグ
  const htmlImageRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  while ((match = htmlImageRegex.exec(content)) !== null) {
    images.push({
      type: 'html',
      src: match[1],
      fullMatch: match[0]
    });
  }
  
  return images;
}

// 画像ファイルの存在確認
function checkImageExists(imageSrc, baseDir) {
  // 外部URLの場合はスキップ
  if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
    return { exists: true, isExternal: true };
  }
  
  // データURLの場合はスキップ
  if (imageSrc.startsWith('data:')) {
    return { exists: true, isDataUrl: true };
  }
  
  let fullPath;
  if (path.isAbsolute(imageSrc)) {
    fullPath = path.join(process.cwd(), imageSrc.substring(1));
  } else {
    fullPath = path.resolve(baseDir, imageSrc);
  }
  
  return { 
    exists: fs.existsSync(fullPath), 
    fullPath: fullPath,
    isExternal: false,
    isDataUrl: false 
  };
}

// 画像ファイル拡張子の確認
function isValidImageExtension(filePath) {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico'];
  const ext = path.extname(filePath).toLowerCase();
  return validExtensions.includes(ext);
}

// メイン処理
function main() {
  const rootDir = process.cwd();
  const mdFiles = getMdFiles(rootDir);
  let hasErrors = false;
  const stats = {
    totalImages: 0,
    validImages: 0,
    brokenImages: 0,
    externalImages: 0,
    dataUrlImages: 0
  };
  
  console.log('🖼️  Checking image references...');
  console.log(`Found ${mdFiles.length} markdown files`);
  
  for (const mdFile of mdFiles) {
    const content = fs.readFileSync(mdFile, 'utf8');
    const baseDir = path.dirname(mdFile);
    const imageRefs = extractImageReferences(content);
    
    if (imageRefs.length > 0) {
      console.log(`\n📄 ${path.relative(rootDir, mdFile)}:`);
      
      for (const image of imageRefs) {
        stats.totalImages++;
        const result = checkImageExists(image.src, baseDir);
        
        if (result.isExternal) {
          stats.externalImages++;
          console.log(`  🌐 External image: ${image.fullMatch}`);
        } else if (result.isDataUrl) {
          stats.dataUrlImages++;
          console.log(`  📊 Data URL image: ${image.fullMatch.substring(0, 50)}...`);
        } else if (result.exists) {
          // 拡張子チェック
          if (isValidImageExtension(image.src)) {
            stats.validImages++;
            console.log(`  ✅ ${image.fullMatch}`);
          } else {
            console.log(`  ⚠️  Invalid image extension: ${image.fullMatch}`);
            console.log(`     File: ${image.src}`);
          }
        } else {
          stats.brokenImages++;
          hasErrors = true;
          console.log(`  ❌ Image not found: ${image.fullMatch}`);
          console.log(`     Expected path: ${result.fullPath}`);
        }
      }
    }
  }
  
  // 統計情報の表示
  console.log('\n📊 Image reference check summary:');
  console.log(`  Total images: ${stats.totalImages}`);
  console.log(`  Valid local images: ${stats.validImages}`);
  console.log(`  External images: ${stats.externalImages}`);
  console.log(`  Data URL images: ${stats.dataUrlImages}`);
  console.log(`  Broken images: ${stats.brokenImages}`);
  
  if (hasErrors) {
    console.log('\n❌ Found broken image references');
    process.exit(1);
  } else {
    console.log('\n✅ All image references are valid');
  }
}

if (require.main === module) {
  main();
}

module.exports = { getMdFiles, extractImageReferences, checkImageExists, isValidImageExtension };