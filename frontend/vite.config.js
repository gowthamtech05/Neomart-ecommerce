import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
    // FIX: Generates legacy JS bundle for iOS Safari 11+ and older mobile browsers
    legacy({
      targets: ["ios >= 11", "safari >= 11", "chrome >= 64"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    }),
  ],
  build: {
    target: ["es2015", "safari11"],
    modulePreload: false,
  },
});
