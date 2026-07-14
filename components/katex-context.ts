import { renderToString } from "katex";

/** Class on the <Katex> wrapper; an <Annotation at="…"> locates its host by it. */
export const katexEmbedClass = "katex-embed";

/** Render a single expression to KaTeX HTML. */
export function renderTex(expr: string, display = false) {
  return renderToString(expr, { displayMode: display, throwOnError: false });
}

/** Render prose, substituting `$…$` spans with inline KaTeX. */
export function renderInline(text: string) {
  return text.replace(/\$([^$]+)\$/g, (_, expr: string) => renderTex(expr));
}
