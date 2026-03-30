import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: [
      "src/lib/**/*.test.ts",
      "src/lib/**/__tests__/**/*.test.ts",
    ],
    // Integration tests hit the real DB — load .env.test vars
    env: (() => {
      const fs = require("fs")
      const envPath = path.resolve(__dirname, ".env.test")
      if (!fs.existsSync(envPath)) return {}
      return Object.fromEntries(
        fs.readFileSync(envPath, "utf-8")
          .split("\n")
          .filter((l: string) => l && !l.startsWith("#") && l.includes("="))
          .map((l: string) => l.split("=").map((s: string) => s.trim()))
          .filter(([k]: [string]) => k)
          .map(([k, ...v]: [string, ...string[]]) => [k, v.join("=")])
      )
    })(),
  },
})
