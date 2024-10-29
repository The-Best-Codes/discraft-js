import js from '@eslint/js';
import globals from 'globals';

// Function to trim whitespace from global names
const trimGlobals = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key.trim(), value])
  );
};

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...trimGlobals(globals.browser),
        ...trimGlobals(globals.node)
      },
    },
    plugins: {},
    rules: {
      ...js.configs.recommended.rules,
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];