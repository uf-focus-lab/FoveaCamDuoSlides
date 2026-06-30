<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUpdate,
  onUpdated,
  ref,
  useId,
} from "vue";

type Point2d = { x: number; y: number };
type Homography = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

const props = withDefaults(
  defineProps<{
    points: Point2d[];
    h: Homography;
    label: string;
    color?: string;
    fill?: string;
    muted?: boolean;
    distorted?: boolean;
    offset?: Point2d;
    frame?: { width: number; height: number };
  }>(),
  {
    color: undefined,
    fill: undefined,
    muted: false,
    distorted: false,
    offset: () => ({ x: 0, y: 0 }),
    frame: () => ({ width: 1440, height: 1080 }),
  },
);

const view = { width: 300, height: 188, pad: 10 };
const clipId = `camera-view-clip-${useId()}`;
const accent = computed(() => props.color ?? props.fill ?? "currentColor");
const labelFlow = ref<HTMLElement>();
const prefixEl = ref<HTMLElement>();
const suffixEl = ref<HTMLElement>();
const leavingEl = ref<HTMLElement>();
const leavingSuffix = ref("");
const leavingStyle = ref<Record<string, string>>({});
// Tunable word-center guesses, in px relative to `.frame-label-flow`.
// These override measured centers for the Raw/Rectified crossfade path.
const LABEL_WORD_CENTER_GUESS: Record<string, Point2d> = {
  "Left Fovea Raw": { x: 189, y: 9 },
  "Left Fovea Rectified": { x: 189, y: 9 },
  "Right Fovea Raw": { x: 194, y: 9 },
  "Right Fovea Rectified": { x: 194, y: 9 },
};

const sourceFrame = computed(() => frameCorners(props.frame));
const rectifiedFrame = computed(() =>
  sourceFrame.value.map((p) => project(p, props.h)),
);
const rectifiedFit = computed(() => createFit(rectifiedFrame.value));
const rawFit = computed(() => createFit(sourceFrame.value));
const projectedFrame = computed(() =>
  rectifiedFrame.value.map(rectifiedFit.value),
);
const projectedPoints = computed(() =>
  props.points.map((p) => rectifiedFit.value(project(p, props.h))),
);
const corners = computed(() => projectedPoints.value.slice(0, 4));
const markerBBox = computed(() => bbox(corners.value));
const markerCenter = computed(() => center(markerBBox.value));
const markerSize = computed(() =>
  Math.min(markerBBox.value.width, markerBBox.value.height),
);
const framePath = computed(() => polygonPath(projectedFrame.value));
const markerPath = computed(() => polygonPath(corners.value));

const gridGeom = computed(() => {
  const frame = bbox(projectedFrame.value);
  const marker = markerBBox.value;
  return { frame, marker, dx: marker.width / 3, dy: marker.height / 3 };
});
const verticalLines = computed(() => {
  const { frame, marker, dx } = gridGeom.value;
  return gridPositions(marker.x, dx, frame.x, frame.x + frame.width).map(
    (x) => ({ a: { x, y: frame.y }, b: { x, y: frame.y + frame.height } }),
  );
});
const horizontalLines = computed(() => {
  const { frame, marker, dy } = gridGeom.value;
  return gridPositions(marker.y, dy, frame.y, frame.y + frame.height).map(
    (y) => ({ a: { x: frame.x, y }, b: { x: frame.x + frame.width, y } }),
  );
});

const distortionMatrix = computed(() =>
  findHomography(projectedFrame.value, sourceFrame.value.map(rawFit.value)),
);
const warpStyle = computed(() => ({
  transform: props.distorted
    ? homographyToMatrix3d(distortionMatrix.value)
    : "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)",
}));
const labelParts = computed(() => {
  const label = props.label.trimEnd();
  const split = label.lastIndexOf(" ");
  if (split < 0) return { prefix: "", suffix: label };
  return { prefix: label.slice(0, split), suffix: label.slice(split + 1) };
});
let capturedLabel:
  | {
      label: string;
      suffix: string;
      prefixRect?: DOMRect;
      suffixRect: DOMRect;
    }
  | undefined;
let labelAnimationRun = 0;

onBeforeUpdate(() => {
  const oldSuffix = suffixEl.value?.textContent?.trim();
  if (!oldSuffix || oldSuffix === labelParts.value.suffix) return;

  capturedLabel = {
    label: props.label,
    suffix: oldSuffix,
    prefixRect: prefixEl.value?.getBoundingClientRect(),
    suffixRect: suffixEl.value!.getBoundingClientRect(),
  };
});

onUpdated(() => {
  if (!capturedLabel || !labelFlow.value || !suffixEl.value) return;

  const current = capturedLabel;
  capturedLabel = undefined;
  const flowRect = labelFlow.value.getBoundingClientRect();
  const suffixRect = suffixEl.value.getBoundingClientRect();
  const oldCenter =
    guessedWordCenter(current.label, flowRect) ?? centerOf(current.suffixRect);
  const newCenter = guessedWordCenter(props.label, flowRect) ?? centerOf(suffixRect);
  const dx = oldCenter.x - newCenter.x;
  const dy = oldCenter.y - newCenter.y;
  const timing = labelAnimationTiming(labelFlow.value);
  const run = ++labelAnimationRun;

  leavingSuffix.value = current.suffix;
  leavingStyle.value = {
    left: `${newCenter.x - flowRect.x - current.suffixRect.width / 2}px`,
    top: `${newCenter.y - flowRect.y - current.suffixRect.height / 2}px`,
    width: `${current.suffixRect.width}px`,
  };

  if (current.prefixRect && prefixEl.value) {
    const nextPrefixRect = prefixEl.value.getBoundingClientRect();
    prefixEl.value.animate(
      [
        {
          transform: `translate(${current.prefixRect.x - nextPrefixRect.x}px, ${
            current.prefixRect.y - nextPrefixRect.y
          }px)`,
        },
        { transform: "translate(0, 0)" },
      ],
      timing,
    );
  }

  suffixEl.value.animate(
    [
      { opacity: 0, transform: `translate(${dx}px, ${dy}px)` },
      { opacity: 1, transform: "translate(0, 0)" },
    ],
    timing,
  );

  void nextTick(() => {
    const animation = leavingEl.value?.animate(
      [
        { opacity: 1, transform: `translate(${dx}px, ${dy}px)` },
        { opacity: 0, transform: "translate(0, 0)" },
      ],
      timing,
    );
    void animation?.finished.finally(() => {
      if (run === labelAnimationRun) leavingSuffix.value = "";
    });
  });
});

function centerOf(rect: DOMRect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function guessedWordCenter(label: string, flowRect: DOMRect) {
  const guess = LABEL_WORD_CENTER_GUESS[label];
  if (!guess) return undefined;
  return { x: flowRect.x + guess.x, y: flowRect.y + guess.y };
}

function labelAnimationTiming(el: HTMLElement): KeyframeAnimationOptions {
  const style = getComputedStyle(el);
  return {
    duration: parseCssTime(style.getPropertyValue("--transition-duration")),
    easing: style.getPropertyValue("--transition-curve").trim() || "ease-in-out",
    fill: "both",
  };
}

function parseCssTime(value: string) {
  const trimmed = value.trim();
  if (trimmed.endsWith("ms")) return Number.parseFloat(trimmed) || 0;
  if (trimmed.endsWith("s")) return (Number.parseFloat(trimmed) || 0) * 1000;
  return Number.parseFloat(trimmed) || 0;
}

function frameCorners(frame: { width: number; height: number }) {
  return [
    { x: 0, y: 0 },
    { x: frame.width, y: 0 },
    { x: frame.width, y: frame.height },
    { x: 0, y: frame.height },
  ];
}

function project(p: Point2d, h: Homography) {
  const w = h[6] * p.x + h[7] * p.y + h[8];
  return {
    x: (h[0] * p.x + h[1] * p.y + h[2]) / w,
    y: (h[3] * p.x + h[4] * p.y + h[5]) / w,
  };
}

function bbox(pts: Point2d[]) {
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function center(box: { x: number; y: number; width: number; height: number }) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function gridPositions(origin: number, step: number, min: number, max: number) {
  if (!Number.isFinite(step) || step <= 0) return [];
  const positions: number[] = [];
  for (let p = origin; p >= min; p -= step) positions.unshift(p);
  for (let p = origin + step; p <= max; p += step) positions.push(p);
  return positions;
}

function createFit(frame: Point2d[]) {
  const minX = Math.min(...frame.map((p) => p.x));
  const maxX = Math.max(...frame.map((p) => p.x));
  const minY = Math.min(...frame.map((p) => p.y));
  const maxY = Math.max(...frame.map((p) => p.y));
  const scale = Math.min(
    (view.width - view.pad * 2) / Math.max(maxX - minX, 1),
    (view.height - view.pad * 2) / Math.max(maxY - minY, 1),
  );
  const sourceCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  const targetCenter = { x: view.width / 2, y: view.height / 2 };
  return (p: Point2d) => ({
    x: targetCenter.x + (p.x - sourceCenter.x) * scale,
    y: targetCenter.y + (p.y - sourceCenter.y) * scale,
  });
}

function findHomography(src: Point2d[], dst: Point2d[]): Homography {
  const matrix: number[][] = [];
  const vector: number[] = [];
  src.forEach((p, i) => {
    const q = dst[i]!;
    matrix.push([p.x, p.y, 1, 0, 0, 0, -q.x * p.x, -q.x * p.y]);
    vector.push(q.x);
    matrix.push([0, 0, 0, p.x, p.y, 1, -q.y * p.x, -q.y * p.y]);
    vector.push(q.y);
  });
  return [...solveLinear(matrix, vector), 1] as Homography;
}

function solveLinear(matrix: number[][], vector: number[]) {
  const n = vector.length;
  const rows = matrix.map((row, i) => [...row, vector[i]!]);
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(rows[r]![i]!) > Math.abs(rows[pivot]![i]!)) pivot = r;
    }
    [rows[i], rows[pivot]] = [rows[pivot]!, rows[i]!];
    const divisor = rows[i]![i]!;
    for (let c = i; c <= n; c++) rows[i]![c] = rows[i]![c]! / divisor;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const factor = rows[r]![i]!;
      for (let c = i; c <= n; c++) {
        rows[r]![c] = rows[r]![c]! - factor * rows[i]![c]!;
      }
    }
  }
  return rows.map((row) => row[n]!);
}

function homographyToMatrix3d(h: Homography) {
  const k = h[8] || 1;
  const n = h.map((v) => v / k) as Homography;
  return `matrix3d(${[
    n[0],
    n[3],
    0,
    n[6],
    n[1],
    n[4],
    0,
    n[7],
    0,
    0,
    1,
    0,
    n[2],
    n[5],
    0,
    1,
  ].join(", ")})`;
}

function polygonPath(pts: Point2d[]) {
  return pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ") + " Z";
}
</script>

<template>
  <svg
    class="camera-view"
    :class="{ muted }"
    :x="offset.x"
    :y="offset.y"
    :width="view.width"
    :height="view.height"
    :viewBox="`0 0 ${view.width} ${view.height}`"
    overflow="visible"
    :style="{ color: accent }"
    role="img"
  >
    <defs>
      <clipPath :id="clipId">
        <path :d="framePath" />
      </clipPath>
    </defs>

    <g class="warp-layer" :style="warpStyle">
      <path class="frame-fill" :d="framePath" />
      <g :clip-path="`url(#${clipId})`">
        <slot
          :projected-points="projectedPoints"
          :corners="corners"
          :marker-bbox="markerBBox"
          :marker-center="markerCenter"
          :marker-size="markerSize"
          :marker-path="markerPath"
          :vertical-lines="verticalLines"
          :horizontal-lines="horizontalLines"
          :frame-path="framePath"
          :frame="gridGeom.frame"
        />
      </g>
      <path class="frame-boundary" :d="framePath" />
    </g>

    <foreignObject
      class="frame-label"
      x="0"
      :y="view.height + 2"
      :width="view.width"
      height="28"
      overflow="visible"
    >
      <div
        ref="labelFlow"
        xmlns="http://www.w3.org/1999/xhtml"
        class="frame-label-flow"
      >
        <span v-if="labelParts.prefix" ref="prefixEl" class="frame-label-prefix">
          {{ labelParts.prefix }}
        </span>
        <span
          ref="suffixEl"
          :key="labelParts.suffix"
          class="frame-label-suffix"
        >
          {{ labelParts.suffix }}
        </span>
        <span
          v-if="leavingSuffix"
          ref="leavingEl"
          class="frame-label-suffix frame-label-suffix-leaving"
          :style="leavingStyle"
        >
          {{ leavingSuffix }}
        </span>
      </div>
    </foreignObject>
  </svg>
</template>

<style scoped>
.camera-view {
  color: currentColor;
}

.warp-layer {
  transform-box: view-box;
  transform-origin: 0 0;
  transition: transform var(--transition-duration) var(--transition-curve);
}

.frame-fill,
.frame-boundary {
  transition: d var(--transition-duration) var(--transition-curve);
}

.frame-fill {
  fill: color-mix(in srgb, currentColor 6%, var(--fc-bg));
  stroke: none;
}

.frame-boundary {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.frame-label {
  color: currentColor;
  font-size: 15px;
  font-weight: 700;
}

.frame-label-flow {
  position: relative;
  width: 100%;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
}

.frame-label-prefix {
  display: inline-block;
  margin-right: 0.33em;
}

.frame-label-suffix {
  display: inline-block;
  transform-origin: center center;
}

.frame-label-suffix-leaving {
  position: absolute;
  z-index: 1;
  text-align: center;
  pointer-events: none;
}

.muted {
  opacity: 0.72;
}
</style>
