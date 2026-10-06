// eslint.config.mjs

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  /* ============================================================
   * TypeScript declaration files
   *
   * .d.ts files may contain imports required for module
   * augmentation/type resolution that look "unused" to the
   * rule but are semantically needed.
   * ============================================================ */
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  /* ============================================================
   * Admin components — allow raw <img>
   *
   * Cloudinary already serves optimized images via f_auto,q_auto.
   * Next.js's <Image> wrapper adds overhead without benefit here.
   * The admin is a low-traffic, authenticated surface — raw <img>
   * is the right choice.
   * ============================================================ */
  {
    files: ["src/components/admin/**/*.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },

  /* ============================================================
   * React 19 rule tuning
   *
   * `set-state-in-effect` flags every setState inside useEffect.
   * That's too aggressive for the legitimate patterns we use:
   *   - Loading persisted state from localStorage on mount
   *   - Syncing external props into local form state
   *   - Auto-running an effect once when data becomes available
   *   - Closing a drawer on route change
   * Downgrade to warn so we still see them, but they don't fail CI.
   *
   * `incompatible-library` fires on React Hook Form's `watch()`.
   * It's informational — the compiler can't memoize RHF, which is
   * expected. Downgrade to warn.
   * ============================================================ */
  {
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