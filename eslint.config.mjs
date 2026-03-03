import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: ["build/**", "node_modules/**", ".react-router/**"],
  },
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
];
