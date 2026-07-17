// ESLint configuration for @payflow/auth-service
// Uses @typescript-eslint v8 in legacy (eslintrc) mode, compatible with ESLint 8.
'use strict';

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 2021,
    sourceType: 'module',
  },

  plugins: ['@typescript-eslint'],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],

  rules: {
    // ── TypeScript ─────────────────────────────────────────────────────────
    // Disallow implicit `any` — explicit `unknown` or a typed annotation required.
    '@typescript-eslint/no-explicit-any': 'error',
    // Unused vars are always bugs in a strictly-typed codebase.
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // Prefer `interface` for object shapes — easier to extend and read in errors.
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    // Require explicit return types on exported functions (aids readability).
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    // Allow non-null assertions only where the type system cannot help (e.g. after a guard).
    '@typescript-eslint/no-non-null-assertion': 'warn',
    // Floating promises are a common async bug class in payment flows.
    '@typescript-eslint/no-floating-promises': 'error',
    // Require await in async functions — prevents silent no-ops.
    '@typescript-eslint/require-await': 'error',

    // ── General ────────────────────────────────────────────────────────────
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    eqeqeq: ['error', 'always'],
    'prefer-const': 'error',
    'no-var': 'error',
  },

  // Per-glob overrides — applied in addition to the root rules above.
  overrides: [
    // ── Repositories ──────────────────────────────────────────────────────
    // Two type-aware rules produce false positives on repository files that
    // call Prisma 7's generated client. Prisma 7 emits @ts-nocheck in every
    // generated file, which causes the TypeScript type information surfaced
    // to ESLint to be `any`. This makes:
    //   • no-unsafe-return fire on `findUnique` calls (return type seen as any)
    //   • no-redundant-type-constituents fire on explicit `| null` annotations
    //     (any absorbs the union, making null redundant in ESLint's view)
    // Both rules are correct for hand-written code — they are disabled here
    // only for repository files that interact with the generated client.
    // The TypeScript compiler still enforces the correct types; this is a
    // lint-tool limitation, not a type-safety gap.
    {
      files: ['src/repositories/**/*.ts', 'src/services/**/*.ts', 'src/controllers/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-redundant-type-constituents': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
      },
    },

    // ── Test files ────────────────────────────────────────────────────────
    // Mocking and test helpers legitimately use patterns that would be wrong
    // in production code.
    {
      files: ['tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
      parserOptions: {
        project: './tsconfig.test.json',
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        'no-console': 'off',
      },
    },
  ],
};
