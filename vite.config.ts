import { defineConfig } from "vite";
import path from "node:path";
import svgLoader from "@zhangyx1998/svg-loader";
import preloadAssets from "./scripts/preload-assets";
import crypsisSimulation, {
  crypsisComponentsAlias,
} from "./scripts/crypsis-simulation";

// Slidev reads and merges this config. We register the SVG-as-Vue-component
// loader and alias `assets` → ./assets so figures import as
// `import Foo from "assets/foo.svg"` (and resolve their relative raster refs).
// `crypsisSimulation` lets the `crypsis-simulation/` submodule be imported
// directly: `lib/`/`src/` + its `icons` module via plugins, and `components/`
// via the importer-aware alias below (Vite's alias plugin runs before user
// `pre` plugins, so submodule `components/` forwarding has to live in the alias).
export default defineConfig(() => {
  const root = __dirname;
  const crypsisRoot = path.resolve(root, "crypsis-simulation");
  const deckComponents = path.resolve(root, "components");

  return {
    plugins: [svgLoader(), preloadAssets(), ...crypsisSimulation(crypsisRoot)],
    resolve: {
      alias: [
        { find: "pages", replacement: path.resolve(root, "pages") },
        { find: "assets", replacement: path.resolve(root, "assets") },
        { find: "stores", replacement: path.resolve(root, "stores") },
        crypsisComponentsAlias(deckComponents, crypsisRoot),
      ],
    },
  };
});
