<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from "vue";

// Inline googly eyes (elliptical) on a rounded-rect face, pupils tracking the
// cursor. Sized in `em` so it flows inside text — `height` is the overall
// inline height (face included); the eyes/pupils derive from it.
const props = withDefaults(
  defineProps<{ height?: string; aspect?: number; gap?: string }>(),
  { height: "1.4em", aspect: 0.72, gap: "0.16em" },
);

// Visual proportions, kept in sync between CSS and the pupil-clamp math.
const PUPIL = 0.5; // pupil diameter / eye width
const EYE_STROKE = 0.06; // eye rim width / eye height
const MARGIN = 0.18; // white ring kept around the pupil / pupil diameter

const leftEye = ref<HTMLElement | null>(null);
const rightEye = ref<HTMLElement | null>(null);
const leftPupil = reactive({ transform: "translate(0px, 0px)" });
const rightPupil = reactive({ transform: "translate(0px, 0px)" });

let mouseX = 0;
let mouseY = 0;
let frame = 0;

function pupilTransform(eye: HTMLElement | null): string {
  if (!eye) return "translate(0px, 0px)";
  // offsetWidth/Height are the *unscaled* (em-resolved) layout size; the rect
  // is the on-screen size — their ratio is Slidev's canvas scale. This keeps
  // the math correct regardless of how the component is sized (px or em).
  const w = eye.offsetWidth;
  const h = eye.offsetHeight;
  if (!w) return "translate(0px, 0px)";
  const rect = eye.getBoundingClientRect();
  const scale = rect.width / w;

  const pupil = w * PUPIL;
  const inset = h * EYE_STROKE + pupil * MARGIN;
  const ax = w / 2 - pupil / 2 - inset;
  const ay = h / 2 - pupil / 2 - inset;
  if (ax <= 0 || ay <= 0) return "translate(0px, 0px)";

  const dx = (mouseX - (rect.left + rect.width / 2)) / scale;
  const dy = (mouseY - (rect.top + rect.height / 2)) / scale;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) return "translate(0px, 0px)";

  const ux = dx / dist;
  const uy = dy / dist;
  const tMax = 1 / Math.hypot(ux / ax, uy / ay); // ellipse boundary
  const d = Math.min(dist, tMax);
  return `translate(${ux * d}px, ${uy * d}px)`;
}

function update() {
  frame = 0;
  leftPupil.transform = pupilTransform(leftEye.value);
  rightPupil.transform = pupilTransform(rightEye.value);
}

function onMouseMove(e: MouseEvent) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (!frame) frame = requestAnimationFrame(update); // throttle to one update/frame
}

onMounted(() => window.addEventListener("mousemove", onMouseMove, { passive: true }));
onUnmounted(() => {
  window.removeEventListener("mousemove", onMouseMove);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<template>
  <!-- height drives the whole inline badge; eyes are 0.76× of it (rest is face
       padding + borders) so the element is exactly `height` tall on the line. -->
  <span
    class="face"
    :style="{
      gap,
      '--h': height,
      '--eye-h': `calc(${height} * 0.76)`,
      '--eye-w': `calc(${height} * 0.76 * ${aspect})`,
    }"
  >
    <span class="eye" ref="leftEye"><span class="pupil" :style="leftPupil" /></span>
    <span class="eye" ref="rightEye"><span class="pupil" :style="rightPupil" /></span>
  </span>
</template>

<style scoped>
.face {
  display: inline-flex;
  align-items: center;
  line-height: 0;
  vertical-align: 0.2em; /* sit on the text baseline; tweak per use */
  box-sizing: border-box;
  padding: calc(var(--h) * 0.08);
  border: calc(var(--h) * 0.04) solid #111;
  border-radius: calc(var(--h) * 0.3);
  background: rgb(244 244 245 / 0.4); /* 40% — slide shows through */
  box-shadow: 0 0.05em 0.16em rgb(0 0 0 / 0.18);
}
.eye {
  box-sizing: border-box;
  width: var(--eye-w);
  height: var(--eye-h);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #fff;
  border: calc(var(--eye-h) * 0.06) solid #111;
  border-radius: 50%; /* non-square box → ellipse */
}
.pupil {
  width: calc(var(--eye-w) * 0.5);
  height: calc(var(--eye-w) * 0.5);
  background: #111;
  border-radius: 50%;
  transition: transform 0.05s ease-out; /* smooths micro-stutter */
  will-change: transform;
}
</style>
