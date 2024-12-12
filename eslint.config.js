import js from "@eslint/js";
import globals from "globals";
import importPlugin from "eslint-plugin-import";
import promisePlugin from "eslint-plugin-promise";
import nodePlugin from "eslint-plugin-node";

// Function to trim whitespace from global names
const trimGlobals = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key.trim(), value]),
  );
};

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...trimGlobals(globals.browser),
        ...trimGlobals(globals.node),
      },
    },
    plugins: {
      ...js.configs.recommended.plugins,
      import: importPlugin,
      promise: promisePlugin,
      node: nodePlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      "import/named": "error",
      "promise/always-return": "error",
      "promise/no-return-wrap": "error",
      "no-unused-vars": "warn",
      "consistent-return": "error",
      camelcase: "warn",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
