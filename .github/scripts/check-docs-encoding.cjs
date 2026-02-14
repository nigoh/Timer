#!/usr/bin/env node

const { execSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { TextDecoder } = require('node:util');

const targetFiles = execSync('git ls-files "README.md" "docs/**/*.md"', { encoding: 'utf8' })
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const decoder = new TextDecoder('utf-8', { fatal: true });
const suspiciousPatterns = [
  /\uFFFD/g, // 置換文字
  /Ã./g,
  /Â./g,
  /ã[-¿]/g,
  /ï»¿/g, // よくある文字化け断片
];

let hasError = false;

for (const filePath of targetFiles) {
  const buffer = readFileSync(filePath);

  try {
    decoder.decode(buffer);
  } catch (error) {
    console.error(`❌ UTF-8としてデコードできません: ${filePath}`);
    hasError = true;
    continue;
  }

  const text = buffer.toString('utf8');
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      console.error(`❌ 文字化けが疑われる文字列を検出: ${filePath} (${pattern})`);
      hasError = true;
      break;
    }
  }
}

if (hasError) {
  process.exit(1);
}

console.log(`✅ UTF-8/文字化けチェックに成功: ${targetFiles.length} files`);
