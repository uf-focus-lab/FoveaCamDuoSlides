import { defineConfig } from "vite";
import path from "node:path";
import svgLoader from "@zhangyx1998/svg-loader";

// Slidev reads and merges this config. We register the SVG-as-Vue-component
// loader and alias `assets` → ./assets so figures import as
// `import Foo from "assets/foo.svg"` (and resolve their relative raster refs).
export default defineConfig({
  plugins: [svgLoader()],
  resolve: {
    alias: {
      pages: path.resolve(__dirname, "pages"),
      assets: path.resolve(__dirname, "assets"),
      components: path.resolve(__dirname, "components"),
    },
  },
});
