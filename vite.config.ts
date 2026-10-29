import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sweaterVest from "./suede.sweater-vest/vite-plugin/plugin.ts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), sweaterVest()],
  server: {
    port: 5173,
    host: "0.0.0.0",
  },
  test: {
    projects: [sweaterVest.project()],
  },
});
