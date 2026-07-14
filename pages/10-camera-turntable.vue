<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useNav } from "@slidev/client";
import cameraVideo from "assets/360.webm";
import cameraReverseVideo from "assets/360-reverse.webm";
import { useStage } from "stores/stage";
import { TurntablePlayer } from "stores/turntablePlayer";
import type { Segment } from "stores/frameClip";

const fps = 60;
const totalFrames = 266;
const segmentByStage = new Map<number, Segment>([
  [2, { startFrame: 61, endFrame: 145 }],
  [3, { startFrame: 146, endFrame: 206 }],
]);
const enterSegment: Segment = { startFrame: 1, endFrame: 60 };
const leaveSegment: Segment = { startFrame: 207, endFrame: 266 };
const exitStage = 4;
// The forward-leave fade is hooked to decoded frames (see onLeaveFrame), not a
// wall-clock timer, so it stays locked to the visible turntable. It must finish
// a margin of frames before the clip's last frame so opacity is fully 0 before
// playback depletes — the slide only switches afterwards.
const leaveFadeEndFrame = leaveSegment.endFrame - 6;
const leaveFadeStartFrame = leaveFadeEndFrame - Math.round(0.7 * fps);

const canvasEl = ref<HTMLCanvasElement | null>(null);
const opacity = ref(0);
// While true the container's CSS opacity transition is disabled so per-frame
// opacity updates apply instantly (the 60fps frames supply the smoothness).
const frameDrivenFade = ref(false);
const isLeaving = ref(false);
const nav = useNav();

// The forward and reverse clips share one worker-owned OffscreenCanvas; only one
// plays at a time. Decode + blit run off the main thread. Reverse is a
// time-reversed re-encode so its frames decode forward too, avoiding the cost of
// decoding-from-keyframe for every backward step.
let player: TurntablePlayer | null = null;
let resolvePlayer!: () => void;
const playerReady = new Promise<void>((resolve) => (resolvePlayer = resolve));
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

// The stage watcher can fire before the canvas mounts; gate playback on the player.
async function getPlayer() {
  if (!player) await playerReady;
  return player;
}

async function stopAll() {
  await (await getPlayer())?.stopAll();
}

async function enterSlide() {
  isLeaving.value = false;
  const p = await getPlayer();
  if (!p) return;
  await p.stopAll();
  opacity.value = 0;
  await p.draw("forward", enterSegment.startFrame);
  await nextFrame();
  opacity.value = 1;
  void p.play("forward", enterSegment);
}

async function playStage(next: number, previous: number) {
  const forwardDir = next > previous;
  const segment = segmentByStage.get(forwardDir ? next : previous);
  if (!segment) return;
  const p = await getPlayer();
  if (!p) return;
  await p.stopAll();
  if (forwardDir) await p.play("forward", segment);
  else await p.play("reverse", reverseSegment(segment));
}

async function playLeaveTransition() {
  const p = await getPlayer();
  if (!p) return;
  await p.stopAll();
  await p.draw("forward", leaveSegment.startFrame);
  opacity.value = 1;
  await nextFrame();
  opacity.value = 0;
  void p.play("forward", leaveSegment);
}

// Map the frame currently painted to an opacity: hold at 1 until the fade
// window, ramp linearly to 0, and stay at 0 for the tail frames before the clip
// depletes.
function onLeaveFrame(frame: number) {
  const span = leaveFadeEndFrame - leaveFadeStartFrame;
  const progress = (leaveFadeEndFrame - frame) / span;
  opacity.value = Math.min(1, Math.max(0, progress));
}

async function leaveForward() {
  if (isLeaving.value) return;
  isLeaving.value = true;
  const p = await getPlayer();
  if (p) {
    await p.stopAll();
    await p.draw("forward", leaveSegment.startFrame);
    // Drive opacity from frame updates with the CSS transition disabled, so the
    // fade tracks the visible turntable and completes before the last frame.
    frameDrivenFade.value = true;
    opacity.value = 1;
    await nextFrame();
    await p.play("forward", leaveSegment, onLeaveFrame);
  }
  // Playback has depleted and the fade finished earlier; opacity is already 0.
  opacity.value = 0;
  await nav.nextSlide();
  cleanupTimer = window.setTimeout(() => {
    isLeaving.value = false;
    frameDrivenFade.value = false;
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
  if (canvasEl.value) {
    player = new TurntablePlayer(canvasEl.value, {
      forward: { url: cameraVideo, fps },
      reverse: { url: cameraReverseVideo, fps },
    });
    // Prefetch + demux both clips so the first frame is ready on entry.
    player.load("forward");
    player.load("reverse");
  }
  resolvePlayer();
});

onBeforeUnmount(() => {
  if (cleanupTimer !== undefined) window.clearTimeout(cleanupTimer);
  void stopAll();
  player?.dispose();
});
</script>

<template>
  <div
    class="turntable"
    :style="{ opacity, transition: frameDrivenFade ? 'none' : undefined }"
    :data-stage="stage"
  >
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
