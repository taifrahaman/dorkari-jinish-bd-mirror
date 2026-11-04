// eslint.config.mjs

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks"; 

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  /* ============================================================
   * TypeScript declaration files
   * ============================================================ */
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  /* ============================================================
   * Admin components — allow raw <img>
   * ============================================================ */
  {
    files: ["src/components/admin/**/*.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },

  /* ============================================================
   * Playwright tests are not React code
   * ============================================================ */
  {
    files: ["tests/**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  /* ============================================================
   * Scripts run with tsx outside Next.js
   * ============================================================ */
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  /* ============================================================
   * React 19 rule tuning
   * ============================================================ */
  {
    plugins: {
      "react-hooks": reactHooks, // <-- ADDED THIS PLUGIN REGISTRATION
    },
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/incompatible-library": "warn",
    },
  },

  /* ============================================================
   * Override default ignores of eslint-config-next.
   * ============================================================ */
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;