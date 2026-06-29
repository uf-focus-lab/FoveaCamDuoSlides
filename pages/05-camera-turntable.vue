<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useNav } from "@slidev/client";
import cameraVideo from "assets/360.webm";
import cameraReverseVideo from "assets/360-reverse.webm";
import { useStage } from "stores/stage";
import { FrameClip, type Segment } from "stores/frameClip";

const fps = 60;
const totalFrames = 266;
const segmentByStage = new Map<number, Segment>([
  [2, { startFrame: 61, endFrame: 145 }],
  [3, { startFrame: 146, endFrame: 206 }],
]);
const enterSegment: Segment = { startFrame: 1, endFrame: 60 };
const leaveSegment: Segment = { startFrame: 207, endFrame: 266 };
const exitStage = 4;
const slideSwitchDelayMs = 1000;

const canvasEl = ref<HTMLCanvasElement | null>(null);
const opacity = ref(0);
const isLeaving = ref(false);
const nav = useNav();

// The forward and reverse clips share one visible canvas; only one plays at a
// time. Reverse is a time-reversed re-encode so its frames decode forward too,
// avoiding the cost of decoding-from-keyframe for every backward step.
const forward = new FrameClip(cameraVideo, { fps });
const reverse = new FrameClip(cameraReverseVideo, { fps });

let ctx: CanvasRenderingContext2D | null = null;
let resolveCtx!: () => void;
const ctxReady = new Promise<void>((resolve) => (resolveCtx = resolve));
let cleanupTimer: number | undefined;

const stage = useStage(exitStage, { presist: false });

function reverseSegment(segment: Segment): Segment {
  return {
    startFrame: totalFrames - segment.endFrame + 1,
    endFrame: totalFrames - segment.startFrame + 1,
  };
}

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function segmentDurationMs(segment: Segment) {
  return ((segment.endFrame - segment.startFrame + 1) / fps) * 1000;
}

// The stage watcher can fire before the canvas mounts; gate playback on the ctx.
async function waitForCtx() {
  if (!ctx) await ctxReady;
  return ctx;
}

function stopAll() {
  return Promise.all([forward.stop(), reverse.stop()]);
}

async function enterSlide() {
  isLeaving.value = false;
  await stopAll();
  opacity.value = 0;
  const c = await waitForCtx();
  if (!c) return;
  await forward.drawFrame(c, enterSegment.startFrame);
  await nextFrame();
  opacity.value = 1;
  void forward.playSegment(c, enterSegment);
}

async function playStage(next: number, previous: number) {
  const forwardDir = next > previous;
  const segment = segmentByStage.get(forwardDir ? next : previous);
  if (!segment) return;
  const c = await waitForCtx();
  if (!c) return;
  await stopAll();
  if (forwardDir) await forward.playSegment(c, segment);
  else await reverse.playSegment(c, reverseSegment(segment));
}

async function playLeaveTransition() {
  await stopAll();
  const c = await waitForCtx();
  if (!c) return;
  await forward.drawFrame(c, leaveSegment.startFrame);
  opacity.value = 1;
  await nextFrame();
  opacity.value = 0;
  void forward.playSegment(c, leaveSegment);
}

async function leaveForward() {
  if (isLeaving.value) return;
  isLeaving.value = true;
  await playLeaveTransition();
  await new Promise((resolve) => window.setTimeout(resolve, slideSwitchDelayMs));
  await nav.nextSlide();
  cleanupTimer = window.setTimeout(() => {
    isLeaving.value = false;
    void stopAll();
  }, segmentDurationMs(leaveSegment));
}

async function runStageTransition(action: () => Promise<void>) {
  stage.busy = true;
  try {
    await action();
  } finally {
    if (stage.value !== 0 && !isLeaving.value) stage.busy = false;
  }
}

watch(
  stage,
  (next, previous = 0) => {
    if (next === 0) {
      if (previous > 0 && !isLeaving.value) void playLeaveTransition();
      else void stopAll();
      return;
    }

    if (previous === 0 && next === 1) {
      void runStageTransition(enterSlide);
      return;
    }

    if (isLeaving.value) return;
    if (next === exitStage) {
      void runStageTransition(leaveForward);
      return;
    }

    void runStageTransition(() => playStage(next, previous));
  },
  { immediate: true },
);

onMounted(() => {
  ctx = canvasEl.value?.getContext("2d", { alpha: false }) ?? null;
  resolveCtx();
  // Prefetch + demux both clips so the first frame is ready on entry.
  void forward.load();
  void reverse.load();
});

onBeforeUnmount(() => {
  if (cleanupTimer !== undefined) window.clearTimeout(cleanupTimer);
  void stopAll();
});
</script>

<template>
  <div class="turntable" :style="{ opacity }" :data-stage="stage">
    <canvas ref="canvasEl" class="camera-canvas" />
  </div>
</template>

<style scoped lang="scss">
.turntable {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  transition: opacity var(--transition-duration) var(--transition-curve);
  will-change: opacity;
}

.camera-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
