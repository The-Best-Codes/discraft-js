import pluginJs from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    ignores: [
      "**/.*", // Ignore all dot files/folders (e.g., .git, .vscode)
      "**/node_modules", // Ignore node_modules directory
      "**/dist", // Ignore dist directory
    ],
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
