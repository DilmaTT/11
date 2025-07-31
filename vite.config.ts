import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Add aliases for Tauri and Capacitor modules to a mock file for web mode
      "@tauri-apps/api/dialog": path.resolve(__dirname, "./src/lib/empty-module.ts"),
      "@tauri-apps/api/fs": path.resolve(__dirname, "./src/lib/empty-module.ts"),
      "@capacitor/filesystem": path.resolve(__dirname, "./src/lib/empty-module.ts"),
    },
  },
}));
