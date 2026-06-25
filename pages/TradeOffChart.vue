<script setup lang="ts">
import { computed, onScopeDispose, ref } from "vue";
import CameraModel from "components/CameraModel";
import CameraRay from "components/CameraRay";

const props = defineProps<{ stage: number }>();

// After stage 1 the side cameras switch from wide-angle to a narrow telephoto
// fovea — narrower fov and a longer lens barrel.
const telephoto = computed(() => props.stage >= 2);
const sideFov = computed(() => (telephoto.value ? 5 : 45));
const sideLens = computed(() => (telephoto.value ? 180 : 100));

// The looped ±20° pan from stage 3 on is a pure CSS animation on the
// `--rotation` custom property (see the scoped <style>); from stage 4 the
// `panning` class turns it on for both side cameras.
const panning = computed(() => props.stage >= 3);

// Camera descriptors: static placement & identity plus the current animated
// props (fov / lens). `rotate` is the base heading; the live pan is layered on
// in CSS. The center camera is the fixed wide context view.
const center = computed(() => ({
  fill: "#0A4",
  label: "C",
  x: 300,
  y: 950,
  rotate: 0,
  fov: 45,
  lens: 100,
}));
const left = computed(() => ({
  fill: "#A00",
  label: "L",
  fov: sideFov.value,
  lens: sideLens.value,
}));
const right = computed(() => ({
  fill: "#06A",
  label: "R",
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
});
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
      <CameraModel
        class="center-camera"
        :class="{ visible: stage >= 4 }"
        :transform="`translate(${center.x}, ${center.y}) rotate(${center.rotate})`"
        :fill="center.fill"
        :lens="center.lens"
        stroke="white"
        stroke-width="2"
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
        :class="{ panning }"
        :fill="left.fill"
        :lens="left.lens"
        stroke="white"
        stroke-width="2"
        :label="left.label"
      >
        <CameraRay :fov="left.fov" :resolution="5" :cursor="leftCursor" />
      </CameraModel>

      <CameraModel
        class="side-camera right-camera"
        :class="{ panning }"
        :fill="right.fill"
        :lens="right.lens"
        stroke="white"
        stroke-width="2"
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
    opacity 0.5s ease,
    translate 0.5s ease;
}

.center-camera.visible {
  opacity: 1;
  translate: 0;
}

/* Looped gaze sequence for the side cameras. The full positioning transform
   lives in CSS (instead of the SVG `transform` attribute) so the animated angles
   fold straight in. With `transform-origin: 0 0`, the transform reduces to
   `translate · rotate`: the camera rotates about its own optical center (the
   content origin) and is *then* placed, so it spins in place.

   Each camera has its own offset: `--pan-l` / `--pan-r` add to that camera's
   ±25° base (inward) heading. Sweeping both the same way pans left/right;
   moving them oppositely converges / diverges. */
@property --pan-l {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
@property --pan-r {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.side-camera {
  transform-origin: 0 0;
}

.left-camera {
  transform: translate(50px, 950px) rotate(calc(25deg + var(--pan-l)));
}

.right-camera {
  transform: translate(550px, 950px) rotate(calc(-25deg + var(--pan-r)));
}

/* 8 evenly-spaced stages (12.5% each). Each stage holds its position (~2/3 of
   the slot) then makes a snappy move to the next; the ease-out keeps the move
   quick-then-settle. Stage 7 (diverge) moves back to center right at the
   100%/0% seam, so the loop is continuous with no duplicate center. */
.side-camera.panning {
  animation: gaze 6s cubic-bezier(0.5, 1, 0.8, 1) infinite;
}

@keyframes gaze {
  /* 0 center */
  0% {
    --pan-l: 0deg;
    --pan-r: 0deg;
  }
  5% {
    --pan-l: 0deg;
    --pan-r: 0deg;
  }
  /* 1 pan left */
  12.5% {
    --pan-l: -18deg;
    --pan-r: -15deg;
  }
  17.5% {
    --pan-l: -18deg;
    --pan-r: -15deg;
  }
  /* 2 center */
  25% {
    --pan-l: 0deg;
    --pan-r: 0deg;
  }
  30% {
    --pan-l: 0deg;
    --pan-r: 0deg;
  }
  /* 3 pan right */
  37.5% {
    --pan-l: 15deg;
    --pan-r: 18deg;
  }
  42.5% {
    --pan-l: 15deg;
    --pan-r: 18deg;
  }
  /* 4 center */
  50% {
    --pan-l: 0deg;
    --pan-r: 0deg;
  }
  55% {
    --pan-l: 0deg;
    --pan-r: 0deg;
  }
  /* 5 converge (bottom) */
  62.5% {
    --pan-l: 20deg;
    --pan-r: -20deg;
  }
  67.5% {
    --pan-l: 20deg;
    --pan-r: -20deg;
  }
  /* 6 center */
  75% {
    --pan-l: 0deg;
    --pan-r: 0deg;
  }
  80% {
    --pan-l: 0deg;
    --pan-r: 0deg;
  }
  /* 7 diverge (top) */
  87.5% {
    --pan-l: -10deg;
    --pan-r: 10deg;
  }
  92.5% {
    --pan-l: -10deg;
    --pan-r: 10deg;
  }
  /* back to center at the seam */
  100% {
    --pan-l: 0deg;
    --pan-r: 0deg;
  }
}
</style>
