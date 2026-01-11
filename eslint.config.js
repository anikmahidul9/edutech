// eslint.config.js
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    // Global ignores
    ignores: [".next/", "node_modules/", "dist/", "build/"],
  },
  // Base JavaScript configuration
  pluginJs.configs.recommended,

  // TypeScript configuration
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.json"], // Apply project only to TS files
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },

  // React configuration
  {
    files: ["**/*.{js,jsx,ts,tsx}"], // Apply to all files that might contain JSX
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "@next/next": nextPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // Next.js doesn't require React to be in scope
      "react/jsx-uses-react": "off", // Next.js doesn't require React to be in scope
      // Add more custom React rules as needed
    },
  },
];
