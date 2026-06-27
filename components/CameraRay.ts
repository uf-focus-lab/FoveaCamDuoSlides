import { defineComponent, h, useId } from "vue";

type CameraRayProps = {
  /** Field of view, in degrees. */
  fov: number;
  /** Pixel count: a positive integer N. One triangle is projected per pixel. */
  resolution?: number;
  /**
   * Size of the rendered ray pool, ≥ `resolution`. The pool is a fixed set of
   * paths so the element count stays constant as `resolution` changes: the
   * active fan is centered in the pool and the leftover pixels are "parked"
   * collapsed on the two fov edges (hidden). Raising the resolution then
   * slides/fades the parked rays in from both sides symmetrically; lowering it
   * sends them back out. Defaults to `resolution` (no parked rays).
   */
  maxResolution?: number;
  /** How far the rays reach from the optical center, in pixels. */
  height?: number;
  /**
   * Focal length in pixels. When set (> 0), each ray also projects *backward*
   * through the optical center onto a sensor plane at y = +f (the "pinhole
   * backend"): a mirror-image wedge whose base edge is the sensor pixel. The
   * pixel the highlighted ray lands on renders emphasized.
   */
  f?: number;
  /** Base color of the gradient infill. */
  infill?: string;
  /**
   * Whether the per-pixel boundary lines are drawn. Defaults to `true`; toggling
   * it animates the edges in/out with a line-draw that grows from the sensor end
   * (the bottom), without touching the resolution or wedges.
   */
  boundary?: boolean;
  /**
   * Cursor in this component's local frame, highlighting its ray.
   * `undefined` → non-interactive (every ray renders focused); `null` →
   * interactive but not hovering; `{x, y}` → hovering.
   */
  cursor?: { x: number; y: number } | null;
  /**
   * While a structural change (fov / resolution / f) is mid-transition, ease the
   * highlight-driven styling too and suppress hover selection until it settles.
   */
  animating?: boolean;
};

const DEG = Math.PI / 180;
const round = (x: number) => Math.round(x * 1000) / 1000;

// Shared transition timing (see styles/animation.css) so the rays stay in sync
// with the moving point and the dimension lines.
const TR = "var(--transition-duration) var(--transition-curve)";

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
 * With `f` set, the same rays continue through the optical center onto the
 * sensor plane at y = +f: each forward wedge has a mirror-image backend wedge
 * whose base edge is the sensor pixel. The pixel hit by the highlighted ray is
 * drawn emphasized (a bold bar in the current color); the rest stay faint.
 *
 * The render pool is `maxResolution` paths (≥ N), with the active fan centered.
 * The leftover pixels are parked on the two fov edges with zero opacity, so
 * every part — wedges, boundary lines, backend wedges, sensor pixels — animates
 * its `d`/opacity when `resolution` (or `fov`/`f`) changes, pushing in / pulling
 * out from both sides instead of paths popping in and out.
 *
 * Fallthrough attrs override the defaults: `fill` replaces the wedge fill,
 * `stroke` / `stroke-*` style the boundary lines, anything else lands on <g>.
 */
const CameraRay = defineComponent({
  name: "CameraRay",
  // Distribute fill/stroke overrides manually rather than onto the root <g>.
  inheritAttrs: false,
  props: {
    fov: { type: Number, required: true },
    resolution: { type: Number, default: 1 },
    maxResolution: { type: Number, required: false },
    height: { type: Number, default: 2000 },
    f: { type: Number, default: 0 },
    infill: { type: String, default: "currentColor" },
    boundary: { type: Boolean, default: true },
    animating: { type: Boolean, default: false },
    // No `type` so `null` (interactive idle) doesn't trip prop validation.
    cursor: { required: false },
  },
  // `useId()` is read once here (in setup) so the gradient id is stable across
  // re-renders. (As a functional component it ran every render against the
  // parent instance, producing a new id each frame — which made the gradient
  // refs churn and the fan flicker while the target point moved.)
  setup(props: CameraRayProps, { attrs }) {
    const gradientId = `camera-ray-${useId()}`;
    const activeId = `${gradientId}-active`;

    return () => {
      const {
        fov,
        resolution = 1,
        maxResolution,
        height = 2000,
        f = 0,
        infill = "currentColor",
        boundary = true,
        animating = false,
        cursor,
      } = props;
      const n = Math.max(1, Math.floor(resolution));
      // Fixed render pool so the path count never changes across resolutions.
      const pool = Math.max(n, Math.floor(maxResolution ?? n));

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
      // ±height·tan(fov/2) at y = -height. The active fan is centered in the pool:
      // its N+1 edges occupy pool indices [offset, offset+N] at fractions 0..1, and
      // the leftover edges park symmetrically on the two fov edges (frac 0 on the
      // left, frac 1 on the right). Changing resolution then pushes rays in / pulls
      // them out from both sides at once. `local = i - offset` is the index within
      // the active fan (0..N-1 for wedges, 0..N for edges).
      const offset = Math.floor((pool - n) / 2);
      const halfWidth = height * Math.tan((fov / 2) * DEG);
      const frac = (j: number) => {
        if (j < offset) return 0;
        if (j > offset + n) return 1;
        return (j - offset) / n;
      };
      const edgeX = (j: number) => round(halfWidth * (2 * frac(j) - 1));

      // Backend sensor plane at y = +f. A ray hitting the image plane at +edgeX
      // hits the sensor at the mirror point -edgeX·(f/height), i.e. the sensor
      // spans ∓f·tan(fov/2). Only drawn when a focal length is given.
      const focal = f > 0 ? f : 0;
      const sensorHalf = focal * Math.tan((fov / 2) * DEG);
      const sensorX = (j: number) => round(-sensorHalf * (2 * frac(j) - 1));

      // While animating, suppress hover selection as if the cursor were null: the
      // component stays interactive, but nothing is highlighted until it settles.
      const activeCursor = animating ? null : cursor;
      const interactive = activeCursor !== undefined;

      // Which wedge holds the cursor (projected onto the y = -height plane), if any.
      // While a structural animation is in progress the geometry is mid-flight, so
      // ignore the cursor (no highlight) until it settles.
      const hovered = (() => {
        if (!activeCursor || activeCursor.y >= 0 || halfWidth <= 0) return undefined;
        const xPlane = (-height * activeCursor.x) / activeCursor.y;
        if (xPlane < -halfWidth || xPlane > halfWidth) return undefined;
        const i = Math.floor(((xPlane / halfWidth + 1) / 2) * n);
        return Math.min(Math.max(i, 0), n - 1);
      })();

      // `local` is the index within the active fan (0..N-1).
      const lit = (local: number) => !interactive || local === hovered;

      // `d` (geometry) and the structural fade / line-draw of parked or revealed
      // edges always transition, so a change of fov / resolution / f animates the
      // fan. The highlight-driven extras (a lit wedge's stronger infill, the lit
      // pixel's weight/opacity) are only eased while a structural change runs
      // (`animating`); on a plain cursor move they snap, so a target entering a cell
      // restyles every cell at once (no colour/opacity fade or trail).
      const hi = (spec: string) => (animating ? `, ${spec}` : "");

      const triangles = Array.from({ length: pool }, (_, i) => {
        const local = i - offset;
        const active = local >= 0 && local < n;
        const d = `M0,0 L${edgeX(i)},${-height} L${edgeX(i + 1)},${-height} Z`;
        return h("path", {
          d,
          // Overlapping ray coverage blends additively (plus-lighter on dark,
          // plus-darker on light — see `--blend`).
          style: {
            d: `path('${d}')`,
            mixBlendMode: "var(--blend)",
            opacity: active ? 1 : 0,
            // During a resolution change, keep opacity as a hard state switch so the
            // wedges don't cross-fade over one another while their geometry is
            // still reflowing.
            transition: `d ${TR}`,
          },
          fill: wedgeFill ?? `url(#${active && lit(local) ? activeId : gradientId})`,
        });
      });

      // Backend wedges: mirror of each forward triangle through the optical center,
      // landing on the sensor plane. Flat faint fill (the hovered one stronger) so
      // they read as the "inside the camera" cone without competing with the scene
      // wedges' gradients.
      const backendWedges = focal
        ? Array.from({ length: pool }, (_, i) => {
            const local = i - offset;
            const active = local >= 0 && local < n;
            const d = `M0,0 L${sensorX(i)},${focal} L${sensorX(i + 1)},${focal} Z`;
            return h("path", {
              d,
              fill: infill,
              "fill-opacity": active ? (lit(local) ? 0.22 : 0.07) : 0,
              style: {
                d: `path('${d}')`,
                transition: `d ${TR}`,
              },
            });
          })
        : [];

      // The sensor plane itself: a faint full-width baseline beneath the pixels.
      // Endpoints sit at the fov edges (frac 0 and 1) regardless of resolution.
      const sensorPlane = focal
        ? [
            h("path", {
              d: `M${sensorX(0)},${focal} L${sensorX(pool)},${focal}`,
              fill: "none",
              "stroke-linecap": "round",
              style: {
                d: `path('M${sensorX(0)},${focal} L${sensorX(pool)},${focal}')`,
                stroke: lineStroke,
                "stroke-width": 2,
                opacity: 0.3,
                transition: `d ${TR}`,
              },
            }),
          ]
        : [];

      // Sensor pixels: the base edge of each backend wedge. The lit pixel pops out
      // as a chunky, square-ended block in the current (camera) color, sitting
      // proud of the sensor; the rest stay thin and faint. Butt caps (not round)
      // keep the lit block crisp and exactly one pixel wide.
      const sensorPixels = focal
        ? Array.from({ length: pool }, (_, i) => {
            const local = i - offset;
            const active = local >= 0 && local < n;
            const on = active && lit(local);
            const d = `M${sensorX(i)},${focal} L${sensorX(i + 1)},${focal}`;
            return h("path", {
              d,
              fill: "none",
              "stroke-linecap": "butt",
              style: {
                d: `path('${d}')`,
                stroke: on ? "currentColor" : lineStroke,
                "stroke-width": on ? 9 : 3,
                opacity: active ? (on ? 1 : 0.4) : 0,
                // A drop shadow lifts the lit block off the sensor plane.
                filter: on ? "drop-shadow(0 0 6px color-mix(in srgb, currentColor 60%, transparent))" : "none",
                transition: `d ${TR}${hi(`stroke-width ${TR}, opacity ${TR}`)}`,
              },
            });
          })
        : [];

      // Boundary line for every pixel edge (pool + 1, including the two outer
      // edges). The two edges bordering the hovered wedge light up; the rest stay
      // faint; parked edges (> N) fade out. Position eases with `fov`/`resolution`.
      // When the sensor is shown, each edge continues straight through the optical
      // center onto the back side, reaching the sensor pixel boundary.
      // A forwarded `stroke-dasharray` (e.g. the wide camera's dashed cone) opts out
      // of the line-draw reveal so its dash pattern isn't clobbered.
      const customDash = "stroke-dasharray" in strokeRest;

      const lines = Array.from({ length: pool + 1 }, (_, j) => {
        const local = j - offset;
        const active = local >= 0 && local <= n;
        const d = focal
          ? `M${sensorX(j)},${focal} L0,0 L${edgeX(j)},${-height}`
          : `M0,0 L${edgeX(j)},${-height}`;
        const focused =
          !interactive ||
          (hovered !== undefined && (local === hovered || local === hovered + 1));
        return h("path", {
          d,
          fill: "none",
          "stroke-width": 2,
          // `pathLength` normalizes the line-draw dash to the whole path.
          pathLength: customDash ? undefined : 1,
          ...strokeRest,
          style: {
            d: `path('${d}')`,
            stroke: lineStroke,
            opacity: active ? (focused ? 1 : 0.25) : 0,
            // Reveal by drawing each edge in from the sensor end (the path's start),
            // not by fading; `boundary` toggles the dash offset in/out.
            strokeDasharray: customDash ? undefined : 1,
            strokeDashoffset: customDash ? undefined : boundary ? 0 : 1,
            transition: `d ${TR}${
              customDash ? "" : `, stroke-dashoffset ${TR}`
            }${hi(`opacity ${TR}`)}`,
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
        ...backendWedges,
        ...sensorPlane,
        ...lines,
        ...sensorPixels,
      ]);
    };
  },
});

export default CameraRay;
