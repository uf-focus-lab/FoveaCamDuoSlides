import { ref, watchEffect, type Ref } from "vue";
import { katexEmbedClass } from "./katex-context";

export type SnapSide = "T" | "B" | "L" | "R" | "";
export type SnapPoint = { left: string; top: string };

export type SnapOptions = {
  /** textContent of the leaf KaTeX <span> to snap to. */
  at?: string;
  /** Which occurrence when the glyph repeats (default 0). */
  nth?: number;
  /** Which bbox edge to anchor on; center when omitted. */
  side?: SnapSide;
  /** Extra gap (local px) pushing the point away from that edge. */
  spacing?: number;
};

/**
 * Snap onto a KaTeX glyph. `anchor` is a locator element rendered in place
 * inside a <Katex>; from it we find the host embed and the nth leaf span whose
 * textContent equals `at`, and expose:
 *   - `target`: the host embed (made a positioning context) to teleport into,
 *   - `point`:  CSS left/top of the glyph's edge, in the host's local px.
 *
 * Rects from getBoundingClientRect are in screen px, scaled by ancestor
 * transforms (e.g. Slidev zooms the slide canvas to fit the window), while a
 * child's CSS left/top resolve in the host's local px — so the deltas are
 * divided back by the host's effective scale (rect size / offset size).
 * Local coordinates are also stable across window resizes: only a KaTeX
 * reflow (tracked via ResizeObserver) moves the point.
 */
export function useKatexSnap(
  anchor: Ref<Element | null>,
  opts: () => SnapOptions,
) {
  const target = ref<HTMLElement | null>(null);
  const point = ref<SnapPoint | null>(null);

  watchEffect(
    (onCleanup) => {
      const { at, nth = 0, side = "", spacing = 0 } = opts();
      target.value = null;
      point.value = null;
      const host = at
        ? anchor.value?.closest<HTMLElement>(`.${katexEmbedClass}`)
        : null;
      if (!host) return;

      // Search only the rendered TeX, not slotted content (e.g. HTML labels of
      // other annotations living in the same embed).
      const scope = host.querySelector(".katex-embed-body") ?? host;
      let glyph: HTMLElement | undefined;
      let i = 0;
      for (const span of scope.querySelectorAll<HTMLElement>("span")) {
        if (span.childElementCount === 0 && span.textContent === at) {
          if (i++ === nth) {
            glyph = span;
            break;
          }
        }
      }
      if (!glyph) return;

      // The host must be a positioning context; keep an already-positioned one.
      if (getComputedStyle(host).position === "static") {
        host.style.position = "relative";
      }
      target.value = host;

      const measure = () => {
        const hr = host.getBoundingClientRect();
        const gr = glyph!.getBoundingClientRect();
        const sx = hr.width / host.offsetWidth || 1;
        const sy = hr.height / host.offsetHeight || 1;
        let x = (gr.left - hr.left + gr.width / 2) / sx;
        let y = (gr.top - hr.top + gr.height / 2) / sy;
        if (side === "T") y = (gr.top - hr.top) / sy - spacing;
        else if (side === "B") y = (gr.bottom - hr.top) / sy + spacing;
        else if (side === "L") x = (gr.left - hr.left) / sx - spacing;
        else if (side === "R") x = (gr.right - hr.left) / sx + spacing;
        point.value = { left: `${x.toFixed(2)}px`, top: `${y.toFixed(2)}px` };
      };
      measure();

      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(measure);
        ro.observe(host);
        onCleanup(() => ro.disconnect());
      }
    },
    { flush: "post" },
  );

  return { target, point };
}
