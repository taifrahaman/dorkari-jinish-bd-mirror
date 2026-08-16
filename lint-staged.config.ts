const config = {
  "**/*.ts?(x)": () => "pnpm type-check",
  "*.{js,jsx,ts,tsx}": ["pnpm lint", "prettier --write"],
  "*.{json,css,md}": ["prettier --write"],
};

export default config;
