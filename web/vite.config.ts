import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// @shared points at the Edge Functions' pure-TS engine + synthetic generator, so the
// dashboard's demo mode runs exactly the same detection code as the backend.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../supabase/functions/_shared"),
    },
  },
  server: { fs: { allow: [".."] } },
});
