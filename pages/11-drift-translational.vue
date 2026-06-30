<script setup lang="ts">
import { computed } from "vue";
import DimAnnotation from "components/DimAnnotation.vue";
import Marker from "components/Marker.vue";

const props = defineProps<{ stage: number }>();

// Two side cameras (the center wide view is omitted). Each foveates its own
// marker on the tri-marker board: left → id 1, right → id 2. Voltage drift
// slides each fovea off its origin by an independent direction and amount.
const STATIONS = [
  {
    side: "left",
    id: 1,
    color: "var(--camera-left)",
    ox: 250,
    oy: 208,
    drift: { x: -20, y: -50 },
  },
  {
    side: "right",
    id: 2,
    color: "var(--camera-right)",
    ox: 570,
    oy: 208,
    drift: { x: 60, y: 20 },
  },
] as const;

type Station = (typeof STATIONS)[number];
const FRAME = { halfW: 128, halfH: 96 };
const VIEW_MARGIN_X = 40;
const frameBounds = {
  x1: Math.min(...STATIONS.map((s) => s.ox - FRAME.halfW)) - VIEW_MARGIN_X,
  y1: Math.min(...STATIONS.map((s) => s.oy - FRAME.halfH)),
  x2: Math.max(...STATIONS.map((s) => s.ox + FRAME.halfW)) + VIEW_MARGIN_X,
  y2: Math.max(...STATIONS.map((s) => s.oy + FRAME.halfH)),
};
const frameViewBox = `${frameBounds.x1} ${frameBounds.y1} ${
  frameBounds.x2 - frameBounds.x1
} ${frameBounds.y2 - frameBounds.y1}`;

// Stage plan (every step is a manual, non-transient advance):
//   1  Aligned — each fovea sits on its dashed origin frame.
//   2  Drift animates in — frames slide off, by a different amount each.
//   3  Markers fade + rise into view at each true origin.
//   4  Snap back — frames re-center on their markers.
//   5  Field one-shot incremental calibration statement appears.
const corrected = computed(() => props.stage >= 4);
const drifted = computed(() => props.stage >= 2 && !corrected.value);
const markersIn = computed(() => props.stage >= 3);
const statementIn = computed(() => props.stage >= 5);

function foveaTransform(station: Station) {
  const off = drifted.value ? station.drift : { x: 0, y: 0 };
  return `translate(${off.x}px, ${off.y}px)`;
}

function driftArrow(station: Station) {
  const start =
    station.side === "left"
      ? { x: FRAME.halfW, y: FRAME.halfH }
      : { x: -FRAME.halfW, y: -FRAME.halfH };
  const off = drifted.value ? station.drift : { x: 0, y: 0 };
  const end = { x: start.x + off.x, y: start.y + off.y };
  return { start, end };
}
</script>

<template>
  <section class="translational">
    <figure class="scene">
      <svg class="scene-svg" :viewBox="frameViewBox" overflow="visible">
        <g
          v-for="s in STATIONS"
          :key="s.side"
          :transform="`translate(${s.ox} ${s.oy})`"
        >
          <!-- Bottom layer: the marker, fading + rising in at stage 2. -->
          <g class="marker-wrap" :class="{ in: markersIn }">
            <Marker :id="s.id" :size="60" />
          </g>

          <!-- Dashed pseudo-origin frame: where the fovea should sit. -->
          <rect
            class="origin-frame"
            :x="-FRAME.halfW"
            :y="-FRAME.halfH"
            :width="FRAME.halfW * 2"
            :height="FRAME.halfH * 2"
          />

          <!-- Gray dashed circle + crosshair (ticks outside the circle)
               marking the original position. -->
          <g class="origin-mark" aria-hidden="true">
            <circle cx="0" cy="0" r="26" />
            <line x1="32" y1="0" x2="52" y2="0" />
            <line x1="-32" y1="0" x2="-52" y2="0" />
            <line x1="0" y1="32" x2="0" y2="52" />
            <line x1="0" y1="-32" x2="0" y2="-52" />
          </g>
          <!-- Top layer: the 4:3 foveated view, drifting then snapping back. -->
          <g
            class="fovea"
            :class="{ aligned: corrected }"
            :style="{ transform: foveaTransform(s), color: s.color }"
          >
            <rect
              class="fovea-box"
              :x="-FRAME.halfW"
              :y="-FRAME.halfH"
              :width="FRAME.halfW * 2"
              :height="FRAME.halfH * 2"
            />
            <line class="fovea-x" x1="-16" y1="0" x2="16" y2="0" />
            <line class="fovea-x" x1="0" y1="-16" x2="0" y2="16" />
          </g>
          <DimAnnotation
            class="drift-arrow"
            :class="{ in: drifted }"
            :a="[driftArrow(s).start.x, driftArrow(s).start.y]"
            :b="[driftArrow(s).end.x, driftArrow(s).end.y]"
            :show-bar="false"
            fill="var(--warning-2)"
            label="Drift"
          />
          <text class="station-label" x="0" y="150">Fovea {{ s.side }}</text>
        </g>
      </svg>
      <p class="field-statement" :class="{ in: statementIn }">
        One-shot incremental calibration<br />
        can be performed in the field.
      </p>
    </figure>
  </section>
</template>

<style scoped lang="scss">
.translational {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  width: 100%;
  height: 100%;
}

.block-sub {
  margin: 0;
  max-width: 60ch;
  font-size: 1.05rem;
  line-height: 1.45;
  color: var(--fc-muted);
}

.scene {
  position: relative;
  margin: 0;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.scene-svg {
  width: 100%;
  max-width: 50vw;
  flex: 1 1 auto;
  min-height: 0;
  overflow: visible;
}

.field-statement {
  margin: 0;
  color: var(--fc-fg);
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.35;
  text-align: center;
  opacity: 0;
  transform: translateY(18px);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.field-statement.in {
  opacity: 1;
  transform: none;
}

.marker-wrap {
  transform-box: view-box;
  transform-origin: 0 0;
  opacity: 0;
  transform: translateY(46px);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.marker-wrap.in {
  opacity: 1;
  transform: translateY(0);
}

.origin-frame {
  fill: none;
  stroke: color-mix(in srgb, var(--fc-fg) 40%, transparent);
  stroke-width: 3;
  stroke-dasharray: 9 9;
}

.origin-mark circle,
.origin-mark line {
  fill: none;
  stroke: color-mix(in srgb, var(--fc-fg) 42%, transparent);
  stroke-width: 2;
  stroke-dasharray: 6 6;
  stroke-linecap: round;
}

.fovea {
  transform-box: view-box;
  transform-origin: 0 0;
  color: var(--camera-center);
  transition: transform var(--transition-duration) var(--transition-curve);
}

.fovea-box {
  fill: color-mix(in srgb, currentColor 14%, transparent);
  stroke: currentColor;
  stroke-width: 4;
  transition: stroke-width var(--transition-duration) var(--transition-curve);
}

.fovea.aligned .fovea-box {
  stroke-width: 5;
}

.fovea-x {
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
}

.drift-arrow {
  --dim-weight: 4;
  --dim-font: 22px;
  opacity: 0;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.drift-arrow.in {
  opacity: 1;
}

.station-label {
  fill: var(--fc-muted);
  font-size: 20px;
  font-variant: small-caps;
  letter-spacing: 0.05em;
  text-anchor: middle;
}

.scene-caption {
  flex: 0 0 auto;
  text-align: center;
  font-size: 1.02rem;
  line-height: 1.4;
  max-width: 52ch;
}
</style>
