<script setup lang="ts">
import { useIsSlideActive } from "@slidev/client";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useStage } from "stores/stage";
import centerVideo from "assets/tracking/JacobAtHyatt_center.mp4";
import leftVideo from "assets/tracking/JacobAtHyatt_left-fovea.mp4";
import rightVideo from "assets/tracking/JacobAtHyatt_right-fovea.mp4";

const isActive = useIsSlideActive();

// Clip windows in seconds on the untrimmed JacobAtHyatt_* timeline (chapters in
// assets/tracking/README.md): calm = walking left/right, aggressive = jumping.
// A trim + re-encode pass on these clips is in flight — when the new assets
// land, point the imports at them and shift these windows onto their timeline.
const clips = {
  calm: { start: 3, stop: 31 },
  aggressive: { start: 47, stop: 60 },
};

// 1 wide center plays → 2 center shrinks, foveas slide in beside it →
// 3 claim fades up from the bottom → 4 clips jump to the aggressive-motion
// segment and the claim swaps.
const stage = useStage(4, { preview: 2 });
const split = computed(() => stage.value >= 2);
const aggressive = computed(() => stage.value >= 4);
const activeClip = computed(() => (aggressive.value ? clips.aggressive : clips.calm));

const captions = [
  { pre: "We can track targets with both foveas —", emph: "automatically" },
  { pre: "… even under", emph: "aggressive motion" },
];
const captionIndex = computed(() => (stage.value >= 4 ? 1 : stage.value >= 3 ? 0 : -1));

const centerEl = ref<HTMLVideoElement>();
const leftEl = ref<HTMLVideoElement>();
const rightEl = ref<HTMLVideoElement>();
const els = () =>
  [centerEl.value, leftEl.value, rightEl.value].filter((el): el is HTMLVideoElement => !!el);

// All three videos run whenever the slide is live — the foveas play hidden
// behind stage 1 so the three perspectives are already in lockstep when they
// slide into view.
const syncPlayback = () => {
  const { start, stop } = activeClip.value;
  for (const el of els()) {
    if (el.currentTime < start || el.currentTime >= stop - 0.05) el.currentTime = start;
    if (isActive.value) el.play().catch(() => {});
    else el.pause();
  }
};

// The center video is the clock: wrap the loop from its timeupdate, and snap
// the foveas back onto it if they drift badly. A fovea that is mid-seek or
// still buffering is left alone — re-seeking a starved decoder only freezes
// it harder.
const onCenterTime = () => {
  const center = centerEl.value;
  if (!center) return;
  const { start, stop } = activeClip.value;
  if (center.currentTime >= stop - 0.05) {
    for (const el of els()) el.currentTime = start;
    return;
  }
  for (const el of [leftEl.value, rightEl.value]) {
    if (!el || el.seeking || el.readyState < 3) continue;
    if (Math.abs(el.currentTime - center.currentTime) > 0.75) {
      el.currentTime = center.currentTime;
    }
  }
};

watch([isActive, activeClip], syncPlayback, { immediate: true });

onBeforeUnmount(() => {
  for (const el of els()) el.pause();
});
</script>

<template>
  <div class="tracking" :data-stage="stage">
    <div class="stage-area">
      <div class="panel">
        <div class="frame side-frame" :class="{ show: split }">
          <video
            ref="leftEl"
            class="media"
            :src="leftVideo"
            muted
            playsinline
            preload="auto"
            @loadedmetadata="syncPlayback"
          />
          <div class="tag" style="--tag-accent: var(--camera-left)">Left Fovea</div>
        </div>
      </div>

      <div class="panel">
        <div class="frame center-frame" :class="{ split }">
          <video
            ref="centerEl"
            class="media"
            :src="centerVideo"
            muted
            playsinline
            preload="auto"
            @loadedmetadata="syncPlayback"
            @timeupdate="onCenterTime"
            @ended="syncPlayback"
          />
          <div class="tag" :class="{ hide: !split }">Wide Context</div>
        </div>
      </div>

      <div class="panel">
        <div class="frame side-frame from-left" :class="{ show: split }">
          <video
            ref="rightEl"
            class="media"
            :src="rightVideo"
            muted
            playsinline
            preload="auto"
            @loadedmetadata="syncPlayback"
          />
          <div class="tag" style="--tag-accent: var(--camera-right)">Right Fovea</div>
        </div>
      </div>
    </div>

    <div class="caption" aria-live="polite">
      <p
        v-for="(c, i) in captions"
        :key="i"
        class="caption-line"
        :class="{ show: captionIndex === i }"
      >
        <span class="cap-pre">{{ c.pre }}</span>
        <span class="cap-emph">{{ c.emph }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.tracking {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 0.9rem;
  width: 100%;
  height: 100%;

  /* How far the center frame is blown up while it owns the stage alone. */
  --blowup: 1.68;
}

.stage-area {
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.9rem;
  align-items: center;
}

.panel {
  min-width: 0;
  display: grid;
  place-items: center;
}

.frame {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 0.5rem;
  background: #000;
  isolation: isolate;
  box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 14%, transparent);
}

.media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.center-frame {
  z-index: 2;
  transform: scale(var(--blowup));
  transition: transform 0.9s cubic-bezier(0.6, 0, 0.2, 1);
}

.center-frame.split {
  transform: none;
}

/* The foveas emerge from behind the shrinking center: faded out and tucked
   toward the middle, then sliding outward into their columns. */
.side-frame {
  opacity: 0;
  transform: translateX(58%) scale(0.94);
  transition:
    opacity 0.7s var(--transition-curve) 0.15s,
    transform 0.9s cubic-bezier(0.6, 0, 0.2, 1) 0.1s;
}

.side-frame.from-left {
  transform: translateX(-58%) scale(0.94);
}

.side-frame.show {
  opacity: 1;
  transform: none;
}

.tag {
  position: absolute;
  top: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  padding: 0.16rem 0.6rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--tag-accent, #fff) 55%, transparent);
  background: rgba(5, 12, 18, 0.72);
  color: rgba(241, 245, 249, 0.92);
  font-size: 0.62rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.tag.hide {
  opacity: 0;
}

.caption {
  position: relative;
  display: grid;
  place-items: center;
  height: 2.1rem;
}

.caption-line {
  position: absolute;
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 0.45em;
  white-space: nowrap;
  font-family: "Times New Roman", Times, serif;
  font-size: 1.18rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: color-mix(in srgb, currentColor 85%, transparent);
  opacity: 0;
  transform: translateY(0.65rem);
  transition:
    opacity 0.6s var(--transition-curve),
    transform 0.6s var(--transition-curve);
}

.caption-line.show {
  opacity: 1;
  transform: translateY(0);
}

.cap-emph {
  font-weight: 600;
  color: currentColor;
}
</style>
