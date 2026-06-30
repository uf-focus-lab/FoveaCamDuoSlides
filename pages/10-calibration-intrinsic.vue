<script setup lang="ts">
import { computed } from "vue";
import { useStage } from "stores/stage";
import DistortedView from "components/DistortedView.vue";
import GridLines from "components/GridLines.vue";
import Marker from "components/Marker.vue";
import CalibrationIntrinsicEquation from "pages/10A-calibration-intrinsic-equation.vue";

// Stage plan:
//   1  Raw distorted fovea views, marker fully visible.
//   2  Dim the marker; marker boundary, corners, and features draw on.
//   3  Intra-frame grid lines extend out from the detected corners (clipped).
//   4  (transient) Show the homography equation.
//   5  (transient) Annotate equation terms, staggered.
//   6  (transient) Apply H to undistort the frames.
//   7  Global grid expands from center across the whole view.
const stage = useStage(7, { preview: -1 }).transient([2, 4, 6]);

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
type CalibrationRecord = {
  angle: Point2d;
  imgPoints: Point2d[];
  objPoints: Point2d[];
};

const leftRecord: CalibrationRecord = {
  angle: { x: -0.157611, y: -0.129468 },
  imgPoints: [
    { x: 549.814575, y: 345.371429 },
    { x: 914.761475, y: 369.469696 },
    { x: 890.772095, y: 735.125183 },
    { x: 525.645203, y: 710.605164 },
    { x: 606.510071, y: 409.751953 },
    { x: 666.620361, y: 413.735474 },
    { x: 728.750305, y: 417.758636 },
    { x: 849.369812, y: 425.644714 },
    { x: 602.277588, y: 470.695221 },
    { x: 662.64624, y: 474.480469 },
    { x: 724.555847, y: 478.880554 },
    { x: 845.73938, y: 486.689911 },
    { x: 720.535034, y: 540.202271 },
    { x: 780.609131, y: 544.251953 },
    { x: 594.399658, y: 593.005127 },
    { x: 654.4198, y: 597.173462 },
    { x: 777.209351, y: 604.194458 },
    { x: 837.525085, y: 609.656006 },
    { x: 590.230347, y: 654.291626 },
    { x: 650.36908, y: 658.263489 },
    { x: 712.461548, y: 662.425049 },
    { x: 833.329895, y: 670.484924 },
  ],
  objPoints: [
    { x: -0.5, y: -0.5 },
    { x: 0.5, y: -0.5 },
    { x: 0.5, y: 0.5 },
    { x: -0.5, y: 0.5 },
    { x: -0.333333, y: -0.333333 },
    { x: -0.166667, y: -0.333333 },
    { x: 0, y: -0.333333 },
    { x: 0.333333, y: -0.333333 },
    { x: -0.333333, y: -0.166667 },
    { x: -0.166667, y: -0.166667 },
    { x: 0, y: -0.166667 },
    { x: 0.333333, y: -0.166667 },
    { x: 0, y: 0 },
    { x: 0.166667, y: 0 },
    { x: -0.333333, y: 0.166667 },
    { x: -0.166667, y: 0.166667 },
    { x: 0.166667, y: 0.166667 },
    { x: 0.333333, y: 0.166667 },
    { x: -0.333333, y: 0.333333 },
    { x: -0.166667, y: 0.333333 },
    { x: 0, y: 0.333333 },
    { x: 0.333333, y: 0.333333 },
  ],
};

const rightRecord: CalibrationRecord = {
  angle: { x: -0.157611, y: -0.129468 },
  imgPoints: [
    { x: 522.99469, y: 375.067017 },
    { x: 884.240784, y: 342.15152 },
    { x: 916.657349, y: 705.254639 },
    { x: 555.682983, y: 737.852966 },
    { x: 649.367615, y: 424.400543 },
    { x: 830.159485, y: 407.84549 },
    { x: 594.507446, y: 490.323212 },
    { x: 654.148682, y: 484.736389 },
    { x: 774.42688, y: 474.334381 },
    { x: 659.923706, y: 544.941467 },
    { x: 719.991577, y: 540.065918 },
    { x: 780.664063, y: 534.644958 },
    { x: 840.821289, y: 528.441833 },
    { x: 787.124268, y: 595.551758 },
    { x: 846.816711, y: 589.88385 },
    { x: 610.266785, y: 672.351929 },
    { x: 730.157104, y: 660.931946 },
    { x: 791.921753, y: 656.34906 },
    { x: 851.758667, y: 650.087891 },
  ],
  objPoints: [
    { x: -0.5, y: -0.5 },
    { x: 0.5, y: -0.5 },
    { x: 0.5, y: 0.5 },
    { x: -0.5, y: 0.5 },
    { x: -0.166667, y: -0.333333 },
    { x: 0.333333, y: -0.333333 },
    { x: -0.333333, y: -0.166667 },
    { x: -0.166667, y: -0.166667 },
    { x: 0.166667, y: -0.166667 },
    { x: -0.166667, y: 0 },
    { x: 0, y: 0 },
    { x: 0.166667, y: 0 },
    { x: 0.333333, y: 0 },
    { x: 0.166667, y: 0.166667 },
    { x: 0.333333, y: 0.166667 },
    { x: -0.333333, y: 0.333333 },
    { x: 0, y: 0.333333 },
    { x: 0.166667, y: 0.333333 },
    { x: 0.333333, y: 0.333333 },
  ],
};

// Marker IDs are overwritten by user.
const leftCamera = cameraView("Left Fovea", "left", 21, leftRecord);
const rightCamera = cameraView("Right Fovea", "right", 5, rightRecord);

// Both frames live in one SVG (left at x=0, right at x=330) so they share a
// coordinate system. Matching horizontal grid rows are stitched into the
// final-stage global grid.
const CAMERA_VIEW = { width: 300, height: 188, pad: 10 };
const SOURCE_FRAME = { width: 1440, height: 1080 };
const FRAME_WIDTH = CAMERA_VIEW.width;
const FRAME_OFFSET = 330;
const PAIR_VIEW_WIDTH = FRAME_OFFSET + FRAME_WIDTH;
const GLOBAL_GRID = {
  x1: -48,
  x2: PAIR_VIEW_WIDTH + 48,
};
const globalGridLines = computed(() => {
  const left = horizontalGridFor(leftCamera, { x: 0, y: 0 });
  const right = horizontalGridFor(rightCamera, { x: FRAME_OFFSET, y: 0 });
  const n = Math.min(left.length, right.length);
  return Array.from({ length: n }, (_, i) => {
    const y = (left[i]!.y + right[i]!.y) / 2;
    return {
      a: { x: GLOBAL_GRID.x1, y },
      b: { x: GLOBAL_GRID.x2, y },
    };
  });
});

function cameraView(
  key: "Left Fovea" | "Right Fovea",
  role: "left" | "right",
  markerId: number,
  record: CalibrationRecord,
) {
  return {
    key,
    markerId,
    record,
    color: `var(--camera-${role})`,
    h: createRectificationHomography(record),
  };
}

function horizontalGridFor(
  camera: ReturnType<typeof cameraView>,
  offset: Point2d,
) {
  const sourceFrame = frameCorners(SOURCE_FRAME);
  const rectifiedFrame = sourceFrame.map((p) => projectHomography(p, camera.h));
  const fit = createFit(rectifiedFrame);
  const projectedFrame = rectifiedFrame.map(fit);
  const projectedPoints = camera.record.imgPoints.map((p) =>
    fit(projectHomography(p, camera.h)),
  );
  const frame = bbox(projectedFrame);
  const marker = bbox(projectedPoints.slice(0, 4));
  const rows = gridPositions(
    marker.y,
    marker.height / 3,
    frame.y,
    frame.y + frame.height,
  );
  return rows
    .map((y) => ({
      y: y + offset.y,
      x1: frame.x + offset.x,
      x2: frame.x + frame.width + offset.x,
    }))
    .sort((a, b) => a.y - b.y);
}

function createRectificationHomography(record: CalibrationRecord) {
  const relative = transformPoints(record.objPoints, record.angle, 1000);
  const scale = Math.sqrt(
    area(record.imgPoints.slice(0, 4)) / area(relative.slice(0, 4)),
  );
  const center = bilinearInterpolate(record.imgPoints.slice(0, 4), {
    x: 0,
    y: 0,
  });
  const projected = relative.map((p) => ({
    x: center.x + p.x * scale,
    y: center.y + p.y * scale,
  }));
  return findHomography(record.imgPoints, projected);
}

function frameCorners(frame: { width: number; height: number }) {
  return [
    { x: 0, y: 0 },
    { x: frame.width, y: 0 },
    { x: frame.width, y: frame.height },
    { x: 0, y: frame.height },
  ];
}

function projectHomography(p: Point2d, h: Homography) {
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
    (CAMERA_VIEW.width - CAMERA_VIEW.pad * 2) / Math.max(maxX - minX, 1),
    (CAMERA_VIEW.height - CAMERA_VIEW.pad * 2) / Math.max(maxY - minY, 1),
  );
  const sourceCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  const targetCenter = { x: CAMERA_VIEW.width / 2, y: CAMERA_VIEW.height / 2 };
  return (p: Point2d) => ({
    x: targetCenter.x + (p.x - sourceCenter.x) * scale,
    y: targetCenter.y + (p.y - sourceCenter.y) * scale,
  });
}

function transformPoints(
  pts: Point2d[],
  rotation: Partial<Point2d>,
  distance: number,
) {
  const rx = rotation.x ?? 0;
  const ry = rotation.y ?? 0;
  const project = ({ x, y }: Point2d) => {
    let z = distance;
    [y, z] = [
      y * Math.cos(rx) - z * Math.sin(rx),
      y * Math.sin(rx) + z * Math.cos(rx),
    ];
    [x, z] = [
      x * Math.cos(ry) + z * Math.sin(ry),
      -x * Math.sin(ry) + z * Math.cos(ry),
    ];
    return { x: (x * distance) / z, y: (y * distance) / z };
  };
  const c = project({ x: 0, y: 0 });
  return pts.map((p) => {
    const projected = project(p);
    return { x: projected.x - c.x, y: projected.y - c.y };
  });
}

function findHomography(src: Point2d[], dst: Point2d[]): Homography {
  const ata = Array.from({ length: 8 }, () => Array(8).fill(0));
  const atb = Array(8).fill(0);
  const accumulate = (row: number[], target: number) => {
    for (let r = 0; r < row.length; r++) {
      atb[r] += row[r] * target;
      for (let c = 0; c < row.length; c++) ata[r][c] += row[r] * row[c];
    }
  };
  src.forEach((p, i) => {
    const q = dst[i]!;
    accumulate([p.x, p.y, 1, 0, 0, 0, -q.x * p.x, -q.x * p.y], q.x);
    accumulate([0, 0, 0, p.x, p.y, 1, -q.y * p.x, -q.y * p.y], q.y);
  });
  return [...solveLinear(ata, atb), 1] as Homography;
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

function area(pts: Point2d[]) {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

function bilinearInterpolate(corners: Point2d[], p: Point2d) {
  const [tl, tr, br, bl] = corners;
  const x = p.x + 0.5;
  const y = p.y + 0.5;
  return lerp(lerp(tl!, tr!, x), lerp(bl!, br!, x), y);
}

function lerp(a: Point2d, b: Point2d, t: number) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
</script>

<template>
  <div class="intrinsic-calibration">
    <CalibrationIntrinsicEquation
      :stage="stage"
      :points="leftCamera.record.imgPoints"
      :h="leftCamera.h"
    />

    <svg
      class="rect-pair"
      :viewBox="`0 0 ${PAIR_VIEW_WIDTH} 210`"
      overflow="visible"
      role="img"
    >
      <g class="global-grid">
        <GridLines :lines="globalGridLines" :active="stage >= 7" origin="center" />
      </g>

      <DistortedView
        :offset="{ x: 0, y: 0 }"
        :label="`${leftCamera.key} ${stage >= 6 ? 'Rectified' : 'Raw'}`"
        :color="leftCamera.color"
        :points="leftCamera.record.imgPoints"
        :h="leftCamera.h"
        :distorted="stage < 6"
      >
        <template
          #default="{
            markerCenter,
            markerSize,
            markerPath,
            projectedPoints,
            corners,
            verticalLines,
            horizontalLines,
          }"
        >
          <Marker
            class="aruco-marker"
            :class="{ dimmed: stage >= 2 }"
            :id="leftCamera.markerId"
            :cx="markerCenter.x"
            :cy="markerCenter.y"
            :size="markerSize"
          />
          <path
            class="marker-plane annotation-line"
            :class="{ active: stage >= 2 }"
            :d="markerPath"
            pathLength="1"
          />
          <GridLines
            :lines="[...verticalLines, ...horizontalLines]"
            :active="stage >= 3"
          />
          <circle
            v-for="(p, i) in projectedPoints.slice(4)"
            :key="`lf-${i}`"
            class="feature annotation-point"
            :class="{ active: stage >= 2 }"
            :cx="p.x"
            :cy="p.y"
            r="2"
          />
          <circle
            v-for="(p, i) in corners"
            :key="`lc-${i}`"
            class="corner annotation-point"
            :class="{ active: stage >= 2 }"
            :cx="p.x"
            :cy="p.y"
            r="3.2"
          />
        </template>
      </DistortedView>
      <DistortedView
        :offset="{ x: FRAME_OFFSET, y: 0 }"
        :label="`${rightCamera.key} ${stage >= 6 ? 'Rectified' : 'Raw'}`"
        :color="rightCamera.color"
        :points="rightCamera.record.imgPoints"
        :h="rightCamera.h"
        :distorted="stage < 6"
      >
        <template
          #default="{
            markerCenter,
            markerSize,
            markerPath,
            projectedPoints,
            corners,
            verticalLines,
            horizontalLines,
          }"
        >
          <Marker
            class="aruco-marker"
            :class="{ dimmed: stage >= 2 }"
            :id="rightCamera.markerId"
            :cx="markerCenter.x"
            :cy="markerCenter.y"
            :size="markerSize"
          />
          <path
            class="marker-plane annotation-line"
            :class="{ active: stage >= 2 }"
            :d="markerPath"
            pathLength="1"
          />
          <GridLines
            :lines="[...verticalLines, ...horizontalLines]"
            :active="stage >= 3"
          />
          <circle
            v-for="(p, i) in projectedPoints.slice(4)"
            :key="`rf-${i}`"
            class="feature annotation-point"
            :class="{ active: stage >= 2 }"
            :cx="p.x"
            :cy="p.y"
            r="2"
          />
          <circle
            v-for="(p, i) in corners"
            :key="`rc-${i}`"
            class="corner annotation-point"
            :class="{ active: stage >= 2 }"
            :cx="p.x"
            :cy="p.y"
            r="3.2"
          />
        </template>
      </DistortedView>
    </svg>
  </div>
</template>

<style scoped>
.intrinsic-calibration {
  --equation-space: 60px;
  position: relative;
  height: calc(100% - 72px);
  color: var(--fc-fg);
}

.rect-pair {
  position: absolute;
  inset: var(--equation-space) auto auto 0;
  width: 100%;
  height: calc(100% - var(--equation-space));
  overflow: visible;
}

.global-grid {
  color: var(--fc-fg);
}

.aruco-marker {
  opacity: 1;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.aruco-marker.dimmed {
  opacity: 0.25;
}

.marker-plane {
  fill: transparent;
  stroke: color-mix(in srgb, currentColor 92%, var(--fc-bg));
  stroke-width: 3;
  transition:
    d var(--transition-duration) var(--transition-curve),
    stroke-dashoffset var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve);
}

.annotation-line {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: 0;
}

.annotation-line.active {
  stroke-dashoffset: 0;
  opacity: 1;
}

.corner,
.feature {
  transition:
    cx var(--transition-duration) var(--transition-curve),
    cy var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve);
}

.annotation-point {
  opacity: 0;
}

.annotation-point.active {
  opacity: 1;
}

.corner {
  fill: color-mix(in srgb, currentColor 22%, var(--fc-bg));
  stroke: currentColor;
  stroke-width: 3;
}

.feature {
  fill: currentColor;
}
</style>
