import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://backend:8000", // Promenjeno za Docker
        changeOrigin: true,
      },
      "/media": {
        target: "http://backend:8000", // Promenjeno za Docker
        changeOrigin: true,
      },
      "/admin": {
        target: "http://backend:8000", // Promenjeno za Docker
        changeOrigin: true,
      },
    },
  },
});
