<script setup lang="ts">
import { computed } from "vue";
import type { RegressionPanel } from "assets/calibration/extrinsic/regression-data";

const props = defineProps<{
  panel: RegressionPanel;
  /** Prediction series colour identity. */
  variant: "volt" | "angle";
  /** Override the per-axis unit label (defaults to the panel's unit). */
  unit?: string;
  /** Draw the Y axis ticks + title; off for charts that share a Y axis with their left neighbour. */
  yAxis?: boolean;
}>();

const showYAxis = computed(() => props.yAxis ?? true);

// Square plot area in viewBox units, with margins for the axis labels/titles.
// Dropping the Y axis shrinks the left margin (and the viewBox) accordingly; the
// stray X tick label that then overruns the box is handled by `overflow: visible`.
const S = 1000;
const M = computed(() => ({
  left: showYAxis.value ? 156 : 40,
  right: 30,
  top: 30,
  bottom: 132,
}));
const width = computed(() => M.value.left + S + M.value.right);
const height = computed(() => M.value.top + S + M.value.bottom);

const unit = computed(() => props.unit ?? props.panel.unit);

// Map a data point in [-range, range]² onto the plot area (SVG y grows down).
function sx(x: number) {
  return M.value.left + ((x + props.panel.range) / (2 * props.panel.range)) * S;
}
function sy(y: number) {
  return M.value.top + ((props.panel.range - y) / (2 * props.panel.range)) * S;
}

const ticks = computed(() =>
  props.panel.ticks.map((t) => ({
    label: Math.abs(t).toString(),
    x: sx(t),
    y: sy(t),
  })),
);

const groundTruth = computed(() =>
  props.panel.groundTruth.map(([x, y]) => ({ cx: sx(x), cy: sy(y) })),
);
const prediction = computed(() =>
  props.panel.prediction.map(([x, y]) => ({ cx: sx(x), cy: sy(y) })),
);
const tracePoints = computed(() =>
  prediction.value.map((p) => `${p.cx},${p.cy}`).join(" "),
);
</script>

<template>
  <svg
    class="regression-chart"
    :class="variant"
    :viewBox="`0 0 ${width} ${height}`"
    :style="{ flex: `${width} 1 0` }"
    preserveAspectRatio="xMidYMid meet"
  >
    <!-- Grid -->
    <g class="grid">
      <line
        v-for="t in ticks"
        :key="`gx-${t.label}-${t.x}`"
        :x1="t.x"
        :y1="M.top"
        :x2="t.x"
        :y2="M.top + S"
      />
      <line
        v-for="t in ticks"
        :key="`gy-${t.label}-${t.y}`"
        :x1="M.left"
        :y1="t.y"
        :x2="M.left + S"
        :y2="t.y"
      />
    </g>

    <!-- Raster-scan trace through the predictions -->
    <polyline class="trace" :points="tracePoints" />

    <!-- Ground-truth grid (open circles) -->
    <g class="truth">
      <circle
        v-for="(p, i) in groundTruth"
        :key="`t-${i}`"
        :cx="p.cx"
        :cy="p.cy"
        r="18"
      />
    </g>

    <!-- Regression prediction (filled dots) -->
    <g class="pred">
      <circle
        v-for="(p, i) in prediction"
        :key="`p-${i}`"
        :cx="p.cx"
        :cy="p.cy"
        r="10"
      />
    </g>

    <!-- Axis box -->
    <rect class="axis-box" :x="M.left" :y="M.top" :width="S" :height="S" />

    <!-- Ticks + labels -->
    <g class="ticks">
      <template v-for="t in ticks" :key="`tk-${t.label}-${t.x}`">
        <line :x1="t.x" :y1="M.top + S" :x2="t.x" :y2="M.top + S + 16" />
        <text class="tick-label" :x="t.x" :y="M.top + S + 52" text-anchor="middle">
          {{ t.label }}
        </text>
      </template>
      <g v-if="showYAxis">
        <template v-for="t in ticks" :key="`tky-${t.label}-${t.y}`">
          <line :x1="M.left" :y1="t.y" :x2="M.left - 16" :y2="t.y" />
          <text
            class="tick-label"
            :x="M.left - 30"
            :y="t.y"
            text-anchor="end"
            dominant-baseline="central"
          >
            {{ t.label }}
          </text>
        </template>
      </g>
    </g>

    <!-- Axis titles -->
    <text
      class="axis-title"
      :x="M.left + S / 2"
      :y="height - 18"
      text-anchor="middle"
    >
      X ({{ unit }})
    </text>
    <text
      v-if="showYAxis"
      class="axis-title"
      :transform="`translate(34 ${M.top + S / 2}) rotate(-90)`"
      text-anchor="middle"
    >
      Y ({{ unit }})
    </text>
  </svg>
</template>

<style scoped>
.regression-chart {
  width: 100%;
  height: auto;
  overflow: visible;
  color: var(--fc-fg);
  --pred: var(--blue-2);
}
.regression-chart.angle {
  --pred: var(--red-2);
}

.grid line {
  stroke: currentColor;
  stroke-width: 3;
  opacity: 0.4;
  stroke-dasharray: 12 8;
}

.axis-box {
  fill: none;
  stroke: currentColor;
  stroke-width: 4;
}

.ticks line {
  stroke: currentColor;
  stroke-width: 4;
}
.tick-label,
.axis-title {
  fill: currentColor;
  font-family: "Times New Roman", Times, serif;
}
.tick-label {
  font-size: 46px;
}
.axis-title {
  font-size: 52px;
}

.trace {
  fill: none;
  stroke: currentColor;
  stroke-width: 8;
  stroke-linejoin: round;
  stroke-linecap: round;
  opacity: 0.2;
}

.truth circle {
  fill: none;
  stroke: currentColor;
  stroke-width: 4;
}

.pred circle {
  fill: var(--pred);
}
</style>
