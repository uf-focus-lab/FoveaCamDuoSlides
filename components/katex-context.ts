import type { InjectionKey, Ref } from "vue";
import { renderToString } from "katex";

/**
 * Shared context an <Katex> equation exposes so descendant <Annotation>s can
 * teleport themselves onto a rendered glyph by its text (e.g. `at="b"`).
 */
export type KatexContext = {
  /** Bumped once the KaTeX DOM is in place; a dependency for glyph lookups. */
  ready: Ref<number>;
  /** Nearest leaf <span> whose textContent equals `text` (the nth match). */
  resolve: (text: string, nth?: number) => HTMLElement | null;
};

export const KatexKey: InjectionKey<KatexContext> = Symbol("katex");

/** Render a single expression to KaTeX HTML. */
export function renderTex(expr: string, display = false) {
  return renderToString(expr, { displayMode: display, throwOnError: false });
}

/** Render prose, substituting `$…$` spans with inline KaTeX. */
export function renderInline(text: string) {
  return text.replace(/\$([^$]+)\$/g, (_, expr: string) => renderTex(expr));
}
