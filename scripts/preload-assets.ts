import type { Plugin } from "vite";
import { JSDOM } from "jsdom";

const assetRE = /\.(avif|gif|jpe?g|png|webp|webm|mp4|mov|woff2?|otf|ttf)$/i;

export interface PreloadAssetsOptions {
  /**
   * Public base URL the deck is served from (e.g. `/my-repo/` on GitHub Pages).
   * Preload `href`s are formed as `base` + emitted file name. Defaults to Vite's
   * resolved `base`, so it normally needs no setting; pass it to override.
   */
  base?: string;
}

function preloadAs(id: string) {
  if (/\.(webm|mp4|mov)$/i.test(id)) return "video";
  if (/\.(avif|gif|jpe?g|png|webp)$/i.test(id)) return "image";
  if (/\.(woff2?|otf|ttf)$/i.test(id)) return "font";
  return "fetch";
}

function preloadType(id: string) {
  if (/\.webm$/i.test(id)) return "video/webm";
  if (/\.mp4$/i.test(id)) return "video/mp4";
  if (/\.webp$/i.test(id)) return "image/webp";
  if (/\.png$/i.test(id)) return "image/png";
  if (/\.jpe?g$/i.test(id)) return "image/jpeg";
  if (/\.woff2$/i.test(id)) return "font/woff2";
  if (/\.woff$/i.test(id)) return "font/woff";
  return "";
}

/**
 * Build-only plugin: injects `<link rel="preload">` tags for every preloadable
 * asset the deck imports from JavaScript. Rather than intercept individual
 * imports, it scans the finished bundle in `transformIndexHtml` (where
 * `ctx.bundle` is available): any emitted asset whose hashed file name appears
 * in a JS chunk was URL-imported from code and is worth preloading, while assets
 * referenced only from CSS (e.g. KaTeX fonts) are left to the stylesheet. The
 * tags are added to the emitted HTML with jsdom. Inactive in dev — there is no
 * bundle, and assets are served on demand.
 */
export default function preloadAssets(options: PreloadAssetsOptions = {}): Plugin {
  let base = "/";

  const toHref = (fileName: string) =>
    base.replace(/\/$/, "") + "/" + fileName.replace(/^\//, "");

  return {
    name: "preload-assets",
    apply: "build",

    configResolved(config) {
      // Honor an explicit override, otherwise follow Vite's resolved base (set
      // by `--base` for subpath deploys such as GitHub Pages).
      base = options.base ?? config.base ?? "/";
    },

    // `ctx.bundle` is only populated during builds, so this is inherently a
    // no-op in dev.
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return;

        // Concatenate every JS chunk so we can tell which emitted assets are
        // actually referenced from code.
        let chunkCode = "";
        for (const output of Object.values(bundle)) {
          if (output.type === "chunk") chunkCode += output.code;
        }

        const hrefs = new Set<string>();
        for (const output of Object.values(bundle)) {
          if (output.type !== "asset") continue;
          const fileName = output.fileName;
          if (!assetRE.test(fileName)) continue;
          // Keep only assets URL-imported from JS; CSS-referenced ones (fonts)
          // are handled by the stylesheet and need no preload.
          if (!chunkCode.includes(fileName)) continue;
          hrefs.add(toHref(fileName));
        }

        if (hrefs.size === 0) return;

        const dom = new JSDOM(html);
        const { document } = dom.window;
        for (const href of [...hrefs].sort()) {
          const link = document.createElement("link");
          link.setAttribute("rel", "preload");
          link.setAttribute("as", preloadAs(href));
          link.setAttribute("href", href);
          const type = preloadType(href);
          if (type) link.setAttribute("type", type);
          document.head.appendChild(link);
        }

        return dom.serialize();
      },
    },
  };
}
