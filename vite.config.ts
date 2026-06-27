import { defineConfig } from "vite";
import path from "node:path";
import svgLoader from "@zhangyx1998/svg-loader";
import preloadAssets from "./scripts/preload-assets";

// Slidev reads and merges this config. We register the SVG-as-Vue-component
// loader and alias `assets` → ./assets so figures import as
// `import Foo from "assets/foo.svg"` (and resolve their relative raster refs).
export default defineConfig(({ command }) => ({
  plugins: [svgLoader(), preloadAssets()],
  resolve: {
    alias: {
      pages: path.resolve(__dirname, "pages"),
      assets: path.resolve(__dirname, "assets"),
      components: path.resolve(__dirname, "components"),
      stores: path.resolve(__dirname, "stores"),
    },
  },
}));
