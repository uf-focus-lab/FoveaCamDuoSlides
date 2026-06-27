<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, watch } from "vue";
import CameraRay from "components/CameraRay";
import DimAnnotation from "components/DimAnnotation.vue";

// `stage` drives the sensor parameters: see the choreography note below.
const props = defineProps<{ stage: number }>();

const DEG = Math.PI / 180;

// Static stereo rig: two pinhole cameras, strictly parallel (both point up,
// -Y, no rotation, no vergence). The optical centers sit on a common baseline.
const CAM_Y = 800; // optical-center height
const LEFT_X = 180; // optical centers are BASELINE (b) apart
const RIGHT_X = 420;

const FOV_BASE = 90; // field of view at the base focal length, degrees
const RES = 9; // base sensor pixels per camera
const FOCAL_BASE = 120; // base f, optical-center → sensor distance, px
const HEIGHT = 1480; // how far the scene-side fan reaches
const Z_X = LEFT_X - 100; // x of the Z (depth) dimension line, left of the rig

// The sensor's physical half-width, f·tan(fov/2), is held fixed; the fov
// narrows as the focal length grows (a telephoto trade), so doubling f keeps
// the same sensor size instead of widening it.
const SENSOR_HALF = FOCAL_BASE * Math.tan((FOV_BASE / 2) * DEG);

// Stage choreography (all dimensions stay visible throughout):
//   3 → discretize: the pixel boundary lines appear (matches ΔZ in the math).
//   5 → double each sensor's resolution (the "increasing resolution" answer);
//       stage 4 is the question reveal, so the doubling lands one step later.
// Focal doubling is kept but gated past the last stage, so it stays off for now
// (lower the threshold / add a stage to re-enable it later).
const boundary = computed(() => props.stage >= 3);
const res = computed(() => (props.stage >= 5 ? RES * 2 : RES));
const focal = computed(() => (props.stage >= 6 ? FOCAL_BASE * 2 : FOCAL_BASE));
const fov = computed(
  () => (2 * Math.atan(SENSOR_HALF / focal.value)) / DEG, // covariant with focal
);
const sensorY = computed(() => CAM_Y + focal.value); // sensor plane height

// While a structural change (resolution / boundary / focal) is mid-transition,
// tell CameraRay to drop the highlight so the lit cell doesn't chase rearranging
// pixels. The point loop never touches these, so per-frame tracking is unaffected.
const rayAnimating = ref(false);
let rayAnimTimer: ReturnType<typeof setTimeout> | undefined;
watch([res, boundary, focal], () => {
  rayAnimating.value = true;
  clearTimeout(rayAnimTimer);
  // Slightly past --transition-duration (≈0.7s) so it covers the ease.
  rayAnimTimer = setTimeout(() => (rayAnimating.value = false), 800);
});
onScopeDispose(() => clearTimeout(rayAnimTimer));

// Reactive scene point. Dragging the handle moves it; everything downstream
// (highlighted ray, sensor pixel, disparities) recomputes.
const target = ref({ x: 300, y: 500 });
const dragging = ref(false);
const svg = ref<SVGSVGElement>();
// The handle's *live* position (its CSS transform, mid-transition), sampled per
// frame so the ray highlight follows the eased motion instead of jumping to the
// keypoint with `target` and skipping intermediate cells.
const targetEl = ref<SVGGElement>();
const pointer = ref({ x: 300, y: 500 });

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

function toLocal(e: PointerEvent) {
  const ctm = svg.value?.getScreenCTM();
  if (!ctm) return null;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

function onDown(e: PointerEvent) {
  dragging.value = true;
  (e.target as Element).setPointerCapture?.(e.pointerId);
  onDrag(e);
}

function onDrag(e: PointerEvent) {
  if (!dragging.value) return;
  const p = toLocal(e);
  if (!p) return;
  // Keep the point comfortably above the rig and within the canvas.
  target.value = { x: clamp(p.x, 120, 480), y: clamp(p.y, 90, 640) };
}

function onUp() {
  dragging.value = false;
}

// Looped demo: the target steps through a 3×3 grid of keypoints (à la the
// trade-off chart's vergence scan). Each jump is eased by the shared transition
// vars, so the point, rays and dimensions move in sync. Dragging pauses the loop
// (and `.dragging` zeroes the duration, so the drag itself tracks instantly).
const keypointRows = [
  { y: 200, xs: [120, 300, 480] },
  { y: 350, xs: [180, 300, 420] },
  { y: 500, xs: [200, 300, 400] },
] as const;
const keypoints = keypointRows.flatMap(({ y, xs }, r) =>
  (r % 2 ? [...xs].reverse() : xs).map((x) => ({ x, y })),
);
const KEYPOINT_MS = 1400;

let goal = 0;
let stepTimer: ReturnType<typeof setInterval> | undefined;
let raf = 0;

// Read the handle's eased position each frame, in viewBox coords, via screen
// CTMs (these bake in the live CSS transform — unlike getCTM). The highlight
// cursor then tracks the real motion, so `cursorFor` offsets it per camera.
function samplePointer() {
  const handle = targetEl.value?.getScreenCTM();
  const root = svg.value?.getScreenCTM();
  if (handle && root) {
    const p = new DOMPoint(handle.e, handle.f).matrixTransform(root.inverse());
    if (p.x !== pointer.value.x || p.y !== pointer.value.y) {
      pointer.value = { x: p.x, y: p.y };
    }
  }
  raf = requestAnimationFrame(samplePointer);
}

onMounted(() => {
  stepTimer = setInterval(() => {
    if (dragging.value) return;
    goal = (goal + 1) % keypoints.length;
    target.value = { ...keypoints[goal] };
  }, KEYPOINT_MS);
  raf = requestAnimationFrame(samplePointer);
});

onScopeDispose(() => {
  clearInterval(stepTimer);
  cancelAnimationFrame(raf);
});

// Pinhole projection of the target into a camera (optical center `cx, CAM_Y`,
// axis up): the sensor projection x (disparity end), whether the target is in
// fov, and the chief ray scene → pinhole → pixel. These follow the eased
// `target` value (their CSS `d` transitions smooth the jump).
function project(cx: number) {
  const px = target.value.x - cx;
  const depth = CAM_Y - target.value.y; // > 0 (target above the rig)
  const sensorX = cx - (focal.value * px) / depth; // mirror through the pinhole
  return {
    x: cx,
    sensorX,
    inFov: Math.abs(Math.atan2(px, depth)) <= (fov.value / 2) * DEG,
    chief: `M${target.value.x},${target.value.y} L${cx},${CAM_Y} L${sensorX},${sensorY.value}`,
  };
}

// The two cameras, drawn left/right-symmetrically everywhere via `v-for`.
const cams = computed(() => [
  { color: "var(--camera-left)", disp: "d₁", ...project(LEFT_X) },
  { color: "var(--camera-right)", disp: "d₂", ...project(RIGHT_X) },
]);

// Highlight cursor in a camera's local frame, from the live (per-frame) pointer
// so intermediate cells light as the point eases. `null` (no highlight) before
// discretization.
function cursorFor(cx: number) {
  if (!boundary.value) return null;
  return { x: pointer.value.x - cx, y: pointer.value.y - CAM_Y };
}
</script>

<template>
  <div class="geometry-chart" :class="{ dragging }">
    <svg
      ref="svg"
      viewBox="0 0 600 1200"
      preserveAspectRatio="xMidYMid meet"
      @pointermove="onDrag"
      @pointerup="onUp"
      @pointerleave="onUp"
    >
      <!-- Disparities d₁ / d₂: drawn first so they sit below everything else. -->
      <g class="disparities">
        <g v-for="cam in cams" :key="cam.disp" :class="{ off: !cam.inFov }">
          <DimAnnotation
            :a="[cam.x, sensorY + 24]"
            :b="[cam.sensorX, sensorY + 24]"
            :dir="[1, 0]"
            :label="cam.disp"
          />
        </g>
      </g>

      <!-- Chief rays: drawn before the cameras so the cameras' sensor pixels
           (incl. the highlighted block) paint on top of them. -->
      <g class="chief">
        <path
          v-for="cam in cams"
          :key="cam.disp"
          :class="{ off: !cam.inFov }"
          :d="cam.chief"
          :style="{ d: `path('${cam.chief}')` }"
        />
      </g>

      <!-- Cameras with their pinhole fans + sensor backends. -->
      <g
        v-for="cam in cams"
        :key="cam.disp"
        class="pinhole"
        :transform="`translate(${cam.x}, ${CAM_Y})`"
        :style="{ color: cam.color }"
      >
        <line x1="-50" y1="0" x2="-10" y2="0" />
        <line x1="50" y1="0" x2="10" y2="0" />
        <CameraRay
          :fov="fov"
          :resolution="res"
          :max-resolution="RES * 2"
          :height="HEIGHT"
          :f="focal"
          :boundary="boundary"
          :animating="rayAnimating"
          :cursor="cursorFor(cam.x)"
        />
      </g>

      <!-- Z (depth) + f (focal length) + b (baseline): always shown. The line is
           offset off the anchors, so each adds dashed helper lines automatically. -->
      <g class="dims">
        <DimAnnotation
          :a="[target.x, target.y]"
          :b="[target.x, CAM_Y]"
          :offset="Z_X - target.x"
          label="Z"
        />
        <DimAnnotation :a="[RIGHT_X, CAM_Y]" :b="[RIGHT_X, sensorY]" :offset="130" label="f" />
        <DimAnnotation
          :a="[LEFT_X, CAM_Y]"
          :b="[RIGHT_X, CAM_Y]"
          :offset="CAM_Y - sensorY - 75"
          label="b"
        />
      </g>

      <!-- Draggable scene point. -->
      <g
        ref="targetEl"
        class="target"
        :style="{ transform: `translate(${target.x}px, ${target.y}px)` }"
        @pointerdown="onDown"
      >
        <circle r="26" class="hit" />
        <circle r="9" class="dot" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.geometry-chart {
  position: relative;
  width: 100%;
  height: 100%;
}

.geometry-chart svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* While dragging, zero the shared duration so the point + everything keyed off
   it (rays, dimensions) tracks the cursor instantly instead of easing. */
.geometry-chart.dragging {
  --transition-duration: 0s;
}

/* Chief rays: the target's projection rays, in the foreground color. */
.chief path {
  fill: none;
  stroke: var(--fc-fg);
  stroke-width: 3;
  stroke-linejoin: round;
  transition:
    d var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve);
}
.chief path.off {
  opacity: 0;
}

/* DimAnnotation paints with currentColor; the dimensions are foreground. */
.dims {
  color: var(--fc-fg);
}
/* Disparities reuse DimAnnotation, but fainter and at 80% scale (the size vars
   inherit into the component). */
.disparities {
  color: var(--fc-fg);
  --dim-weight: 3.2;
  --dim-font: 32px;
}
.disparities g {
  opacity: 0.8;
  transition: opacity var(--transition-duration) var(--transition-curve);
}
.disparities g.off {
  opacity: 0;
}

/* Pinhole cameras: two short marks framing the aperture at the optical center */
.pinhole line {
  stroke: color-mix(in srgb, currentColor 50%, var(--fc-fg));
  stroke-width: 5;
  stroke-linecap: round;
}

/* Draggable target — its position eases between keypoints via the shared vars
   (instant while dragging, since `.dragging` zeroes the duration). */
.target {
  cursor: grab;
  transition: transform var(--transition-duration) var(--transition-curve);
}
.dragging .target {
  cursor: grabbing;
}
.target .hit {
  fill: transparent;
}
.target .dot {
  fill: var(--fc-fg);
  stroke: var(--fc-bg);
  stroke-width: 3;
  transition: r var(--transition-duration) var(--transition-curve);
}
.target:hover .dot,
.dragging .target .dot {
  r: 11;
}
</style>
