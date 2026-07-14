import type { Alias, Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { parse } from "node-html-parser";
import { compileStyle } from "@vue/compiler-sfc";

/**
 * Integrates the `crypsis-simulation/` submodule (a standalone Vite/Vue app) into
 * the deck's Vite graph so its source can be imported directly instead of loaded
 * as a pre-built iframe subsite. The submodule's own `vite.config.ts` is not read
 * here; we reproduce the three pieces its source relies on:
 *
 *  1. `import ICON from "icons"` → a virtual module compiled from the
 *     `vscode-icons` nested submodule (this default export's `icons` plugin).
 *  2. Bare `lib/` and `src/` specifiers, remapped to submodule dirs but only for
 *     importers inside the submodule (the `scopedResolve` pre-plugin). The deck
 *     never uses these, so an importer-scoped `resolveId` is enough.
 *  3. Bare `components/` specifiers. These collide with the deck's own
 *     `components` alias — and Vite's alias plugin runs BEFORE user `pre`
 *     plugins, so a pre-plugin cannot intercept them first. Instead the deck's
 *     `components` alias itself must become importer-aware: see
 *     {@link crypsisComponentsAlias}, which forwards to the submodule's
 *     `components/` when (and only when) the importer lives inside the submodule,
 *     and resolves the deck's own components otherwise.
 *
 * `root` is the absolute submodule path, passed from `vite.config.ts` (whose
 * `__dirname` is reliable) so this module never depends on its own file location
 * — which Vite's config bundling would otherwise rewrite.
 */
export default function crypsisSimulation(root: string): Plugin[] {
  return [scopedResolve(root, ["lib", "src"]), icons(root)];
}

/**
 * Importer-aware replacement for the deck's `components` alias. Register this in
 * `resolve.alias` INSTEAD of a plain `components` → dir string: submodule files
 * get the submodule's `components/`, every other importer gets the deck's.
 */
export function crypsisComponentsAlias(deckComponents: string, root: string): Alias {
  const submoduleComponents = path.join(root, "components");
  return {
    find: "components",
    replacement: deckComponents,
    // `updatedId` is normally `<deckComponents>/<rest>` (the string replacement
    // above has run), but tolerate the raw `components/<rest>` form too. Re-root
    // into the submodule's components/ when the importer is a submodule file;
    // otherwise resolve against the deck's own components/.
    async customResolver(updatedId, importer, options) {
      const rest = updatedId.startsWith(deckComponents)
        ? updatedId.slice(deckComponents.length)
        : updatedId.replace(/^components/, "");
      const base = insideSubmodule(root, importer) ? submoduleComponents : deckComponents;
      const full = base + rest;
      return probeFile(full) ?? this.resolve(full, importer, { skipSelf: true, ...options });
    },
  };
}

const FILE_EXTS = ["", ".ts", ".vue", ".js", ".mjs", ".json"];
const INDEX_FILES = ["index.ts", "index.vue", "index.js"];

function scopedResolve(root: string, dirs: string[]): Plugin {
  return {
    name: "crypsis-scoped-resolve",
    enforce: "pre",
    resolveId(source, importer) {
      if (!insideSubmodule(root, importer)) return null;
      const segment = source.split("/")[0];
      if (!dirs.includes(segment)) return null;
      return probeFile(path.join(root, source));
    },
  };
}

// True when `importer` (absolute or project-root-relative, possibly carrying a
// `?query`) is a file inside the submodule at `root`.
function insideSubmodule(root: string, importer: string | undefined) {
  if (!importer) return false;
  const rootPrefix = root.endsWith(path.sep) ? root : root + path.sep;
  const cleaned = importer.split("?")[0];
  const abs = path.isAbsolute(cleaned) ? cleaned : path.resolve(cleaned);
  return abs.startsWith(rootPrefix);
}

// Resolve a base path to a concrete file, applying the submodule's extension and
// directory-index conventions. Returns null if nothing matches.
function probeFile(base: string): string | null {
  for (const ext of FILE_EXTS) {
    const file = base + ext;
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  for (const index of INDEX_FILES) {
    const file = path.join(base, index);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

function icons(root: string, identifier = "icons"): Plugin {
  const iconsDir = path.join(root, "vscode-icons", "icons");
  const virtualId = "\0" + identifier;
  let source = "";

  const build = () => {
    const map = new Map<string, string>();
    for (const theme of ["dark", "light"]) {
      const themeDir = path.join(iconsDir, theme);
      if (!fs.existsSync(themeDir)) continue;
      for (const entry of fs.readdirSync(themeDir, { withFileTypes: true })) {
        if (!entry.isFile() || path.extname(entry.name) !== ".svg") continue;
        const name = exportName(path.basename(entry.name, ".svg"));
        if (!map.has(name)) map.set(name, path.join(themeDir, entry.name));
      }
    }
    const keys = [...map.keys()];
    source = [
      'import { defineComponent, h } from "vue";',
      ...keys.map((key) => compileIcon(key, map.get(key)!)),
      `export default { ${keys.join(", ")} };`,
    ].join("\n\n");
  };

  return {
    name: "crypsis-icons",
    enforce: "pre",
    buildStart() {
      if (!source) build();
    },
    resolveId(id) {
      if (id === identifier) return virtualId;
    },
    load(id) {
      if (id !== virtualId) return;
      if (!source) build();
      return source;
    },
  };
}

function exportName(stem: string) {
  return stem
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

// Compile one vscode-icons SVG into a `defineComponent` export. Fills are forced
// to `currentColor` so icons inherit the surrounding text color, and any inline
// <style> is scoped, mirroring the submodule's own icon-loader.
function compileIcon(key: string, file: string) {
  const doc = parse(fs.readFileSync(file, "utf-8"));
  const svgEl = doc.querySelector("svg");
  if (!svgEl) return `export const ${key} = null; // no <svg> in ${key}`;

  for (const el of doc.querySelectorAll(":not(clipPath) [fill]")) {
    el.setAttribute("fill", "currentColor");
  }

  const scope = createHash("md5").update(`icons:${key}`).digest("hex").slice(0, 8);
  const scopeAttr = `data-v-${scope}`;

  let html = svgEl.innerHTML;
  let scoped = false;
  html = html.replace(
    /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_, open: string, css: string, close: string) => {
      scoped = true;
      const result = compileStyle({ source: css, id: scopeAttr, scoped: true, filename: key });
      return `${open}${result.code}${close}`;
    },
  );
  if (scoped) {
    svgEl.setAttribute(scopeAttr, "");
    svgEl.querySelectorAll("*").forEach((el) => el.setAttribute(scopeAttr, ""));
  }

  const meta = JSON.stringify({ attrs: svgEl.attributes, innerHTML: html });
  return [
    `const __${key}__ = ${meta};`,
    `export const ${key} = defineComponent({`,
    `  props: { tagName: { type: String, default: "svg" } },`,
    `  setup(props, { attrs }) {`,
    `    const { attrs: ownAttrs, innerHTML } = __${key}__;`,
    `    return () => h(props.tagName, { ...ownAttrs, ...attrs, innerHTML });`,
    `  }`,
    `});`,
  ].join("\n");
}
