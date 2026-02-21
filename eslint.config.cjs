const tsEslintPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const reactRefreshPlugin = require('eslint-plugin-react-refresh');
const securityPlugin = require('eslint-plugin-security');
const noUnsanitizedPlugin = require('eslint-plugin-no-unsanitized');

module.exports = [
  {
    ignores: ['dist', 'node_modules', 'coverage'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
      'security': securityPlugin,
      'no-unsanitized': noUnsanitizedPlugin,
    },
    rules: {
      ...tsEslintPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // --- セキュリティルール（OWASP Top 10 対策） ---
      // eval() / new Function() 等の動的コード実行を禁止
      'security/detect-eval-with-expression': 'error',
      // 正規表現の ReDoS (Catastrophic Backtracking) を検出
      'security/detect-unsafe-regex': 'error',
      // child_process / exec の安全でない使用を禁止
      'security/detect-child-process': 'error',
      // Buffer() コンストラクタ（非推奨・安全でない）を禁止
      'security/detect-new-buffer': 'error',
      // 変数をキーとしたオブジェクトアクセス（Prototype Pollution）を警告
      'security/detect-object-injection': 'warn',
      // innerHTML への未サニタイズ代入を禁止（XSS 対策）
      'no-unsanitized/property': 'error',
      // document.write 等への未サニタイズ挿入を禁止
      'no-unsanitized/method': 'error',
    },
  },
];