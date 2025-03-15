import pluginJs from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		ignores: ["**/.*", "**/dist/*", "browser/**"],
	},
	{
		files: ["**/*.{js,mjs,cjs,ts}"],
	},
	{ languageOptions: { globals: globals.node } },
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
];
