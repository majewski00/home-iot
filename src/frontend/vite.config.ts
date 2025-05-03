import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import tsconfigPaths from "vite-tsconfig-paths";

const projectRootPath = path.resolve(__dirname, "./../../");
const frontendRootPath = __dirname;

export default defineConfig({
  plugins: [react(), tsconfigPaths({ root: projectRootPath })],
  root: frontendRootPath,
  server: {
    port: 4000,
    https: {
      key: fs.readFileSync(
        path.resolve(__dirname, "./.ssl-certs/localhost-key.pem")
      ),
      cert: fs.readFileSync(
        path.resolve(__dirname, "./.ssl-certs/localhost.pem")
      ),
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
