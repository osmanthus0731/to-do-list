// Tell the unit test runner where tests live, how to imitate a browser and which code to
// measure for coverage.
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    testTimeout: 20000,
    maxWorkers: 1,
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: { include: ["src/lib/**"], reporter: ["text", "html"] },
  },
});
