import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

export default [
  { ignores: ['node_modules/**', 'dist/**', '.angular/**', 'coverage/**', 'playwright-report/**', 'test-results/**'] },
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: { 'no-debugger': 'error', 'no-unreachable': 'error', 'valid-typeof': 'error' },
  },
  {
    files: ['**/*.html'],
    languageOptions: { parser: angular.templateParser },
    plugins: { '@angular-eslint/template': angular.templatePlugin },
    rules: { '@angular-eslint/template/banana-in-box': 'error' },
  },
];
