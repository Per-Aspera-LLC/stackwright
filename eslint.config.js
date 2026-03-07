const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const prettier = require('eslint-config-prettier');

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  // Global ignores
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'examples/**'],
  },

  // TypeScript files
  {
    files: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx', 'packages/*/test/**/*.ts', 'packages/*/test/**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: '19',
      },
    },
    rules: {
      // TypeScript recommended rules (manually selected to avoid needing tseslint.configs)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off', // TODO: enable as 'warn' and fix incrementally
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',

      // React
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+ JSX transform
      'react/prop-types': 'off', // TypeScript handles prop validation
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General
      'no-console': 'off', // Project uses gated debug logging
      eqeqeq: ['warn', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'warn',
    },
  },

  // Disable formatting rules (Prettier handles formatting)
  prettier,
];
