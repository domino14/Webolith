import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import compatPlugin from 'eslint-plugin-compat';

export default tseslint.config(
  // Base recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      import: importPlugin,
      compat: compatPlugin,
    },
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {},
      },
    },
    rules: {
      // Core rules
      'quotes': ['error', 'single'],
      'jsx-quotes': ['error', 'prefer-double'],

      // React rules
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/destructuring-assignment': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-filename-extension': [
        'error',
        { extensions: ['.jsx', '.tsx'] },
      ],
      'react/prop-types': 'off',
      'react/require-default-props': 'off',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // Import rules
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],

      // Accessibility rules
      'jsx-a11y/anchor-is-valid': 'warn',

      // Compatibility rules
      'compat/compat': 'error',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['error'],
      'no-unused-vars': 'off',
    },
  },

  // TypeScript-specific overrides
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'react/jsx-filename-extension': [
        'error',
        { extensions: ['.tsx'] },
      ],
    },
  },

  // Test file overrides
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        { devDependencies: true },
      ],
    },
  }
);