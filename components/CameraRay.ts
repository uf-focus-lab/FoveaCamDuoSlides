import { h, useId, type FunctionalComponent } from "vue";

type CameraRayProps = {
  /** Field of view, in degrees. */
  fov: number;
  /** Pixel count: a positive integer N. One triangle is projected per pixel. */
  resolution?: number;
  /** How far the rays reach from the optical center, in pixels. */
  height?: number;
  /** Base color of the gradient infill. */
  infill?: string;
  /**
   * Cursor in this component's local frame, highlighting its ray.
   * `undefined` → non-interactive (every ray renders focused); `null` →
   * interactive but not hovering; `{x, y}` → hovering.
   */
  cursor?: { x: number; y: number } | null;
};

const DEG = Math.PI / 180;
const round = (x: number) => Math.round(x * 1000) / 1000;

// Default boundary-line color. Set via `style` (not the `stroke` attr) because
// `var()` / `color-mix()` don't resolve in SVG presentation attributes.
const DEFAULT_LINE_STROKE =
  "color-mix(in srgb, currentColor 50%, var(--fc-contrast))";

/**
 * Functional component: fans N triangles out of the optical center at (0, 0),
 * one per pixel. The camera points up (-Y), so the rays reach the image plane
 * y = -height. Following pinhole projection, pixels are evenly spaced across
 * that plane (not by angle), so the slices compress toward the fov edges.
 * Triangles share a vertical gradient: `infill` at 20% opacity at the origin,
 * fading to 0% at full height. Pixel boundary lines are drawn over the wedges;
 * the `cursor` ray gets a stronger gradient and its two boundary lines light up.
 *
 * Fallthrough attrs override the defaults: `fill` replaces the wedge fill,
 * `stroke` / `stroke-*` style the boundary lines, anything else lands on <g>.
 */
const CameraRay: FunctionalComponent<CameraRayProps> = (props, { attrs }) => {
  const { fov, resolution = 1, height = 2000, infill = "currentColor", cursor } = props;
  const n = Math.max(1, Math.floor(resolution));
  const gradientId = `camera-ray-${useId()}`;
  const activeId = `${gradientId}-active`;

  // Split fallthrough attrs by their target element.
  const { fill, ...others } = attrs;
  const strokeRest: Record<string, unknown> = {};
  const groupAttrs: Record<string, unknown> = {};
  let strokeColor: unknown;
  for (const key in others) {
    if (key === "stroke") strokeColor = others[key];
    else if (key.startsWith("stroke-")) strokeRest[key] = others[key];
    else groupAttrs[key] = others[key];
  }
  const wedgeFill = fill as string | undefined;
  const lineStroke = (strokeColor as string | undefined) ?? DEFAULT_LINE_STROKE;

  // Pixel boundaries are evenly spaced along the image plane, which spans
  // ±height·tan(fov/2) at y = -height.
  const halfWidth = height * Math.tan((fov / 2) * DEG);
  const edgeX = (j: number) => round(halfWidth * (2 * (j / n) - 1));

  // Animate via the CSS `d` property so paths ease as `fov`/`resolution` change
  // (all share the same command structure).
  const animated = (d: string) => ({ d: `path('${d}')`, transition: "d .5s ease" });

  // An `undefined` cursor means non-interactive: render every ray focused.
  const interactive = cursor !== undefined;

  // Which wedge holds the cursor (projected onto the y = -height plane), if any.
  const hovered = (() => {
    if (!cursor || cursor.y >= 0 || halfWidth <= 0) return undefined;
    const xPlane = (-height * cursor.x) / cursor.y;
    if (xPlane < -halfWidth || xPlane > halfWidth) return undefined;
    const i = Math.floor(((xPlane / halfWidth + 1) / 2) * n);
    return Math.min(Math.max(i, 0), n - 1);
  })();

  const triangles = Array.from({ length: n }, (_, i) => {
    const d = `M0,0 L${edgeX(i)},${-height} L${edgeX(i + 1)},${-height} Z`;
    return h("path", {
      d,
      // Overlapping ray coverage blends additively (plus-lighter on dark,
      // plus-darker on light — see `--blend`).
      style: { ...animated(d), mixBlendMode: "var(--blend)" },
      fill: wedgeFill ?? `url(#${!interactive || i === hovered ? activeId : gradientId})`,
    });
  });

  // Boundary line for every pixel edge (N + 1, including the two outer edges).
  // The two edges bordering the hovered wedge light up; the rest stay faint.
  // Position eases with `fov`/`resolution`; opacity has its own faster fade.
  const lines = Array.from({ length: n + 1 }, (_, j) => {
    const d = `M0,0 L${edgeX(j)},${-height}`;
    const focused =
      !interactive || (hovered !== undefined && (j === hovered || j === hovered + 1));
    return h("path", {
      d,
      fill: "none",
      "stroke-width": 2,
      ...strokeRest,
      style: {
        d: `path('${d}')`,
        stroke: lineStroke,
        opacity: focused ? 1 : 0.25,
        transition: "d .5s ease, opacity .2s",
      },
    });
  });

  const gradient = (id: string, peak: number, fade: string) =>
    h(
      "linearGradient",
      { id, gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: 0, y2: -height },
      [
        h("stop", { offset: "0%", "stop-color": infill, "stop-opacity": peak }),
        h("stop", { offset: fade, "stop-color": infill, "stop-opacity": 0 }),
      ],
    );

  return h("g", groupAttrs, [
    h("defs", [gradient(gradientId, 0.2, "50%"), gradient(activeId, 0.3, "80%")]),
    ...triangles,
    ...lines,
  ]);
};

CameraRay.props = {
  fov: { type: Number, required: true },
  resolution: { type: Number, default: 1 },
  height: { type: Number, default: 2000 },
  infill: { type: String, default: "currentColor" },
  // No `type` so `null` (interactive idle) doesn't trip prop validation.
  cursor: { required: false },
};
// Distribute fill/stroke overrides manually rather than onto the root <g>.
CameraRay.inheritAttrs = false;

export default CameraRay;
