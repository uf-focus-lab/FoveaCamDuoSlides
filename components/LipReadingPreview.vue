<script setup lang="ts">
import { useIsSlideActive } from "@slidev/client";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useStage } from "stores/stage";
import widePoster from "assets/results-upfront/wide.webp";

// TODO: Replace these placeholder video imports with your lip-reading clips.
// - wideVideo: full-context clip with both foveas visible
// - splitLeftVideo / splitRightVideo: separate split-stage videos
// - enhancedLeftVideo / enhancedRightVideo: post-zoom intermediate videos
// - foveaLeftVideo / foveaRightVideo: final fovea videos
import wideVideo from "assets/360.webm";
import splitLeftVideo from "assets/360.webm";
import splitRightVideo from "assets/360.webm";
import enhancedLeftVideo from "assets/360.webm";
import enhancedRightVideo from "assets/360.webm";
import foveaLeftVideo from "assets/360.webm";
import foveaRightVideo from "assets/360.webm";

type Token = { text: string; correct?: boolean };
type PanelTranscript = { prediction: Token[]; gt: Token[] };

const wideVideoEl = ref<HTMLVideoElement>();
const splitLeftVideoEl = ref<HTMLVideoElement>();
const splitRightVideoEl = ref<HTMLVideoElement>();
const enhancedLeftVideoEl = ref<HTMLVideoElement>();
const enhancedRightVideoEl = ref<HTMLVideoElement>();
const foveaLeftVideoEl = ref<HTMLVideoElement>();
const foveaRightVideoEl = ref<HTMLVideoElement>();
const wideFinished = ref(false);
const splitLeftFinished = ref(false);
const splitRightFinished = ref(false);
const enhancedLeftFinished = ref(false);
const enhancedRightFinished = ref(false);
const foveaLeftFinished = ref(false);
const foveaRightFinished = ref(false);
const leftFreezeSrc = ref("");
const rightFreezeSrc = ref("");

function freezeAtEnd(video: HTMLVideoElement | undefined, finished: { value: boolean }) {
  if (!video) return;
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  if (duration > 0) video.currentTime = Math.max(0, duration - 1 / 60);
  video.pause();
  finished.value = true;
}

function resetVideo(video: HTMLVideoElement | undefined, finished: { value: boolean }) {
  finished.value = false;
  if (!video) return;
  video.pause();
  video.currentTime = 0;
}

const onWideEnded = () => freezeAtEnd(wideVideoEl.value, wideFinished);
const onSplitLeftEnded = () => freezeAtEnd(splitLeftVideoEl.value, splitLeftFinished);
const onSplitRightEnded = () => freezeAtEnd(splitRightVideoEl.value, splitRightFinished);
const onEnhancedLeftEnded = () => freezeAtEnd(enhancedLeftVideoEl.value, enhancedLeftFinished);
const onEnhancedRightEnded = () => freezeAtEnd(enhancedRightVideoEl.value, enhancedRightFinished);
const onFoveaLeftEnded = () => freezeAtEnd(foveaLeftVideoEl.value, foveaLeftFinished);
const onFoveaRightEnded = () => freezeAtEnd(foveaRightVideoEl.value, foveaRightFinished);

function captureVideoFrame(video: HTMLVideoElement | undefined) {
  if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return "";

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) return "";

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

function captureZoomFreezeFrames() {
  const leftFrame = captureVideoFrame(splitLeftVideoEl.value);
  if (leftFrame) leftFreezeSrc.value = leftFrame;

  const rightFrame = captureVideoFrame(splitRightVideoEl.value);
  if (rightFrame) rightFreezeSrc.value = rightFrame;
}

async function finishWideTransition() {
  const video = wideVideoEl.value;
  if (!video) return;

  wideFinished.value = false;
  video.loop = false;

  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  const remaining = duration > 0 ? duration - video.currentTime : 0;
  if (duration > 0 && remaining <= 0.05) {
    video.currentTime = Math.max(0, duration - 1 / 60);
    video.pause();
    wideFinished.value = true;
    return;
  }

  await video.play().catch(() => {});

  await new Promise<void>((resolve) => {
    let finished = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const complete = () => {
      if (finished) return;
      finished = true;
      video.removeEventListener("ended", complete);
      video.removeEventListener("pause", onPause);
      if (timeoutId) clearTimeout(timeoutId);
      const finalDuration = Number.isFinite(video.duration) ? video.duration : 0;
      if (finalDuration > 0) video.currentTime = Math.max(0, finalDuration - 1 / 60);
      video.pause();
      wideFinished.value = true;
      resolve();
    };

    const onPause = () => {
      const currentDuration = Number.isFinite(video.duration) ? video.duration : 0;
      if (video.ended || (currentDuration > 0 && currentDuration - video.currentTime <= 0.05)) complete();
    };

    video.addEventListener("ended", complete, { once: true });
    video.addEventListener("pause", onPause);

    if (remaining > 0) timeoutId = setTimeout(complete, remaining * 1000 + 120);
  });
}

const stage = useStage(6, { preview: 3 }).transient(2, finishWideTransition);
const showSplit = computed(() => stage.value >= 3);
const zoomed = computed(() => stage.value >= 4);
const showTranscript = computed(() => stage.value >= 4);
const showEnhanced = computed(() => stage.value >= 5);
const showFovea = computed(() => stage.value >= 6);
const wideActive = computed(() => stage.value <= 2);
const splitActive = computed(() => stage.value >= 3 && stage.value < 5);
const enhancedActive = computed(() => stage.value === 5);
const foveaActive = computed(() => stage.value >= 6);

// In a 4:3 container, equal x/y percentages render as a visible 4:3 box.
// Width ~= 1/9 of the frame gives an approximate 9x zoom target.
// Centers are spaced to avoid overlap.
const roiWidth = 1 / 9;
const roiHeight = roiWidth;
const panelRoiHeight = roiWidth;
const leftCenter = { x: 0.3, y: 0.67 };
const rightCenter = { x: 0.7, y: 0.67 };
const zoomScale = 9;

const leftRoi = computed(() => ({
  top: `${(leftCenter.y - roiHeight / 2) * 100}%`,
  left: `${(leftCenter.x - roiWidth / 2) * 100}%`,
  width: `${roiWidth * 100}%`,
  height: `${roiHeight * 100}%`,
}));

const rightRoi = computed(() => ({
  top: `${(rightCenter.y - roiHeight / 2) * 100}%`,
  left: `${(rightCenter.x - roiWidth / 2) * 100}%`,
  width: `${roiWidth * 100}%`,
  height: `${roiHeight * 100}%`,
}));

const panelLeftRoi = computed(() => ({
  top: `${(leftCenter.y - panelRoiHeight / 2) * 100}%`,
  left: `${(leftCenter.x - roiWidth / 2) * 100}%`,
  width: `${roiWidth * 100}%`,
  height: `${panelRoiHeight * 100}%`,
}));

const panelRightRoi = computed(() => ({
  top: `${(rightCenter.y - panelRoiHeight / 2) * 100}%`,
  left: `${(rightCenter.x - roiWidth / 2) * 100}%`,
  width: `${roiWidth * 100}%`,
  height: `${panelRoiHeight * 100}%`,
}));

const panelTransform = (x: number, y: number) => {
  const tx = -(x - roiWidth / 2) * 100 * zoomScale;
  const ty = -(y - panelRoiHeight / 2) * 100 * zoomScale;
  return `translate(${tx}%, ${ty}%) scale(${zoomScale})`;
};

const leftZoomTransform = computed(() => panelTransform(leftCenter.x, leftCenter.y));
const rightZoomTransform = computed(() => panelTransform(rightCenter.x, rightCenter.y));

const transcriptSetA: { left: PanelTranscript; right: PanelTranscript } = {
  left: {
    prediction: [
      { text: "we" },
      { text: "can", correct: true },
      { text: "track" },
      { text: "the", correct: true },
      { text: "speaker" },
      { text: "today" },
    ],
    gt: [{ text: "we" }, { text: "can" }, { text: "track" }, { text: "the" }, { text: "speaker" }, { text: "today" }],
  },
  right: {
    prediction: [
      { text: "the" },
      { text: "signal", correct: true },
      { text: "is" },
      { text: "clear", correct: true },
      { text: "enough" },
      { text: "now" },
    ],
    gt: [{ text: "the" }, { text: "signal" }, { text: "is" }, { text: "clear" }, { text: "enough" }, { text: "now" }],
  },
};

const transcriptSetB: { left: PanelTranscript; right: PanelTranscript } = {
  left: {
    prediction: [
      { text: "we", correct: true },
      { text: "can", correct: true },
      { text: "track", correct: true },
      { text: "the", correct: true },
      { text: "speaker", correct: true },
      { text: "today", correct: true },
    ],
    gt: [{ text: "we" }, { text: "can" }, { text: "track" }, { text: "the" }, { text: "speaker" }, { text: "today" }],
  },
  right: {
    prediction: [
      { text: "the", correct: true },
      { text: "signal", correct: true },
      { text: "is", correct: true },
      { text: "clear", correct: true },
      { text: "enough", correct: true },
      { text: "now", correct: true },
    ],
    gt: [{ text: "the" }, { text: "signal" }, { text: "is" }, { text: "clear" }, { text: "enough" }, { text: "now" }],
  },
};

const transcriptSet = computed(() => (showFovea.value ? transcriptSetB : transcriptSetA));

const isActive = useIsSlideActive();

const syncPlayback = () => {
  const setPlaying = (video: HTMLVideoElement | undefined, playing: boolean, finished: { value: boolean }) => {
    if (!video) return;
    video.loop = false;
    if (playing && !finished.value) video.play().catch(() => {});
    else video.pause();
  };

  const active = isActive.value;
  const currentStage = stage.value;
  const freezeZoom = currentStage === 4;

  if (wideVideoEl.value) wideVideoEl.value.loop = false;

  if (currentStage === 1 && wideFinished.value) {
    setPlaying(wideVideoEl.value, false, wideFinished);
  } else {
    setPlaying(wideVideoEl.value, active && currentStage <= 2, wideFinished);
  }

  setPlaying(splitLeftVideoEl.value, active && currentStage >= 3 && currentStage < 5 && !freezeZoom, splitLeftFinished);
  setPlaying(splitRightVideoEl.value, active && currentStage >= 3 && currentStage < 5 && !freezeZoom, splitRightFinished);
  setPlaying(enhancedLeftVideoEl.value, active && currentStage === 5, enhancedLeftFinished);
  setPlaying(enhancedRightVideoEl.value, active && currentStage === 5, enhancedRightFinished);
  setPlaying(foveaLeftVideoEl.value, active && currentStage >= 6, foveaLeftFinished);
  setPlaying(foveaRightVideoEl.value, active && currentStage >= 6, foveaRightFinished);
};

watch(
  [stage, isActive],
  ([currentStage, active]) => {
    if (currentStage === 1 && active) {
      resetVideo(wideVideoEl.value, wideFinished);
      resetVideo(splitLeftVideoEl.value, splitLeftFinished);
      resetVideo(splitRightVideoEl.value, splitRightFinished);
      resetVideo(enhancedLeftVideoEl.value, enhancedLeftFinished);
      resetVideo(enhancedRightVideoEl.value, enhancedRightFinished);
      resetVideo(foveaLeftVideoEl.value, foveaLeftFinished);
      resetVideo(foveaRightVideoEl.value, foveaRightFinished);
      leftFreezeSrc.value = "";
      rightFreezeSrc.value = "";
    }

    if (currentStage === 4 && active) captureZoomFreezeFrames();
  },
  { immediate: true },
);

watch(
  [stage, isActive, wideVideoEl, splitLeftVideoEl, splitRightVideoEl, enhancedLeftVideoEl, enhancedRightVideoEl, foveaLeftVideoEl, foveaRightVideoEl],
  syncPlayback,
  { immediate: true },
);

onBeforeUnmount(() => {
  wideVideoEl.value?.pause();
  splitLeftVideoEl.value?.pause();
  splitRightVideoEl.value?.pause();
  enhancedLeftVideoEl.value?.pause();
  enhancedRightVideoEl.value?.pause();
  foveaLeftVideoEl.value?.pause();
  foveaRightVideoEl.value?.pause();
});
</script>

<template>
  <div class="lip-reading" :data-stage="stage">
    <div class="stage-area">
      <div class="wide-frame" :class="{ active: !showSplit }">
        <div class="wide-layer">
          <!-- TODO: Replace :src with your wide-angle lip-reading video. -->
          <video
            ref="wideVideoEl"
            class="media-video wide-video"
            :class="{ active: wideActive }"
            :src="wideVideo"
            :poster="widePoster"
            muted
            playsinline
            preload="auto"
            @ended="onWideEnded"
          />
          <div class="roi roi-blue show" :style="leftRoi" />
          <div class="roi roi-red show" :style="rightRoi" />
        </div>
      </div>

      <div class="multi-frame" :class="{ active: showSplit }">
        <div class="split-layer" :class="{ show: showSplit }">
          <div class="panel panel-left">
            <div class="panel-media">
              <div class="panel-zoom" :style="{ transform: zoomed ? leftZoomTransform : undefined }">
                <!-- TODO: Replace with left zoom lip-reading video. -->
                <video
                  ref="splitLeftVideoEl"
                  class="media-video panel-video"
                  :class="{ active: splitActive }"
                  :src="splitLeftVideo"
                  :poster="widePoster"
                  muted
                  playsinline
                  preload="auto"
                  @ended="onSplitLeftEnded"
                />
                <img
                  class="panel-freeze"
                  :class="{ show: zoomed && !!leftFreezeSrc }"
                  :src="leftFreezeSrc || undefined"
                  alt=""
                  aria-hidden="true"
                />
                <div class="panel-roi roi-blue" :style="panelLeftRoi" />
              </div>
            </div>
          </div>
          <div class="panel panel-right">
            <div class="panel-media">
              <div class="panel-zoom" :style="{ transform: zoomed ? rightZoomTransform : undefined }">
                <!-- TODO: Replace with right zoom lip-reading video. -->
                <video
                  ref="splitRightVideoEl"
                  class="media-video panel-video"
                  :class="{ active: splitActive }"
                  :src="splitRightVideo"
                  :poster="widePoster"
                  muted
                  playsinline
                  preload="auto"
                  @ended="onSplitRightEnded"
                />
                <img
                  class="panel-freeze"
                  :class="{ show: zoomed && !!rightFreezeSrc }"
                  :src="rightFreezeSrc || undefined"
                  alt=""
                  aria-hidden="true"
                />
                <div class="panel-roi roi-red" :style="panelRightRoi" />
              </div>
            </div>
          </div>
        </div>

        <div class="swap-layer" :class="{ show: showEnhanced }">
          <div class="panel panel-left">
            <!-- TODO: Replace with enhanced left video. -->
            <video
              ref="enhancedLeftVideoEl"
              class="media-video panel-video"
              :class="{ active: enhancedActive }"
              :src="enhancedLeftVideo"
              :poster="widePoster"
              muted
              playsinline
              preload="auto"
              @ended="onEnhancedLeftEnded"
            />
          </div>
          <div class="panel panel-right">
            <!-- TODO: Replace with enhanced right video. -->
            <video
              ref="enhancedRightVideoEl"
              class="media-video panel-video"
              :class="{ active: enhancedActive }"
              :src="enhancedRightVideo"
              :poster="widePoster"
              muted
              playsinline
              preload="auto"
              @ended="onEnhancedRightEnded"
            />
          </div>
        </div>

        <div class="fovea-layer" :class="{ show: showFovea }">
          <div class="panel panel-left">
            <!-- TODO: Replace with final left fovea video. -->
            <video
              ref="foveaLeftVideoEl"
              class="media-video panel-video"
              :class="{ active: foveaActive }"
              :src="foveaLeftVideo"
              :poster="widePoster"
              muted
              playsinline
              preload="auto"
              @ended="onFoveaLeftEnded"
            />
          </div>
          <div class="panel panel-right">
            <!-- TODO: Replace with final right fovea video. -->
            <video
              ref="foveaRightVideoEl"
              class="media-video panel-video"
              :class="{ active: foveaActive }"
              :src="foveaRightVideo"
              :poster="widePoster"
              muted
              playsinline
              preload="auto"
              @ended="onFoveaRightEnded"
            />
          </div>
        </div>

        <div class="transition-label" :class="{ show: showEnhanced || showFovea }">
          {{ showFovea ? "Enhanced -> Fovea" : "Zoom -> Enhanced" }}
        </div>
      </div>
    </div>

    <div class="transcript-grid" :class="{ show: showTranscript }">
      <div class="transcript-column">
        <div class="conversation-label">Conversation A</div>
        <div class="transcript-box prediction-box">
          <div class="transcript-label">Prediction</div>
          <p>
            <span
              v-for="(token, index) in transcriptSet.left.prediction"
              :key="`left-p-${token.text}-${index}`"
              class="token"
              :class="{ correct: token.correct }"
            >
              {{ token.text }}
            </span>
          </p>
        </div>
        <div class="transcript-box gt-box">
          <div class="transcript-label">GT</div>
          <p>
            <span v-for="(token, index) in transcriptSet.left.gt" :key="`left-g-${token.text}-${index}`" class="token gt-token">
              {{ token.text }}
            </span>
          </p>
        </div>
      </div>

      <div class="transcript-column">
        <div class="conversation-label">Conversation B</div>
        <div class="transcript-box prediction-box">
          <div class="transcript-label">Prediction</div>
          <p>
            <span
              v-for="(token, index) in transcriptSet.right.prediction"
              :key="`right-p-${token.text}-${index}`"
              class="token"
              :class="{ correct: token.correct }"
            >
              {{ token.text }}
            </span>
          </p>
        </div>
        <div class="transcript-box gt-box">
          <div class="transcript-label">GT</div>
          <p>
            <span v-for="(token, index) in transcriptSet.right.gt" :key="`right-g-${token.text}-${index}`" class="token gt-token">
              {{ token.text }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lip-reading {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 1rem;
  width: 100%;
  height: 100%;
}

.stage-area {
  min-height: 0;
  width: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
  position: relative;
}

.wide-frame,
.multi-frame {
  position: relative;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
  border-radius: 0.5rem;
  background: #000;
  isolation: isolate;
}

.wide-frame {
  height: 100%;
  aspect-ratio: 3/ 2;
}

.multi-frame {
  width: 100%;
  aspect-ratio: 3;
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.wide-frame {
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.wide-frame.active,
.multi-frame.active {
  opacity: 1;
  pointer-events: auto;
}

.transition-label {
  position: absolute;
  top: 0.55rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(5, 12, 18, 0.72);
  color: rgba(241, 245, 249, 0.92);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.transition-label.show {
  opacity: 1;
}

.wide-layer,
.split-layer,
.swap-layer,
.fovea-layer {
  position: absolute;
  inset: 0;
}

.wide-layer {
  opacity: 1;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.wide-layer.faded {
  opacity: 0.25;
}

.media-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
}

.media-video.active {
  opacity: 1;
}

.panel-freeze {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.15s linear;
}

.panel-freeze.show {
  opacity: 1;
}

.roi {
  position: absolute;
  outline: 2px solid var(--camera-left);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    top var(--transition-duration) var(--transition-curve),
    left var(--transition-duration) var(--transition-curve),
    width var(--transition-duration) var(--transition-curve),
    height var(--transition-duration) var(--transition-curve);
}

.roi-red {
  color: var(--camera-left);
  outline-color: var(--camera-left);
}

.roi-blue {
  color: var(--camera-right);
  outline-color: var(--camera-right);
}

.roi.show {
  opacity: 1;
}

.panel-roi {
  position: absolute;
  z-index: 3;
  outline-width: 2px;
  outline-style: solid;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.55);
  transition: transform var(--transition-duration) var(--transition-curve);
}

.split-layer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  opacity: 0;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.split-layer.show {
  opacity: 1;
}

.panel {
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.panel + .panel {
  border-left: 1px solid rgba(255, 255, 255, 0.25);
}

.panel-media {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  max-height: 100%;
  overflow: hidden;
}

.panel-zoom {
  position: absolute;
  inset: 0;
  aspect-ratio: 3 / 2;
  transform-origin: 0 0;
  transition: transform 0.9s cubic-bezier(0.6, 0, 0.2, 1);
}

.wide-video,
.panel-video {
  aspect-ratio: 4 / 3;
}

.swap-layer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.85s cubic-bezier(0.6, 0, 0.2, 1);
}

.swap-layer.show {
  clip-path: inset(0);
}

.fovea-layer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.85s cubic-bezier(0.6, 0, 0.2, 1);
}

.fovea-layer.show {
  clip-path: inset(0);
}

.transcript-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  width: 100%;
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.transcript-grid.show {
  opacity: 1;
  visibility: visible;
}

.transcript-column {
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 0.45rem;
  min-width: 0;
}

.conversation-label {
  font-size: 0.68rem;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  opacity: 0.82;
}

.transcript-box {
  width: 100%;
  min-height: 2.8rem;
  padding: 0.52rem 0.68rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 0.45rem;
  background: rgba(8, 12, 20, 0.55);
}

.transcript-label {
  margin-bottom: 0.18rem;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.75;
}

.transcript-box p {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.35;
}

.token {
  margin-right: 0.42rem;
  color: rgba(248, 250, 252, 0.88);
  transition: color 0.3s var(--transition-curve), background-color 0.3s var(--transition-curve);
}

.token.correct {
  color: #041311;
  background: color-mix(in srgb, var(--camera-center) 72%, white 28%);
  border-radius: 0.2rem;
  padding: 0.02rem 0.18rem;
}

.gt-box {
  border-color: rgba(125, 211, 252, 0.45);
}

.gt-token {
  color: rgba(186, 230, 253, 0.95);
}
</style>