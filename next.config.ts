// Settings for Next.js. Limiting build workers keeps memory use manageable on a smaller
// computer.
import type { NextConfig } from "next";
const config: NextConfig = {
  turbopack: { root: process.cwd() },
  experimental: { cpus: 2 },
};
export default config;
