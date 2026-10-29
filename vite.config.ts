import { defineConfig } from "vitest/config";
import type { ViteDevServer } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sweaterVest from "./suede.sweater-vest/vite-plugin/plugin.ts";

// The vests page answers at /vests/<component>/<snippet>, where the report and
// the editor extension look for it (Vite would fall back to index.html).
const vestsRoute = {
  name: "vests-route",
  configureServer(server: ViteDevServer) {
    server.middlewares.use((req, _res, next) => {
      if (req.url?.startsWith("/vests/")) req.url = "/vests.html";
      next();
    });
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), sweaterVest(), vestsRoute],
  server: {
    port: 5173,
    host: "0.0.0.0",
  },
  test: {
    // dockview observes its container's size; jsdom has no ResizeObserver
    projects: [sweaterVest.project({ test: { setupFiles: ["./src/tests/setup.ts"] } })],
  },
});
