<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { useNav } from "@slidev/client";
import cameraVideo from "assets/360.webm";
import cameraReverseVideo from "assets/360-reverse.webm";
import { useStage } from "stores/stage";

interface Segment {
  startFrame: number;
  endFrame: number;
}

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

const forwardVideoEl = ref<HTMLVideoElement | null>(null);
const reverseVideoEl = ref<HTMLVideoElement | null>(null);
const activeVideo = ref<"forward" | "reverse">("forward");
const opacity = ref(0);
const isLeaving = ref(false);
const nav = useNav();

let stopFrame: number | undefined;
let cleanupTimer: number | undefined;
let segmentToken = 0;

const stage = useStage(exitStage, { presist: false });

function startTime(segment: Segment) {
  return (segment.startFrame - 1) / fps;
}

function stopTime(segment: Segment) {
  return segment.endFrame / fps;
}

function finalFrameTime(segment: Segment) {
  return (segment.endFrame - 1) / fps;
}

function reverseSegment(segment: Segment): Segment {
  return {
    startFrame: totalFrames - segment.endFrame + 1,
    endFrame: totalFrames - segment.startFrame + 1,
  };
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function segmentDurationMs(segment: Segment) {
  return ((segment.endFrame - segment.startFrame + 1) / fps) * 1000;
}

function waitForMetadata(video: HTMLVideoElement) {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    video.addEventListener("loadedmetadata", () => resolve(), { once: true });
  });
}

function seekTo(video: HTMLVideoElement, time: number) {
  if (Math.abs(video.currentTime - time) < 0.005) {
    video.currentTime = time;
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    video.addEventListener("seeked", () => resolve(), { once: true });
    video.currentTime = time;
  });
}

function stopSegment() {
  segmentToken += 1;
  if (stopFrame !== undefined) {
    window.cancelAnimationFrame(stopFrame);
    stopFrame = undefined;
  }
  if (cleanupTimer !== undefined) {
    window.clearTimeout(cleanupTimer);
    cleanupTimer = undefined;
  }
  forwardVideoEl.value?.pause();
  reverseVideoEl.value?.pause();
}

function videoFor(direction: "forward" | "reverse") {
  return direction === "forward" ? forwardVideoEl.value : reverseVideoEl.value;
}

async function waitForVideo(direction: "forward" | "reverse") {
  let video = videoFor(direction);
  while (!video) {
    await nextFrame();
    video = videoFor(direction);
  }
  return video;
}

async function prepareSegment(
  segment: Segment,
  direction: "forward" | "reverse" = "forward",
) {
  const video = await waitForVideo(direction);

  video.pause();
  await waitForMetadata(video);
  await seekTo(video, startTime(segment));
}

async function playSegment(
  segment: Segment,
  holdFinalFrame = true,
  direction: "forward" | "reverse" = "forward",
) {
  stopSegment();

  const video = await waitForVideo(direction);

  const token = segmentToken;
  const stopAt = stopTime(segment);
  const holdAt = finalFrameTime(segment);
  const startAt = startTime(segment);

  video.pause();
  video.playbackRate = 1;
  await waitForMetadata(video);
  if (token !== segmentToken) return;
  await seekTo(video, startAt);
  if (token !== segmentToken) return;
  activeVideo.value = direction;

  try {
    await video.play();
  } catch {
    return;
  }
  if (token !== segmentToken) return;

  await new Promise<void>((resolve) => {
    const check = () => {
      if (token !== segmentToken) {
        resolve();
        return;
      }

      if (video.currentTime >= stopAt) {
        video.pause();
        if (holdFinalFrame) video.currentTime = holdAt;
        stopFrame = undefined;
        resolve();
        return;
      }

      stopFrame = window.requestAnimationFrame(check);
    };

    stopFrame = window.requestAnimationFrame(check);
  });
}

async function playPreparedSegment(
  video: HTMLVideoElement,
  segment: Segment,
  token: number,
  holdFinalFrame = true,
) {
  const stopAt = stopTime(segment);
  const holdAt = finalFrameTime(segment);

  try {
    await video.play();
  } catch {
    return;
  }
  if (token !== segmentToken) return;

  await new Promise<void>((resolve) => {
    const check = () => {
      if (token !== segmentToken) {
        resolve();
        return;
      }

      if (video.currentTime >= stopAt) {
        video.pause();
        if (holdFinalFrame) video.currentTime = holdAt;
        stopFrame = undefined;
        resolve();
        return;
      }

      stopFrame = window.requestAnimationFrame(check);
    };

    stopFrame = window.requestAnimationFrame(check);
  });
}

async function enterSlide() {
  isLeaving.value = false;
  stopSegment();
  opacity.value = 0;
  await prepareSegment(enterSegment);
  await nextFrame();
  opacity.value = 1;
  void playSegment(enterSegment);
}

async function playLeaveTransition() {
  stopSegment();

  const video = await waitForVideo("forward");

  const token = segmentToken;
  video.pause();
  video.playbackRate = 1;
  await waitForMetadata(video);
  if (token !== segmentToken) return;
  await seekTo(video, startTime(leaveSegment));
  if (token !== segmentToken) return;

  activeVideo.value = "forward";
  opacity.value = 1;
  await nextFrame();
  if (token !== segmentToken) return;

  opacity.value = 0;
  void playPreparedSegment(video, leaveSegment, token, false);
}

async function leaveForward() {
  if (isLeaving.value) return;
  isLeaving.value = true;
  await playLeaveTransition();
  await new Promise((resolve) =>
    window.setTimeout(resolve, slideSwitchDelayMs),
  );
  await nav.nextSlide();
  cleanupTimer = window.setTimeout(() => {
    isLeaving.value = false;
    stopSegment();
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
      else stopSegment();
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

    const segment = segmentByStage.get(next > previous ? next : previous);
    if (!segment) return;
    void runStageTransition(() =>
      next > previous
        ? playSegment(segment)
        : playSegment(reverseSegment(segment), true, "reverse"),
    );
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopSegment();
});
</script>

<template>
  <div class="turntable" :style="{ opacity }" :data-stage="stage">
    <video
      ref="forwardVideoEl"
      class="camera-video"
      :class="{ active: activeVideo === 'forward' }"
      :src="cameraVideo"
      muted
      playsinline
      preload="auto"
    />
    <video
      ref="reverseVideoEl"
      class="camera-video"
      :class="{ active: activeVideo === 'reverse' }"
      :src="cameraReverseVideo"
      muted
      playsinline
      preload="auto"
    />
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

.camera-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
}

.camera-video.active {
  opacity: 1;
}
</style>
