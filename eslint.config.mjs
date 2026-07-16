import tsParser from "@typescript-eslint/parser";

// ESLint here enforces exactly one hard rule: every source file stays under
// 100 lines (counting blanks and comments). Regular linting is oxlint's job;
// formatting is oxfmt's.
const maxLines = ["error", { max: 99, skipBlankLines: false, skipComments: false }];

export default [
  {
    files: ["extensions/**/*.ts"],
    languageOptions: { parser: tsParser },
    rules: { "max-lines": maxLines },
  },
];
