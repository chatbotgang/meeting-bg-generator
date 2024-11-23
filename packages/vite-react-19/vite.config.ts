import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    /**
     * Base64 not works for tldraw icons, so we need to disable it.
     */
    assetsInlineLimit: 0,
  },
  plugins: [
    tsconfigPaths({
      projects: ["./src/tsconfig.json"],
    }),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
});
