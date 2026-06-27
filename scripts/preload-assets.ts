import type { Plugin } from "vite";

const assetRE = /\.(avif|gif|jpe?g|png|webp|webm|mp4|mov|woff2?|otf|ttf)(?:$|\?)/i;
const handledQueryRE = /[?&](url|raw|inline|no-inline|worker|sharedworker)(?=&|=|$)/;

function shouldPreload(source: string) {
  return (
    !source.endsWith("?preload") &&
    assetRE.test(source) &&
    !handledQueryRE.test(source)
  );
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

export default function preloadAssets(): Plugin {
  let isDev = false;

  return {
    name: "preload-assets",

    configResolved(config) {
      isDev = config.command === "serve";
    },

    async resolveId(source, importer) {
      if (!shouldPreload(source)) return null;

      const resolved = await this.resolve(source, importer, { skipSelf: true });
      if (!resolved) return null;

      return `${resolved.id}?preload`;
    },

    load(id) {
      if (!id.endsWith("?preload")) return null;

      const assetId = id.slice(0, -"?preload".length);
      const as = preloadAs(assetId);
      const type = preloadType(assetId);

      return `
import href from ${JSON.stringify(`${assetId}?url`)};

if (typeof document !== "undefined") {
  const exists = Array.from(document.head.querySelectorAll('link[rel="preload"]'))
    .some((link) => link.getAttribute("href") === href);

  if (!exists) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = ${JSON.stringify(as)};
    link.href = href;
    ${type ? `link.type = ${JSON.stringify(type)};` : ""}
    document.head.appendChild(link);
    ${isDev ? `console.debug("[preload-assets]", href);` : ""}
  }
}

export default href;
`;
    },
  };
}
