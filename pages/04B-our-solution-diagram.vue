<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onScopeDispose,
  ref,
  watch,
} from "vue";
import CameraModel from "components/CameraModel";
import CameraRay from "components/CameraRay";

const props = defineProps<{ stage: number }>();

type Point = { x: number; y: number };

const LEFT_CAMERA = { x: 50, y: 950, rotate: 25 };
const RIGHT_CAMERA = { x: 550, y: 950, rotate: -25 };
const VERGENCE_STEP_MS = 850;

const origin = { x: 300, y: 400 };

const vergencePoints = [
  { id: "0-0", dx: -200, dy: -200 },
  { id: "0-1", dx: 0, dy: -200 },
  { id: "0-2", dx: +200, dy: -200 },
  { id: "1-0", dx: -140, dy: 0 },
  { id: "1-1", dx: 0, dy: 0 },
  { id: "2-0", dx: +140, dy: 0 },
  { id: "1-2", dx: -80, dy: 150 },
  { id: "2-1", dx: 0, dy: 150 },
  { id: "2-2", dx: +80, dy: 150 },
];

const CENTER_VERGENCE_INDEX = vergencePoints.findIndex(
  ({ dx, dy }) => dx === 0 && dy === 0,
);

function vergencePoint(idx: number): Point & { id: string } {
  const { id, dx, dy } = vergencePoints[idx];
  return { id, x: origin.x + dx, y: origin.y + dy };
}

function angleToPoint(camera: Point, target: Point): number {
  return (Math.atan2(target.x - camera.x, camera.y - target.y) * 180) / Math.PI;
}

function anglesForPoint(target: Point) {
  return {
    left: angleToPoint(LEFT_CAMERA, target),
    right: angleToPoint(RIGHT_CAMERA, target),
  };
}

function cameraTransform({
  x,
  y,
  rotate,
}: {
  x: number;
  y: number;
  rotate: number;
}): string {
  return `translate(${x}px, ${y}px) rotate(${rotate}deg)`;
}

// After stage 1 the side cameras switch from wide-angle to a narrow telephoto
// fovea — narrower fov and a longer lens barrel.
const telephoto = computed(() => props.stage >= 2);
const sideFov = computed(() => (telephoto.value ? 5 : 45));
const sideLens = computed(() => (telephoto.value ? 180 : 100));

// From stage 3 on, both side cameras repeatedly verge onto a shared point in a
// 3x3 grid. JS updates this reactive angle pair; CSS only eases the transform.
const panning = computed(() => props.stage >= 3);
const activeVergenceIndex = ref(CENTER_VERGENCE_INDEX);
const activeVergencePoint = computed(() =>
  vergencePoint(activeVergenceIndex.value),
);
const vergenceAngles = ref(anglesForPoint(activeVergencePoint.value));
const showVergencePoints = ref(false);

let vergenceTimer: ReturnType<typeof setInterval> | undefined;
let stopPanningWatch: (() => void) | undefined;

function setVergenceIndex(index: number) {
  activeVergenceIndex.value = index;
  vergenceAngles.value = anglesForPoint(vergencePoint(index));
}

function stopVergenceScan() {
  if (vergenceTimer) clearInterval(vergenceTimer);
  vergenceTimer = undefined;
}

function startVergenceScan() {
  stopVergenceScan();
  setVergenceIndex(CENTER_VERGENCE_INDEX);
  vergenceTimer = setInterval(() => {
    setVergenceIndex((activeVergenceIndex.value + 1) % vergencePoints.length);
  }, VERGENCE_STEP_MS);
}

// Camera descriptors: static placement & identity plus the current animated
// props (fov / lens / rotation). The center camera is the fixed wide context view.
const center = computed(() => ({
  fill: "var(--camera-center)",
  label: "C",
  x: 300,
  y: 950,
  rotate: 0,
  fov: 45,
  lens: 100,
}));
const left = computed(() => ({
  fill: "var(--camera-left)",
  label: "L",
  x: LEFT_CAMERA.x,
  y: LEFT_CAMERA.y,
  rotate: panning.value ? vergenceAngles.value.left : LEFT_CAMERA.rotate,
  fov: sideFov.value,
  lens: sideLens.value,
}));
const right = computed(() => ({
  fill: "var(--camera-right)",
  label: "R",
  x: RIGHT_CAMERA.x,
  y: RIGHT_CAMERA.y,
  rotate: panning.value ? vergenceAngles.value.right : RIGHT_CAMERA.rotate,
  fov: sideFov.value,
  lens: sideLens.value,
}));

const svg = ref<SVGSVGElement>();

type Local = { x: number; y: number } | null;
// Pointer in each camera's local frame, or `null` when idle (still interactive).
const centerCursor = ref<Local>(null);
const leftCursor = ref<Local>(null);
const rightCursor = ref<Local>(null);

// Last pointer position in screen (client) coordinates while hovering.
let client: { x: number; y: number } | null = null;
let raf = 0;

// Map the screen pointer into a camera's local frame via the element's *live*
// CTM, so the result follows the CSS pan animation (which getScreenCTM bakes in)
// even while the pointer is still.
function localIn(selector: string): Local {
  const el = svg.value?.querySelector<SVGGraphicsElement>(selector);
  const ctm = el?.getScreenCTM();
  if (!el || !ctm || !client) return null;
  const p = new DOMPoint(client.x, client.y).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

// Re-sample every frame while hovering: the cameras keep rotating under a
// stationary cursor, so the highlighted ray must be recomputed continuously.
function sample() {
  centerCursor.value = localIn(".center-camera");
  leftCursor.value = localIn(".left-camera");
  rightCursor.value = localIn(".right-camera");
  raf = client ? requestAnimationFrame(sample) : 0;
}

function onMove(e: PointerEvent) {
  client = { x: e.clientX, y: e.clientY };
  if (!raf) raf = requestAnimationFrame(sample);
}

function onLeave() {
  client = null;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  centerCursor.value = leftCursor.value = rightCursor.value = null;
}

onScopeDispose(() => {
  if (raf) cancelAnimationFrame(raf);
  stopPanningWatch?.();
  stopVergenceScan();
});

onMounted(() => {
  stopPanningWatch = watch(
    panning,
    (enabled) => {
      if (enabled) startVergenceScan();
      else {
        stopVergenceScan();
        setVergenceIndex(CENTER_VERGENCE_INDEX);
      }
    },
    { immediate: true },
  );
});

watch(
  () => props.stage >= 3,
  async (visible) => {
    if (!visible) {
      showVergencePoints.value = false;
      return;
    }

    showVergencePoints.value = false;
    await nextTick();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    showVergencePoints.value = true;
  },
  { immediate: true },
);
</script>

<template>
  <div class="tradeoff-chart">
    <svg
      ref="svg"
      viewBox="0 0 600 1200"
      preserveAspectRatio="xMidYMid meet"
      @pointermove="onMove"
      @pointerleave="onLeave"
    >
      <defs></defs>
      <g class="vergence-grid" aria-hidden="true">
        <circle
          v-for="(point, i) in vergencePoints"
          :key="point.id"
          :class="{
            active: point.id === activeVergencePoint.id,
            enter: showVergencePoints,
          }"
          :cx="origin.x + point.dx"
          :cy="origin.y + point.dy"
          r="10"
        />
      </g>
      <CameraModel
        class="center-camera"
        :class="{ visible: stage >= 4 }"
        :transform="`translate(${center.x}, ${center.y}) rotate(${center.rotate})`"
        :fill="center.fill"
        :lens="center.lens"
        :label="center.label"
      >
        <CameraRay
          :fov="center.fov"
          fill="color-mix(in srgb, #888 5%, transparent)"
          stroke="var(--fc-fg)"
          stroke-width="4"
          stroke-dasharray="12 24"
          stroke-linecap="round"
        />
      </CameraModel>
      <CameraModel
        class="side-camera left-camera"
        :style="{ transform: cameraTransform(left) }"
        :fill="left.fill"
        :lens="left.lens"
        :label="left.label"
      >
        <CameraRay :fov="left.fov" :resolution="5" :cursor="leftCursor" />
      </CameraModel>

      <CameraModel
        class="side-camera right-camera"
        :style="{ transform: cameraTransform(right) }"
        :fill="right.fill"
        :lens="right.lens"
        :label="right.label"
      >
        <CameraRay :fov="right.fov" :resolution="5" :cursor="rightCursor" />
      </CameraModel>
    </svg>
  </div>
</template>

<style scoped>
.tradeoff-chart {
  position: relative;
  width: 100%;
  height: 100%;
}

.tradeoff-chart svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* Center camera fades + slides up into place when `visible` toggles. The
   `translate` property composes with CameraModel's positioning `transform`
   attribute instead of overriding it. */
.center-camera {
  opacity: 0;
  translate: 0 50px;
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    translate var(--transition-duration) var(--transition-curve);
}

.center-camera.visible {
  opacity: 1;
  translate: 0;
}

.side-camera {
  transform-origin: 0 0;
  transition: transform var(--transition-duration) var(--transition-curve);
}

.vergence-grid {
  color: color-mix(in srgb, var(--fc-fg) 55%, transparent);
}

.vergence-grid path {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-dasharray: 8 12;
}

.vergence-grid circle {
  fill: color-mix(in srgb, var(--fc-bg) 70%, transparent);
  stroke: currentColor;
  stroke-width: 4;
  opacity: 0;
  transform: scale(2);
  transform-box: fill-box;
  transform-origin: center;
  transition:
    transform var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve),
    fill var(--transition-duration) var(--transition-curve),
    r var(--transition-duration) var(--transition-curve),
    stroke var(--transition-duration) var(--transition-curve);
}

.vergence-grid circle.enter {
  opacity: 1;
  transform: scale(1);
}

.vergence-grid circle.active {
  r: 15;
  fill: var(--fc-fg);
  stroke: var(--fc-bg);
}
</style>
