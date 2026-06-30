<script setup lang="ts">
import { computed, useId } from "vue";

const props = defineProps<{ stage: number }>();
const axisArrowBaseId = `axis-arrow-${useId()}`;

// Stage plan:
//   1  Cause column, undeformed supports.
//   2  Cause internal stage: calibration-rig flexure appears.
//   3  Cause internal stage: tripod flexure appears.
//   4  Effect column enters, axes separated and aligned.
//   5  Effect internal stage: frame origins overlap without rotation.
//   6  Effect internal stage: opposite warp rotation misaligns the scan.
//   7  Mitigation column enters; all columns split evenly.
const rigWarped = computed(() => props.stage >= 2);
const tripodWarped = computed(() => props.stage >= 3);
const effectIn = computed(() => props.stage >= 4);
const colocated = computed(() => props.stage >= 5);
const rotated = computed(() => props.stage >= 6);
const mitigationIn = computed(() => props.stage >= 7);

const WARP_DEG = 6;

// Calibration rig: a cantilever arm off a turntable post droops under the
// camera's weight, bending the arm and tilting the camera.
const RIG_DROOP = 20;
const rigArmEnd = computed(() => ({
  x: 372,
  y: 134 + (rigWarped.value ? RIG_DROOP : 0),
}));
const rigArmPath = computed(() => {
  const e = rigArmEnd.value;
  return rigWarped.value
    ? `M150,134 Q262,${134 + RIG_DROOP * 1.5} ${e.x},${e.y}`
    : `M150,134 L${e.x},${e.y}`;
});
const rigCamTransform = computed(
  () =>
    `translate(${rigArmEnd.value.x}px, ${rigArmEnd.value.y}px) rotate(${
      rigWarped.value ? WARP_DEG : 0
    }deg)`,
);

// Tripod: the head flexes under load, tilting the camera the other way.
const tripodCamTransform = computed(
  () => `translate(300px, 360px) rotate(${tripodWarped.value ? -WARP_DEG : 0}deg)`,
);

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
          <svg class="structure" viewBox="0 0 600 540" overflow="visible">
          <defs>
            <marker
              id="warp-arrow"
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

          <!-- Panel: calibration rig -->
          <text class="panel-title" x="28" y="34">On the calibration rig</text>

          <ellipse class="rig-turntable" cx="150" cy="236" rx="86" ry="20" />
          <path
            class="rig-spin"
            d="M96,214 A70 24 0 0 1 204,214"
            marker-end="url(#warp-arrow)"
          />
          <line class="support" x1="150" y1="236" x2="150" y2="134" />

          <!-- Undeformed reference + the deformed (drooping) arm. -->
          <path class="reference" d="M150,134 L372,134" />
          <path
            class="support arm"
            :d="rigArmPath"
            :style="{ d: `path('${rigArmPath}')` }"
          />

          <g class="ghost" :class="{ show: rigWarped }">
            <g transform="translate(372 134)">
              <rect class="cam-body" x="-30" y="-19" width="60" height="38" rx="6" />
              <rect class="cam-lens" x="22" y="-11" width="14" height="22" rx="3" />
            </g>
          </g>
          <g class="cam" :style="{ transform: rigCamTransform }">
            <rect class="cam-body" x="-30" y="-19" width="60" height="38" rx="6" />
            <rect class="cam-lens" x="22" y="-11" width="14" height="22" rx="3" />
          </g>

          <line
            class="load"
            :x1="rigArmEnd.x"
            :y1="rigArmEnd.y + 26"
            :x2="rigArmEnd.x"
            :y2="rigArmEnd.y + 74"
            marker-end="url(#warp-arrow)"
          />
          <text class="load-label" :x="rigArmEnd.x + 12" :y="rigArmEnd.y + 60">
            load
          </text>
          <text class="warp-label" :class="{ show: rigWarped }" x="430" y="150">
            cantilever flexure → θ
          </text>

          <!-- Panel: tripod -->
          <text class="panel-title" x="28" y="318">On a tripod</text>

          <line class="ground" x1="180" y1="500" x2="420" y2="500" />
          <line class="support leg-back" x1="300" y1="372" x2="300" y2="500" />
          <line class="support" x1="300" y1="372" x2="232" y2="500" />
          <line class="support" x1="300" y1="372" x2="368" y2="500" />
          <rect class="tripod-head" x="262" y="362" width="76" height="14" rx="4" />

          <g class="ghost" :class="{ show: tripodWarped }">
            <g transform="translate(300 360)">
              <rect class="cam-body" x="-30" y="-19" width="60" height="38" rx="6" />
              <rect class="cam-lens" x="22" y="-11" width="14" height="22" rx="3" />
            </g>
          </g>
          <g class="cam" :style="{ transform: tripodCamTransform }">
            <rect class="cam-body" x="-30" y="-19" width="60" height="38" rx="6" />
            <rect class="cam-lens" x="22" y="-11" width="14" height="22" rx="3" />
          </g>

          <line
            class="load"
            x1="300"
            y1="388"
            x2="300"
            y2="436"
            marker-end="url(#warp-arrow)"
          />
          <text class="load-label" x="312" y="422">load</text>
          <text class="warp-label" :class="{ show: tripodWarped }" x="360" y="350">
            head flexure → θ
          </text>
          </svg>
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

.structure,
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

/* ---- Structural-support diagram ---- */
.panel-title {
  fill: var(--fc-fg);
  font-size: 18px;
  font-weight: 600;
  font-variant: small-caps;
  letter-spacing: 0.04em;
}

.support {
  stroke: var(--fc-fg);
  stroke-width: 7;
  stroke-linecap: round;
  fill: none;
}

.arm {
  transition: d var(--transition-duration) var(--transition-curve);
}

.leg-back {
  opacity: 0.4;
  stroke-dasharray: 4 8;
}

.reference {
  fill: none;
  stroke: color-mix(in srgb, var(--fc-fg) 40%, transparent);
  stroke-width: 2;
  stroke-dasharray: 6 8;
}

.rig-turntable {
  fill: color-mix(in srgb, var(--fc-fg) 10%, transparent);
  stroke: var(--fc-fg);
  stroke-width: 3;
}

.rig-spin {
  fill: none;
  stroke: color-mix(in srgb, var(--fc-fg) 55%, transparent);
  stroke-width: 2.5;
}

.tripod-head {
  fill: color-mix(in srgb, var(--fc-fg) 14%, transparent);
  stroke: var(--fc-fg);
  stroke-width: 3;
}

.ground {
  stroke: color-mix(in srgb, var(--fc-fg) 55%, transparent);
  stroke-width: 3;
  stroke-linecap: round;
}

.cam {
  transform-box: view-box;
  transform-origin: 0 0;
  transition: transform var(--transition-duration) var(--transition-curve);
}

.cam-body {
  fill: color-mix(in srgb, var(--fc-fg) 12%, var(--fc-bg));
  stroke: var(--fc-fg);
  stroke-width: 3;
}

.cam-lens {
  fill: color-mix(in srgb, var(--fc-fg) 28%, var(--fc-bg));
  stroke: var(--fc-fg);
  stroke-width: 3;
}

.ghost {
  opacity: 0;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.ghost.show {
  opacity: 0.5;
}

.ghost .cam-body,
.ghost .cam-lens {
  fill: none;
  stroke: color-mix(in srgb, var(--fc-fg) 50%, transparent);
  stroke-width: 2;
  stroke-dasharray: 5 6;
}

.load {
  stroke: var(--red-2);
  stroke-width: 4;
  stroke-linecap: round;
}

.load-label {
  fill: var(--red-2);
  font: italic 700 18px "Times New Roman", serif;
}

.warp-label {
  fill: var(--fc-fg);
  font-size: 17px;
  font-weight: 600;
  opacity: 0;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.warp-label.show {
  opacity: 0.85;
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
