// commitlint.config.ts
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation
        "style", // Formatting
        "refactor", // Code refactoring
        "perf", // Performance
        "test", // Tests
        "build", // Build system
        "ci", // CI/CD
        "chore", // Other changes
        "revert", // Revert changes
      ],
    ],
  },
};

export default config;
