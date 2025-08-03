#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * ドキュメント品質レポートを生成するスクリプト
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

// ドキュメント統計を収集
function collectDocumentationStats() {
  const rootDir = process.cwd();
  const mdFiles = getMdFiles(rootDir);
  
  const stats = {
    totalFiles: mdFiles.length,
    totalLines: 0,
    totalWords: 0,
    totalCharacters: 0,
    filesByDirectory: {},
    largestFiles: [],
    recentFiles: [],
    linkCount: 0,
    imageCount: 0,
    codeBlockCount: 0
  };
  
  for (const mdFile of mdFiles) {
    const content = fs.readFileSync(mdFile, 'utf8');
    const stat = fs.statSync(mdFile);
    const relativePath = path.relative(rootDir, mdFile);
    const directory = path.dirname(relativePath);
    
    // ディレクトリ別統計
    if (!stats.filesByDirectory[directory]) {
      stats.filesByDirectory[directory] = 0;
    }
    stats.filesByDirectory[directory]++;
    
    // ファイル統計
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(word => word.length > 0).length;
    const characters = content.length;
    
    stats.totalLines += lines;
    stats.totalWords += words;
    stats.totalCharacters += characters;
    
    // 大きなファイルの記録
    stats.largestFiles.push({
      file: relativePath,
      lines: lines,
      words: words,
      characters: characters
    });
    
    // 最近更新されたファイル
    stats.recentFiles.push({
      file: relativePath,
      modified: stat.mtime,
      size: stat.size
    });
    
    // コンテンツ統計
    stats.linkCount += (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
    stats.imageCount += (content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length;
    stats.codeBlockCount += (content.match(/```/g) || []).length / 2;
  }
  
  // ソート
  stats.largestFiles.sort((a, b) => b.lines - a.lines);
  stats.largestFiles = stats.largestFiles.slice(0, 10);
  
  stats.recentFiles.sort((a, b) => b.modified - a.modified);
  stats.recentFiles = stats.recentFiles.slice(0, 10);
  
  return stats;
}

// 品質メトリクス計算
function calculateQualityMetrics(stats) {
  const metrics = {
    documentationCoverage: 'Good', // 仮の評価
    averageFileSize: Math.round(stats.totalLines / stats.totalFiles),
    contentDensity: Math.round(stats.totalWords / stats.totalFiles),
    linkDensity: Math.round((stats.linkCount / stats.totalFiles) * 100) / 100,
    imageDensity: Math.round((stats.imageCount / stats.totalFiles) * 100) / 100,
    codeExampleDensity: Math.round((stats.codeBlockCount / stats.totalFiles) * 100) / 100
  };
  
  // 品質スコア計算（簡易版）
  let qualityScore = 100;
  
  // ファイルサイズが大きすぎる場合は減点
  if (metrics.averageFileSize > 500) {
    qualityScore -= 10;
  }
  
  // リンクが少なすぎる場合は減点
  if (metrics.linkDensity < 1) {
    qualityScore -= 5;
  }
  
  // コード例が少なすぎる場合は減点
  if (metrics.codeExampleDensity < 0.5) {
    qualityScore -= 5;
  }
  
  metrics.overallQualityScore = Math.max(0, qualityScore);
  
  return metrics;
}

// レポート生成
function generateReport() {
  const timestamp = new Date().toISOString();
  const stats = collectDocumentationStats();
  const metrics = calculateQualityMetrics(stats);
  
  const report = `# 📊 Documentation Quality Report

Generated: ${timestamp}

## 📈 Overview

- **Total Files**: ${stats.totalFiles}
- **Total Lines**: ${stats.totalLines.toLocaleString()}
- **Total Words**: ${stats.totalWords.toLocaleString()}
- **Total Characters**: ${stats.totalCharacters.toLocaleString()}
- **Overall Quality Score**: ${metrics.overallQualityScore}/100

## 📂 File Distribution

| Directory | File Count |
|-----------|------------|
${Object.entries(stats.filesByDirectory)
  .sort(([,a], [,b]) => b - a)
  .map(([dir, count]) => `| ${dir || 'root'} | ${count} |`)
  .join('\n')}

## 📋 Quality Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Average File Size | ${metrics.averageFileSize} lines | ${metrics.averageFileSize > 500 ? '⚠️ Large' : '✅ Good'} |
| Content Density | ${metrics.contentDensity} words/file | ${metrics.contentDensity > 100 ? '✅ Good' : '⚠️ Low'} |
| Link Density | ${metrics.linkDensity} links/file | ${metrics.linkDensity > 1 ? '✅ Good' : '⚠️ Low'} |
| Image Density | ${metrics.imageDensity} images/file | ✅ Good |
| Code Example Density | ${metrics.codeExampleDensity} blocks/file | ${metrics.codeExampleDensity > 0.5 ? '✅ Good' : '⚠️ Low'} |

## 📄 Largest Files

| File | Lines | Words |
|------|-------|-------|
${stats.largestFiles
  .map(file => `| ${file.file} | ${file.lines} | ${file.words} |`)
  .join('\n')}

## 🕐 Recently Updated Files

| File | Modified | Size |
|------|----------|------|
${stats.recentFiles
  .map(file => `| ${file.file} | ${file.modified.toISOString().split('T')[0]} | ${file.size} bytes |`)
  .join('\n')}

## 🔗 Content Statistics

- **Total Links**: ${stats.linkCount}
- **Total Images**: ${stats.imageCount}
- **Total Code Blocks**: ${Math.round(stats.codeBlockCount)}

## 📝 Recommendations

${metrics.overallQualityScore < 80 ? `
### ⚠️ Areas for Improvement

${metrics.averageFileSize > 500 ? '- Consider breaking down large files into smaller, more focused documents\n' : ''}${metrics.linkDensity < 1 ? '- Add more cross-references and external links to improve navigation\n' : ''}${metrics.codeExampleDensity < 0.5 ? '- Include more code examples to illustrate concepts\n' : ''}
` : `
### ✅ Documentation Quality is Good

The documentation maintains high quality standards. Continue monitoring for consistency and updates.
`}

## 🎯 Next Steps

1. Review files with high line counts for potential splitting
2. Ensure all documentation is up-to-date
3. Add missing links and cross-references
4. Include more practical examples where appropriate
5. Set up automated quality monitoring

---

*Report generated by Documentation Quality Automation*
`;

  return report;
}

// メイン処理
function main() {
  console.log('📊 Generating documentation quality report...');
  
  const report = generateReport();
  const outputFile = 'quality-report.md';
  
  fs.writeFileSync(outputFile, report);
  
  console.log(`✅ Quality report generated: ${outputFile}`);
  console.log('\n📋 Report Summary:');
  
  const stats = collectDocumentationStats();
  const metrics = calculateQualityMetrics(stats);
  
  console.log(`  - Total Files: ${stats.totalFiles}`);
  console.log(`  - Quality Score: ${metrics.overallQualityScore}/100`);
  console.log(`  - Average File Size: ${metrics.averageFileSize} lines`);
  console.log(`  - Content Density: ${metrics.contentDensity} words/file`);
}

if (require.main === module) {
  main();
}

module.exports = { 
  getMdFiles, 
  collectDocumentationStats, 
  calculateQualityMetrics, 
  generateReport 
};