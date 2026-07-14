<script setup lang="ts">
import { useIsSlideActive, useNav, useSlideContext } from "@slidev/client";
import { computed, nextTick, ref, watch } from "vue";
import calibrationProcessVideo from "assets/calibration.webm";

const video = ref<HTMLVideoElement>();
const isActive = useIsSlideActive();
const { next } = useNav();
const { $renderContext } = useSlideContext();
const isPreview = computed(() => $renderContext.value === "overview");
let playRun = 0;

function nextFrame() {
  if (typeof requestAnimationFrame === "undefined") return Promise.resolve();
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function finiteAnimations(root: Element | Document) {
  return (root.getAnimations?.({ subtree: true }) ?? []).filter((animation) => {
    const timing = animation.effect?.getTiming();
    return (
      timing?.iterations !== Infinity &&
      animation.playState !== "finished" &&
      animation.playState !== "idle"
    );
  });
}

async function waitForSlideSwitch() {
  await nextTick();
  await nextFrame();
  await nextFrame();

  if (typeof document === "undefined") return;
  const root = document.querySelector("#slideshow") ?? document.body;
  const animations = finiteAnimations(root);
  await Promise.allSettled(animations.map((animation) => animation.finished));
}

watch(
  [isActive, isPreview, video] as const,
  ([active, preview, el]) => {
    if (!el) return;

    const currentRun = ++playRun;
    if (!active || preview) {
      el.pause();
      return;
    }

    void (async () => {
      await waitForSlideSwitch();
      if (currentRun !== playRun || !isActive.value || isPreview.value) return;
      el.currentTime = 0;
      void el.play();
    })();
  },
  { immediate: true, flush: "post" },
);

function onEnded() {
  if (!isActive.value || isPreview.value) return;
  void next();
}
</script>

<template>
  <div class="calibration-process">
    <video
      ref="video"
      class="calibration-video"
      :src="calibrationProcessVideo"
      muted
      playsinline
      preload="auto"
      @ended="onEnded"
    />
  </div>
</template>

<style scoped>
.calibration-process {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--fc-bg);
}

.calibration-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
