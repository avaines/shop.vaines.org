import globals from "globals";

export default [
  {
    files: ["worker/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "semi": ["error", "always"],
      "quotes": ["error", "single", { avoidEscape: true }],
      "indent": ["error", 2],
    },
  },
];
