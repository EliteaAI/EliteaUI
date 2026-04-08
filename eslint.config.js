import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';

import babelParser from '@babel/eslint-parser';
import js from '@eslint/js';

export default [
  {
    // Clear this condition when we are ready to lint everything
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'tests/**',
      '*.min.js',
      '*.bundle.js',
      '.vscode/**',
      '.github/**',
      '.storybook/**',
    ],
  },
  // Base configuration
  js.configs.recommended,

  // React plugin configuration
  {
    files: ['src/**/*.{js,jsx}'], // Only target source files
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: babelParser, // Use Babel parser to handle JSX
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        requireConfigFile: false, // Allow parsing without a Babel config file
        babelOptions: {
          presets: ['@babel/preset-react'], // Enable JSX parsing via Babel preset
        },
        ecmaFeatures: {
          jsx: true, // Enable JSX parsing
        },
      },
      globals: {
        // // Add browser globals like `console`, `window`, `document`, etc.
        // ...js.environments.browser.globals,
        // // Add ES2021 globals like `Promise`, `Set`, `Map`, etc.
        // ...js.environments.es2021.globals,
        // Browser globals
        ...globals.browser,
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        location: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        history: 'readonly',
        open: 'readonly',
        styled: 'readonly', // Custom global variable

        // ES2021 globals
        Promise: 'readonly',
        Set: 'readonly',
        Map: 'readonly',
        WeakSet: 'readonly',
        WeakMap: 'readonly',
        Symbol: 'readonly',
        BigInt: 'readonly',
        FileReader: 'readonly',
        URL: 'readonly',
        FormData: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        Headers: 'readonly',
        Image: 'readonly',
        XMLSerializer: 'readonly',
        File: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      // React rules
      'react/jsx-no-target-blank': 'off',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'error',
      'react/jsx-no-bind': 'off',
      'react/jsx-pascal-case': 'error',
      'react/jsx-no-undef': ['error', { allowGlobals: true }],
      'react-refresh/only-export-components': ['off'],

      // Import rules
      'import/no-unresolved': ['error', { ignore: ['.svg'] }],
      'import/no-useless-path-segments': 'error',
      'import/no-duplicates': 'error',
      'import/no-unused-modules': 'warn',

      // Code quality rules
      'no-unused-vars': ['error'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'no-shadow': 'error',
      'vars-on-top': 'error',
      'no-undef': 'error',
      'no-constant-binary-expression': 'warn',
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect React version
      },
      'import/resolver': {
        alias: {
          map: [['@', './src']],
          extensions: ['.ts', '.js', '.jsx', '.json', '.svg'],
        },
      },
      'import/external-module-folders': ['node_modules'],
      'import/extensions': ['.js', '.jsx', '.ts', '.tsx', '.d.ts', '.svg'],
    },
  },
  ...storybook.configs['flat/recommended'],
];
