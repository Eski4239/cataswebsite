import {FlatCompat} from '@eslint/eslintrc';

const compat = new FlatCompat({baseDirectory: import.meta.dirname});

const config = [
  {ignores: ['.next/**', 'node_modules/**', 'tests/fixtures/**', 'next-env.d.ts']},
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // Tests build loosely-typed fake Telegram/GitHub/Claude payloads on purpose.
    files: ['tests/**'],
    rules: {'@typescript-eslint/no-explicit-any': 'off', '@typescript-eslint/no-unused-expressions': 'off'}
  }
];

export default config;
