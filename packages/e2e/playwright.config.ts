import { defineConfig } from "@playwright/test";
import path from "path";

const exampleAppDir = path.resolve(__dirname, "../../examples/hellostackwrightnext");

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: {
    command: `pnpm --filter stackwright-example-app exec stackwright-prebuild && pnpm --filter stackwright-example-app exec next build && pnpm --filter stackwright-example-app exec next start`,
    cwd: path.resolve(__dirname, "../.."),
    port: 3000,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
