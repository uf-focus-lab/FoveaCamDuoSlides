<script setup lang="ts">
import {
  computed,
  nextTick,
  ref,
  shallowRef,
  useAttrs,
  useId,
  watch,
} from "vue";

enum RayState {
  ENTERING = "entering",
  ACTIVE = "active",
  EXITING = "exiting",
}

type CameraRayProps = {
  /** Field of view, in degrees. */
  fov: number;
  /** Pixel/cone count. The component internally keeps `res + 1` rays. */
  res?: number;
  /** How far the rays reach from the optical center, in pixels. */
  h?: number;
  /** Focal length in pixels; when > 0, also draws the backend sensor geometry. */
  f?: number;
  /** Whether per-pixel boundary lines are drawn. */
  boundary?: boolean;
  /**
   * Cursor in this component's local frame. `undefined` means non-interactive,
   * `null` means interactive idle, `{x, y}` means hovering.
   */
  cursor?: { x: number; y: number } | null;
};

type RayValue = {
  /** Disparity from the center ray at Z=1 in front of the pinhole. */
  d: number;
  s: RayState;
};

type Ray = RayValue & { id: string };

type RaySpan = {
  id: string;
  l: Ray;
  r: Ray;
  s: RayState;
};

type Cone = RaySpan;
type CameraPixel = RaySpan;

type AttrMap = Record<string, unknown>;
type StyleMap = Record<string, string | number | undefined>;

const DEG = Math.PI / 180;
const TR = "var(--transition-duration) var(--transition-curve)";
const DEFAULT_LINE_STROKE =
  "color-mix(in srgb, currentColor 80%, var(--fc-contrast))";
const D = ["d"];
const OPACITY_FILL = ["opacity", "fill"];
const FILL_OPACITY = ["fill-opacity"];
const OPACITY_STROKE_WIDTH = ["opacity", "stroke", "stroke-width"];
const OPACITY_STROKE = ["opacity", "stroke"];

defineOptions({ name: "CameraRay", inheritAttrs: false });

const props = withDefaults(defineProps<CameraRayProps>(), {
  res: 1,
  h: 2000,
  f: 0,
  boundary: true,
});

const attrs = useAttrs();
const uid = useId();
const root = ref<SVGGElement>();
const rays = shallowRef<Ray[]>([]);
const transitionEnabled = ref(true);
const staging = ref(false);
const internalAnimating = ref(false);
const k = ref(1);
let nextRayId = 0;
let rafs: number[] = [];
let cleanupRun = 0;
let currentFov = props.fov;
let currentRes = normalizeRes(props.res);

const splitAttrs = computed(() => {
  const strokeRest: AttrMap = {};
  const groupAttrs: AttrMap = {};
  let fillColor: unknown;
  let strokeColor: unknown;
  let style: unknown;

  for (const key in attrs) {
    if (key === "fill") fillColor = attrs[key];
    else if (key === "stroke") strokeColor = attrs[key];
    else if (key.startsWith("stroke-")) strokeRest[key] = attrs[key];
    else if (key === "style") style = attrs[key];
    else groupAttrs[key] = attrs[key];
  }

  const fill = fillColor as string | undefined;

  return {
    groupAttrs,
    groupStyle: fill ? [style, { color: fill }] : style,
    strokeRest,
    fillColor: fill,
    lineStroke: (strokeColor as string | undefined) ?? DEFAULT_LINE_STROKE,
  };
});
const focal = computed(() => (props.f > 0 ? props.f : 0));
const orderedRays = computed(() => [...rays.value].sort((a, b) => a.d - b.d));
const raySpans = computed<RaySpan[]>(() =>
  orderedRays.value.slice(0, -1).map((ray, i) => {
    const next = orderedRays.value[i + 1];
    return {
      id: `${ray.id}:${next.id}`,
      l: ray,
      r: next,
      s: inheritState(ray, next),
    };
  }),
);
const cones = computed<Cone[]>(() => raySpans.value);
const cameraPixels = computed<CameraPixel[]>(() =>
  focal.value ? raySpans.value : [],
);
const customDash = computed(
  () => "stroke-dasharray" in splitAttrs.value.strokeRest,
);
const edgePathLength = computed(() => (customDash.value ? undefined : 1));
const edgeDasharray = computed(() => (customDash.value ? undefined : 1));
const edgeDashoffset = computed(() =>
  customDash.value ? undefined : props.boundary ? 0 : 1,
);
const activeCursor = computed(() =>
  internalAnimating.value ? props.cursor && null : props.cursor,
);
const interactive = computed(() => activeCursor.value !== undefined);
const hoveredCone = computed(() => {
  const cursor = activeCursor.value;
  if (!cursor || cursor.y >= 0) return undefined;

  const d = -cursor.x / cursor.y;
  const index = cones.value.findIndex(
    (cone) => displayD(cone.l) <= d && d <= displayD(cone.r),
  );
  return index >= 0 ? index : undefined;
});

function normalizeRes(value: number | undefined) {
  return Math.max(1, Math.floor(value ?? 1));
}

function round(x: number) {
  return Math.round(x * 1000) / 1000;
}

function pitch(fov: number, res: number) {
  return (2 * Math.tan((fov / 2) * DEG)) / normalizeRes(res);
}

function rayD(fov: number, res: number, index: number) {
  const half = Math.tan((fov / 2) * DEG);
  return -half + (2 * half * index) / res;
}

function newRayId() {
  return `${uid}-ray-${nextRayId++}`;
}

function rayValue(
  fov: number,
  res: number,
  index: number,
  s = RayState.ACTIVE,
): RayValue {
  return { d: rayD(fov, res, index), s };
}

function newRay(fov: number, res: number, index: number, s = RayState.ACTIVE): Ray {
  return { id: newRayId(), ...rayValue(fov, res, index, s) };
}

function retargetRay(ray: Ray, fov: number, res: number, index: number): Ray {
  return { id: ray.id, ...rayValue(fov, res, index, ray.s) };
}

function exitingRay(ray: Ray): Ray {
  return {
    ...ray,
    d: k.value ? ray.d / k.value : ray.d,
    s: RayState.EXITING,
  };
}

function sorted(next: Ray[]) {
  return [...next].sort((a, b) => a.d - b.d);
}

function splitEdgeCount(count: number) {
  const left = Math.floor(count / 2);
  return { left, right: count - left };
}

function newEdgeRays(
  count: number,
  start: number,
  fov: number,
  res: number,
) {
  return Array.from({ length: count }, (_, i) =>
    newRay(fov, res, start + i, RayState.ENTERING),
  );
}

function inheritState(a: Ray, b: Ray): RayState {
  if (a.s === RayState.EXITING || b.s === RayState.EXITING) {
    return RayState.EXITING;
  }
  if (a.s === RayState.ENTERING || b.s === RayState.ENTERING) {
    return RayState.ENTERING;
  }
  return RayState.ACTIVE;
}

function statusClass(s: RayState) {
  return s === RayState.ACTIVE ? undefined : `is-${s}`;
}

function updateRays(fov: number, res: number): Ray[] {
  const old = orderedRays.value;
  const fromRes = Math.max(1, old.length - 1);
  const delta = res - fromRes;
  const nextPitch = pitch(fov, res);
  k.value = nextPitch ? pitch(currentFov, currentRes) / nextPitch : 1;

  if (delta > 0) {
    const { left, right } = splitEdgeCount(delta);
    const oldStart = left;
    const rightStart = oldStart + old.length;
    return sorted([
      ...newEdgeRays(left, 0, fov, res),
      ...old.map((ray, i) => retargetRay(ray, fov, res, oldStart + i)),
      ...newEdgeRays(right, rightStart, fov, res),
    ]);
  }

  if (delta < 0) {
    const { left, right } = splitEdgeCount(-delta);
    const rightStart = old.length - right;

    return sorted(old.map((ray, index) => {
      if (index < left || index >= rightStart) {
        return exitingRay(ray);
      }
      return retargetRay(ray, fov, res, index - left);
    }));
  }

  return old.map((ray, i) => retargetRay(ray, fov, res, i));
}

function commitRays(next: Ray[], fov: number, res: number) {
  rays.value = next;
  currentFov = fov;
  currentRes = res;
}

function resetRays(fov: number, res: number) {
  commitRays(
    Array.from({ length: res + 1 }, (_, i) => newRay(fov, res, i)),
    fov,
    res,
  );
  k.value = 1;
}

function syncRays(nextFov: number, nextRes: number) {
  commitRays(updateRays(nextFov, nextRes), nextFov, nextRes);
}

function beginStageTransition() {
  cleanupRun += 1;
  transitionEnabled.value = false;
  staging.value = true;
  internalAnimating.value = true;
  cancelAnimationFrames();
}

function stageTransition() {
  void nextTick(() => {
    queueAnimationFrame(() => {
      queueAnimationFrame(() => {
        transitionEnabled.value = true;
        staging.value = false;
        k.value = 1;
        void cleanupWhenSettled();
      });
    });
  });
}

function cleanupRayStates() {
  rays.value = orderedRays.value
    .filter((ray) => ray.s !== RayState.EXITING)
    .map((ray) => ({ ...ray, s: RayState.ACTIVE }));
  internalAnimating.value = false;
}

function finiteAnimations() {
  return (
    root.value?.getAnimations({ subtree: true }).filter((animation) => {
      const timing = animation.effect?.getComputedTiming();
      const duration = Number(timing?.duration ?? 0);
      const delay = Number(timing?.delay ?? 0);
      return (
        Number.isFinite(duration) &&
        duration + delay > 0 &&
        animation.playState !== "idle"
      );
    }) ?? []
  );
}

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function transitionDurationMs() {
  if (!root.value) return 0;

  const value = getComputedStyle(root.value)
    .getPropertyValue("--transition-duration")
    .trim();
  const match = value.match(/^([\d.]+)\s*(ms|s)?$/);
  if (!match) return 0;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return 0;
  return match[2] === "ms" ? amount : amount * 1000;
}

function queueAnimationFrame(callback: FrameRequestCallback) {
  const id = requestAnimationFrame((time) => {
    rafs = rafs.filter((raf) => raf !== id);
    callback(time);
  });
  rafs.push(id);
}

function cancelAnimationFrames() {
  for (const id of rafs) cancelAnimationFrame(id);
  rafs = [];
}

async function cleanupWhenSettled() {
  if (!internalAnimating.value) return;

  const run = ++cleanupRun;
  await nextTick();
  await nextFrame();
  await nextFrame();

  const animations = finiteAnimations();
  if (animations.length) {
    await Promise.allSettled(animations.map((animation) => animation.finished));
  } else {
    await wait(transitionDurationMs());
  }

  if (run === cleanupRun && internalAnimating.value) {
    cleanupRayStates();
  }
}

function displayD(ray: Ray) {
  return ray.d * k.value;
}

function xAt(ray: Ray) {
  return round(props.h * displayD(ray));
}

function sensorAt(ray: Ray) {
  return round(-focal.value * displayD(ray));
}

function rayPath(ray: Ray) {
  return focal.value
    ? `M${sensorAt(ray)},${focal.value} L0,0 L${xAt(ray)},${-props.h}`
    : `M0,0 L${xAt(ray)},${-props.h}`;
}

function conePath(cone: Cone) {
  return `M0,0 L${xAt(cone.l)},${-props.h} L${xAt(cone.r)},${-props.h} Z`;
}

function backendPath(cone: Cone) {
  return `M0,0 L${sensorAt(cone.l)},${focal.value} L${sensorAt(cone.r)},${focal.value} Z`;
}

function sensorPixelPath(cone: Cone) {
  return `M${sensorAt(cone.l)},${focal.value} L${sensorAt(cone.r)},${focal.value}`;
}

function stateOpacity(s: RayState) {
  if (s === RayState.EXITING) return staging.value ? 1 : 0;
  if (s === RayState.ENTERING && staging.value) return 0;
  return 1;
}

function rayFill(active: boolean) {
  const base = splitAttrs.value.fillColor ?? "currentColor";
  return `color-mix(in srgb, ${base} ${active ? 28 : 9}%, transparent)`;
}

function litOpacity(s: RayState, lit: boolean, dim = 0.25) {
  return stateOpacity(s) * (lit ? 1 : dim);
}

function transitionSpec(properties: string[]) {
  return transitionEnabled.value
    ? properties.map((property) => `${property.trim()} ${TR}`).join(", ")
    : "none";
}

function transitionFor(
  s: RayState,
  base: string[],
  state: string[] = [],
) {
  return transitionSpec(s === RayState.ACTIVE ? base : [...base, ...state]);
}

function pathStyle(
  path: string,
  transition: string,
  extra: StyleMap = {},
): StyleMap {
  return {
    d: `path('${path}')`,
    transition,
    ...extra,
  };
}

function coneLit(index: number) {
  return !interactive.value || index === hoveredCone.value;
}

function rayLit(index: number) {
  return (
    !interactive.value ||
    hoveredCone.value === index ||
    hoveredCone.value === index - 1
  );
}

function coneStyle(cone: Cone): StyleMap {
  return pathStyle(conePath(cone), transitionFor(cone.s, D, OPACITY_FILL), {
    mixBlendMode: "var(--blend)",
    opacity: stateOpacity(cone.s),
  });
}

function backendStyle(pixel: CameraPixel, index: number): StyleMap {
  return pathStyle(backendPath(pixel), transitionFor(pixel.s, D, FILL_OPACITY), {
    fill: "currentColor",
    fillOpacity: stateOpacity(pixel.s) * (coneLit(index) ? 0.22 : 0.07),
  });
}

function sensorPixelStyle(pixel: CameraPixel, index: number): StyleMap {
  const active = coneLit(index);
  return pathStyle(
    sensorPixelPath(pixel),
    transitionFor(pixel.s, D, OPACITY_STROKE_WIDTH),
    {
      stroke: active ? "currentColor" : splitAttrs.value.lineStroke,
      "stroke-width": active ? 9 : 3,
      opacity: litOpacity(pixel.s, active, 0.4),
      filter: active
        ? "drop-shadow(0 0 6px color-mix(in srgb, currentColor 60%, transparent))"
        : "none",
    },
  );
}

function rayStyle(ray: Ray, index: number): StyleMap {
  return pathStyle(
    rayPath(ray),
    transitionFor(
      ray.s,
      customDash.value ? D : [...D, "stroke-dashoffset"],
      OPACITY_STROKE,
    ),
    {
      stroke: splitAttrs.value.lineStroke,
      opacity: litOpacity(ray.s, rayLit(index)),
      strokeDasharray: edgeDasharray.value,
      strokeDashoffset: edgeDashoffset.value,
    },
  );
}

watch(
  () => [props.fov, normalizeRes(props.res)] as const,
  ([nextFov, nextRes], previous) => {
    if (!previous) {
      resetRays(nextFov, nextRes);
      return;
    }

    const [prevFov, prevRes] = previous;
    if (nextFov === prevFov && nextRes === prevRes) return;

    beginStageTransition();
    syncRays(nextFov, nextRes);
    stageTransition();
  },
  { immediate: true },
);
</script>

<template>
  <g
    ref="root"
    v-bind="splitAttrs.groupAttrs"
    :style="splitAttrs.groupStyle"
    :class="{ 'is-staging': staging }"
  >
    <path
      v-for="(cone, index) in cones"
      :key="`cone-${cone.id}`"
      :class="['cone', statusClass(cone.s)]"
      :d="conePath(cone)"
      :style="coneStyle(cone)"
      :fill="rayFill(coneLit(index))"
    />

    <path
      v-for="(pixel, index) in cameraPixels"
      :key="`backend-${pixel.id}`"
      :class="['backend', statusClass(pixel.s)]"
      :d="backendPath(pixel)"
      :style="backendStyle(pixel, index)"
    />

    <path
      v-for="(ray, index) in orderedRays"
      :key="`ray-${ray.id}`"
      :class="['ray', statusClass(ray.s)]"
      :d="rayPath(ray)"
      fill="none"
      stroke-width="2"
      :pathLength="edgePathLength"
      v-bind="splitAttrs.strokeRest"
      :style="rayStyle(ray, index)"
    />

    <path
      v-for="(pixel, index) in cameraPixels"
      :key="`sensor-${pixel.id}`"
      :class="['sensor-pixel', statusClass(pixel.s)]"
      :d="sensorPixelPath(pixel)"
      fill="none"
      stroke-linecap="butt"
      :style="sensorPixelStyle(pixel, index)"
    />
  </g>
</template>
