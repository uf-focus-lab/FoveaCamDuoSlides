<script setup lang="ts">
import { computed, useId } from "vue";
import OnRig from "assets/drift/on-rig.svg";
import OnTripod from "assets/drift/on-tripod.svg";

const props = defineProps<{ stage: number }>();
const axisArrowBaseId = `axis-arrow-${useId()}`;

// Stage plan:
//   1  Cause column, calibration-rig figure visible.
//   2  Cause internal stage: tripod figure reveals in the side-by-side layout.
//   3  Cause internal stage: force arrows line-draw onto both figures.
//   4  Effect column enters, cause figures stack as the cause column narrows.
//   5  Effect internal stage: frame origins overlap without rotation.
//   6  Effect internal stage: opposite warp rotation misaligns the scan.
//   7  Mitigation column enters; all columns split evenly.
const tripodFigureIn = computed(() => props.stage >= 2);
const causeArrowsIn = computed(() => props.stage >= 3);
const effectIn = computed(() => props.stage >= 4);
const colocated = computed(() => props.stage >= 5);
const rotated = computed(() => props.stage >= 6);
const mitigationIn = computed(() => props.stage >= 7);

// Axes demo: two camera frames whose synchronized FoV scan only diverges once
// their origins are first overlapped, then rotated by opposite warp.
const frames = [
  { side: "left", color: "var(--camera-left)" },
  { side: "right", color: "var(--camera-right)" },
] as const;
const SEP = { left: { x: 145, y: 250 }, right: { x: 455, y: 250 } };
const OVERLAP = { x: 300, y: 250 };
const ROT = 6;
function axisArrowId(side: "left" | "right") {
  return `${axisArrowBaseId}-${side}`;
}

function frameTransform(side: "left" | "right") {
  const p = colocated.value ? OVERLAP : SEP[side];
  const rot = rotated.value ? (side === "left" ? -ROT : ROT) : 0;
  return `translate(${p.x}px, ${p.y}px) rotate(${rot}deg)`;
}
</script>

<template>
  <section class="rotational">
    <div
      class="rot-cols"
      :class="{
        'effect-in': effectIn,
        'mitigation-in': mitigationIn,
      }"
    >
      <!-- Cause: how the camera is supported, the load, and the warp. -->
      <article class="drift-col cause-col">
        <div class="col-body">
          <div class="cause-figures">
            <OnRig
              class="cause-svg rig-figure active"
              :class="{ 'arrows-in': causeArrowsIn }"
            />
            <OnTripod
              class="cause-svg tripod-figure"
              :class="{ active: tripodFigureIn, 'arrows-in': causeArrowsIn }"
            />
          </div>
        </div>
        <h2 class="col-title">Cause</h2>
      </article>

      <div class="col-divider effect-divider" aria-hidden="true"></div>

      <!-- Effect: synchronized scan that misaligns once the frames warp apart. -->
      <article class="drift-col effect-col" :aria-hidden="!effectIn">
        <div class="col-body axes-body" :class="{ merged: colocated }">
          <svg class="axes" viewBox="0 0 600 460" overflow="visible">
          <g
            v-for="f in frames"
            :key="f.side"
            class="frame"
            :style="{ transform: frameTransform(f.side), color: f.color }"
          >
            <defs>
              <marker
                :id="axisArrowId(f.side)"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0,1 L9,5 L0,9 Z" fill="currentColor" />
              </marker>
            </defs>
            <line
              class="axis"
              x1="-124"
              y1="0"
              x2="124"
              y2="0"
              :marker-end="`url(#${axisArrowId(f.side)})`"
            />
            <line
              class="axis"
              x1="0"
              y1="124"
              x2="0"
              y2="-124"
              :marker-end="`url(#${axisArrowId(f.side)})`"
            />
            <circle class="axis-o" :class="{ hollow: f.side === 'right' }" r="4.5" />
            <g class="fov">
              <rect class="fov-box" x="-40" y="-30" width="80" height="60" rx="7" />
              <line class="fov-x" x1="-11" y1="0" x2="11" y2="0" />
              <line class="fov-x" x1="0" y1="-11" x2="0" y2="11" />
            </g>
          </g>
          </svg>
        </div>
        <h2 class="col-title">Effect</h2>
      </article>

      <div class="col-divider mitigation-divider" aria-hidden="true"></div>

      <article class="drift-col mitigation-col" :aria-hidden="!mitigationIn">
        <div class="mitigation-body">
          <p>Rigid metal structural components reduce load-induced frame rotation.</p>
          <p>One-shot field calibration corrects residual drift before capture.</p>
        </div>
        <h2 class="col-title">Mitigation</h2>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
.rotational {
  width: 100%;
  height: 100%;
  color: var(--fc-fg);
}

.rot-cols {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.drift-col {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-width: 0;
  padding: 0 0.65rem;
  overflow: visible;
  opacity: 0;
  transition:
    left var(--transition-duration) var(--transition-curve),
    width var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve);
}

.cause-col {
  left: 0;
  width: 100%;
  opacity: 1;
}

.effect-col {
  left: 100%;
  width: calc(100% * 2 / 3);
}

.mitigation-col {
  left: 100%;
  width: calc(100% / 3);
}

.effect-col,
.mitigation-col {
  pointer-events: none;
}

.col-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 2;
  width: 1px;
  margin: 0;
  background: color-mix(in srgb, var(--fc-fg) 42%, transparent);
  opacity: 0;
  transition:
    left var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve);
}

.effect-divider {
  left: 100%;
}

.mitigation-divider {
  left: 100%;
}

.rot-cols.effect-in .cause-col {
  width: calc(100% / 3);
}

.rot-cols.effect-in .effect-col {
  left: calc(100% / 3);
}

.rot-cols.effect-in .effect-divider {
  left: calc(100% / 3);
  opacity: 1;
}

.rot-cols.mitigation-in .mitigation-divider {
  left: calc(100% * 2 / 3);
  opacity: 1;
}

.rot-cols.effect-in .effect-col,
.rot-cols.mitigation-in .mitigation-col {
  opacity: 1;
  pointer-events: auto;
}

.rot-cols.mitigation-in .effect-col {
  width: calc(100% / 3);
}

.rot-cols.mitigation-in .mitigation-col {
  left: calc(100% * 2 / 3);
}

.col-title {
  flex: 0 0 auto;
  margin: 0.65rem 0 0;
  color: var(--fc-fg);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
  text-align: center;
}

.col-body {
  flex: 1 1 auto;
  min-height: 0;
}

.cause-figures {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.cause-svg {
  --green: #2fbf71;
  --red: var(--red-2, #ef4444);
  position: absolute;
  top: 0;
  display: block;
  box-sizing: border-box;
  height: 100%;
  color: var(--fc-fg);
  overflow: visible;
  opacity: 0;
  transform: translateY(18px) scale(0.98);
  transition:
    top var(--transition-duration) var(--transition-curve),
    left var(--transition-duration) var(--transition-curve),
    width var(--transition-duration) var(--transition-curve),
    height var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.cause-svg.active {
  opacity: 1;
  transform: none;
}

.rig-figure {
  left: 0;
  width: calc(50% - 0.55rem);
}

.tripod-figure {
  left: calc(50% + 0.55rem);
  width: calc(50% - 0.55rem);
}

.rot-cols.effect-in .rig-figure,
.rot-cols.effect-in .tripod-figure {
  left: 0;
  width: 100%;
  height: calc(50% - 0.45rem);
}

.rot-cols.effect-in .rig-figure {
  top: 0;
}

.rot-cols.effect-in .tripod-figure {
  top: calc(50% + 0.45rem);
}

.cause-svg :deep(.support),
.cause-svg :deep(.gravity) {
  stroke-dasharray: 64;
  stroke-dashoffset: 64;
  opacity: 0;
  transition:
    stroke-dashoffset var(--transition-duration) var(--transition-curve),
    opacity 1ms linear var(--transition-duration);
}

.cause-svg :deep(marker path) {
  opacity: 0;
  transform: translateX(-4px);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.cause-svg.arrows-in :deep(.support),
.cause-svg.arrows-in :deep(.gravity) {
  stroke-dashoffset: 0;
  opacity: 1;
  transition:
    stroke-dashoffset var(--transition-duration) var(--transition-curve),
    opacity 1ms linear;
}

.cause-svg.arrows-in :deep(marker path) {
  opacity: 1;
  transform: translateX(0);
}

.axes-body {
  --axes-drawing-width: 560px;
  align-self: center;
  width: 100%;
  max-width: var(--axes-drawing-width);
  margin-inline: 0;
  overflow: visible;
  transition:
    max-width var(--transition-duration) var(--transition-curve),
    margin-inline var(--transition-duration) var(--transition-curve);
}

.axes-body.merged {
  max-width: 380px;
  margin-inline: -2.5rem;
}

.axes-body .axes {
  transition:
    width var(--transition-duration) var(--transition-curve),
    margin-inline var(--transition-duration) var(--transition-curve);
}

.axes-body.merged .axes {
  width: var(--axes-drawing-width);
  max-width: none;
  margin-inline: calc((100% - var(--axes-drawing-width)) / 2);
}

.axes {
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--fc-fg);
  isolation: isolate;
}

.mitigation-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
  gap: 1.3rem;
  min-height: 0;
  padding: 0 0.35rem;
  color: var(--fc-fg);
  font-size: clamp(1.1rem, 2vw, 1.55rem);
  font-weight: 650;
  line-height: 1.28;
}

.mitigation-body p {
  margin: 0;
}

/* ---- Axes misalignment demo ---- */
.frame {
  transform-box: view-box;
  transform-origin: 0 0;
  mix-blend-mode: var(--blend);
  transition: transform var(--transition-duration) var(--transition-curve);
}

.axis {
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  opacity: 0.85;
}

.axis-o {
  fill: currentColor;
}

.axis-o.hollow {
  fill: var(--fc-bg);
  stroke: currentColor;
  stroke-width: 2.5;
}

.fov {
  transform-box: view-box;
  transform-origin: 0 0;
  animation: fov-grid-scan 5.4s var(--transition-curve) infinite alternate;
}

.fov-box {
  fill: color-mix(in srgb, currentColor 16%, transparent);
  stroke: currentColor;
  stroke-width: 3;
}

.fov-x {
  stroke: currentColor;
  stroke-width: 2;
  opacity: 0.7;
  stroke-linecap: round;
}

@keyframes fov-grid-scan {
  0% {
    transform: translate(-78px, -78px);
  }
  12.5% {
    transform: translate(0, -78px);
  }
  25% {
    transform: translate(78px, -78px);
  }
  37.5% {
    transform: translate(78px, 0);
  }
  50% {
    transform: translate(0, 0);
  }
  62.5% {
    transform: translate(-78px, 0);
  }
  75% {
    transform: translate(-78px, 78px);
  }
  87.5% {
    transform: translate(0, 78px);
  }
  100% {
    transform: translate(78px, 78px);
  }
}

</style>
