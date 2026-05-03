import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // setupFiles 는 프로젝트 루트 기준으로 해석됨
    setupFiles: [path.resolve(__dirname, "./vitest.setup.ts")],
  },
  resolve: {
    alias: {
      // config/ → 한 단계 위가 프로젝트 루트
      "@": path.resolve(__dirname, "../src"),
    },
  },
});
