<script setup lang="ts">
import { computed } from "vue";
import Annotation from "components/Annotation.vue";

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

const props = defineProps<{
  stage: number;
  points: Point2d[];
  h: Homography;
}>();

const PLOT = { width: 40, height: 40, pad: 0 };
const dots = computed(() => {
  const rectified = props.points.map((p) => project(p, props.h));
  const distorted = rectified.map((p) => project(p, invert(props.h)));
  const [distortedDots, rectifiedDots] = plotSets([distorted, rectified]);
  return { distorted: distortedDots, rectified: rectifiedDots };
});

function plotSets(sets: Point2d[][]) {
  const box = bbox(sets.flat());
  const sx = (PLOT.width - PLOT.pad * 2) / Math.max(box.width, 1);
  const sy = (PLOT.height - PLOT.pad * 2) / Math.max(box.height, 1);
  const scale = Math.min(sx, sy);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  return sets.map((points) =>
    points.map((p) => ({
      x: PLOT.width / 2 + (p.x - cx) * scale,
      y: PLOT.height / 2 + (p.y - cy) * scale,
    })),
  );
}

function project(p: Point2d, h: Homography) {
  const w = h[6] * p.x + h[7] * p.y + h[8];
  return {
    x: (h[0] * p.x + h[1] * p.y + h[2]) / w,
    y: (h[3] * p.x + h[4] * p.y + h[5]) / w,
  };
}

function invert(h: Homography): Homography {
  const [a, b, c, d, e, f, g, i, j] = h;
  const det = a * (e * j - f * i) - b * (d * j - f * g) + c * (d * i - e * g);
  return [
    (e * j - f * i) / det,
    (c * i - b * j) / det,
    (b * f - c * e) / det,
    (f * g - d * j) / det,
    (a * j - c * g) / det,
    (c * d - a * f) / det,
    (d * i - e * g) / det,
    (b * g - a * i) / det,
    (a * e - b * d) / det,
  ];
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
</script>

<template>
  <div
    class="equation"
    :class="{ active: stage >= 4 }"
    aria-label="Homography maps distorted points to rectified points"
  >
    <div class="matrix-group">
      <div class="matrix h-matrix">
        <span class="bracket bracket-left" />
        <span class="h-symbol">H</span>
        <span class="bracket bracket-right" />
      </div>
      <Annotation
        class="term-annotation"
        :show="stage >= 5"
        position="BL"
        :offset="['1.5em', '1em']"
      >
        Projection Matrix
      </Annotation>
    </div>

    <div class="matrix-group">
      <div class="matrix dot-matrix">
        <span class="bracket bracket-left" />
        <svg
          class="dot-plot"
          :viewBox="`0 0 ${PLOT.width} ${PLOT.height}`"
          aria-hidden="true"
        >
          <circle
            v-for="(p, i) in dots.distorted"
            :key="`distorted-${i}`"
            class="equation-dot"
            :cx="p.x"
            :cy="p.y"
            r="1.75"
          />
        </svg>
        <span class="bracket bracket-right" />
      </div>
      <Annotation
        class="term-annotation"
        style="--annotation-delay: 200ms"
        :show="stage >= 5"
        :offset="['3em', '1em']"
        position="BL"
      >
        Distorted Points
      </Annotation>
    </div>

    <span class="equals">=</span>

    <div class="matrix-group">
      <div class="matrix dot-matrix">
        <span class="bracket bracket-left" />
        <svg
          class="dot-plot"
          :viewBox="`0 0 ${PLOT.width} ${PLOT.height}`"
          aria-hidden="true"
        >
          <circle
            v-for="(p, i) in dots.rectified"
            :key="`rectified-${i}`"
            class="equation-dot"
            :cx="p.x"
            :cy="p.y"
            r="1.75"
          />
        </svg>
        <span class="bracket bracket-right" />
      </div>
      <Annotation
        class="term-annotation"
        style="--annotation-delay: 400ms"
        :show="stage >= 5"
        position="B"
      >
        Rectified Points
      </Annotation>
    </div>
  </div>
</template>

<style scoped>
.equation {
  position: absolute;
  top: -62px;
  right: 0;
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--fc-fg);
  font-family: "Times New Roman", Times, "Nimbus Roman No9 L", serif;
  opacity: 0;
  transform: translateX(24px);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.equation.active {
  opacity: 1;
  transform: translateX(0);
}

.matrix-group {
  position: relative;
  overflow: visible;
}

.matrix {
  position: relative;
  display: grid;
  place-items: center;
  height: 60px;
  overflow: visible;
}

.h-symbol {
  display: inline-block;
  margin: 0 20px;
  font-size: 34px;
  font-style: italic;
  font-weight: 800;
  line-height: 1;
}

.dot-plot {
  height: 45px;
  margin: 0 15px;
  overflow: visible;
}

.equation-dot {
  fill: currentColor;
  transition:
    cx var(--transition-duration) var(--transition-curve),
    cy var(--transition-duration) var(--transition-curve);
}

.equals {
  align-self: center;
  font-size: 30px;
  font-weight: 750;
}

.term-annotation {
  opacity: 0.8;
  line-height: 1;
  white-space: nowrap;
  font-style: italic;
  font-weight: 600;
}

.bracket {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 7px;
  border-color: currentColor;
}

.bracket-left {
  left: 0;
  border-top: 2px solid;
  border-bottom: 2px solid;
  border-left: 2px solid;
}

.bracket-right {
  right: 0;
  border-top: 2px solid;
  border-right: 2px solid;
  border-bottom: 2px solid;
}
</style>
