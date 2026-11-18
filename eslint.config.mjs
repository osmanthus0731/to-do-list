// ESLint checks for likely coding mistakes. Generated reports and build files are excluded
// from source checks.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);
