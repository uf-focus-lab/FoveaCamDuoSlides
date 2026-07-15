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
import wideVideo from "assets/liptracking/0002.fcap-center.webm";
import splitLeftVideo from "assets/liptracking/0002.fcap-center.webm";
import splitRightVideo from "assets/liptracking/0002.fcap-center.webm";
import enhancedLeftVideo from "assets/liptracking/0002centerleft_cropped.mp4";
import enhancedRightVideo from "assets/liptracking/0002centerright_cropped.mp4";
import foveaLeftVideo from "assets/liptracking/face_tracking/0002.fcap-left-fovea.tracked.webm";
import foveaRightVideo from "assets/liptracking/face_tracking/0002.fcap-right-fovea.tracked.webm";

type Token = { text: string; correct?: boolean };
type PanelTranscript = { prediction: Token[]; gt: Token[] };
type VideoKey = "wide" | "splitLeft" | "splitRight" | "enhancedLeft" | "enhancedRight" | "foveaLeft" | "foveaRight";
type ClipWindowInput = { start?: number; stop?: number | null };
type ClipWindow = { start: number; stop: number | null };
type RoiFrameInput = { t: number; x: number; y: number; width?: number; height?: number };
type RoiFrame = { t: number; x: number; y: number; width: number; height: number };
type RoiTracksInput = Partial<Record<"left" | "right", RoiFrameInput[]>>;

const props = withDefaults(
  defineProps<{
    clipWindows?: Partial<Record<VideoKey, ClipWindowInput>>;
    roiTracks?: RoiTracksInput;
  }>(),
  {
    clipWindows: () => ({}),
    roiTracks: () => ({}),
  },
);

const defaultClipWindows: Record<VideoKey, ClipWindow> = {
  wide: { start: 15, stop: 20 },
  splitLeft: { start: 20, stop: 22 },
  splitRight: { start: 20, stop: 22 },
  enhancedLeft: { start: 0, stop: null },
  enhancedRight: { start: 0, stop: null },
  foveaLeft: { start: 0, stop: null },
  foveaRight: { start: 0, stop: null },
};

const asFiniteNumber = (value: unknown): number | undefined => {
  if (value == null) return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeClipWindow = (input: ClipWindowInput | undefined, fallback: ClipWindow): ClipWindow => {
  const startValue = asFiniteNumber(input?.start) ?? fallback.start;
  const start = Math.max(0, startValue);

  // Keep fallback stop unless a stop override is explicitly provided.
  const rawStop = input && "stop" in input ? input.stop : fallback.stop;
  if (rawStop == null) return { start, stop: null };

  const stopValue = asFiniteNumber(rawStop) ?? fallback.stop;
  if (stopValue == null) return { start, stop: null };
  const stop = Math.max(start + 0.01, stopValue);
  return { start, stop };
};

const clipWindows = computed<Record<VideoKey, ClipWindow>>(() => {
  const incoming = props.clipWindows;
  return {
    wide: normalizeClipWindow(incoming.wide, defaultClipWindows.wide),
    splitLeft: normalizeClipWindow(incoming.splitLeft, defaultClipWindows.splitLeft),
    splitRight: normalizeClipWindow(incoming.splitRight, defaultClipWindows.splitRight),
    enhancedLeft: normalizeClipWindow(incoming.enhancedLeft, defaultClipWindows.enhancedLeft),
    enhancedRight: normalizeClipWindow(incoming.enhancedRight, defaultClipWindows.enhancedRight),
    foveaLeft: normalizeClipWindow(incoming.foveaLeft, defaultClipWindows.foveaLeft),
    foveaRight: normalizeClipWindow(incoming.foveaRight, defaultClipWindows.foveaRight),
  };
});

const defaultLeftRoi: RoiFrame = { t: 0, x: 0.3, y: 0.67, width: 1 / 9, height: 1 / 9 };
const defaultRightRoi: RoiFrame = { t: 0, x: 0.7, y: 0.67, width: 1 / 9, height: 1 / 9 };

const normalizeRoiTrack = (input: RoiFrameInput[] | undefined, fallback: RoiFrame): RoiFrame[] => {
  const source = input && input.length > 0 ? input : [fallback];
  const sorted = [...source].sort((a, b) => a.t - b.t);
  const normalized: RoiFrame[] = [];

  for (const frame of sorted) {
    const prev = normalized[normalized.length - 1] ?? fallback;
    normalized.push({
      t: Math.max(0, asFiniteNumber(frame.t) ?? prev.t),
      x: Math.max(0, Math.min(1, asFiniteNumber(frame.x) ?? prev.x)),
      y: Math.max(0, Math.min(1, asFiniteNumber(frame.y) ?? prev.y)),
      width: Math.max(0.01, Math.min(1, asFiniteNumber(frame.width) ?? prev.width)),
      height: Math.max(0.01, Math.min(1, asFiniteNumber(frame.height) ?? prev.height)),
    });
  }

  return normalized;
};

const roiTracks = computed<{ left: RoiFrame[]; right: RoiFrame[] }>(() => ({
  left: normalizeRoiTrack(props.roiTracks.left, defaultLeftRoi),
  right: normalizeRoiTrack(props.roiTracks.right, defaultRightRoi),
}));

const roiTimeLeft = ref(0);
const roiTimeRight = ref(0);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const sampleRoiTrack = (track: RoiFrame[], time: number): RoiFrame => {
  const clampedTime = Math.max(0, time);
  if (track.length === 0) return defaultLeftRoi;
  if (clampedTime <= track[0].t) return track[0];

  for (let i = 1; i < track.length; i += 1) {
    const a = track[i - 1];
    const b = track[i];
    if (clampedTime <= b.t) {
      const span = Math.max(1e-6, b.t - a.t);
      const alpha = (clampedTime - a.t) / span;
      return {
        t: clampedTime,
        x: lerp(a.x, b.x, alpha),
        y: lerp(a.y, b.y, alpha),
        width: lerp(a.width, b.width, alpha),
        height: lerp(a.height, b.height, alpha),
      };
    }
  }

  return track[track.length - 1];
};

const activeLeftRoi = computed(() => sampleRoiTrack(roiTracks.value.left, roiTimeLeft.value));
const activeRightRoi = computed(() => sampleRoiTrack(roiTracks.value.right, roiTimeRight.value));

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

const getClipStop = (video: HTMLVideoElement | undefined, clip: ClipWindow): number | null => {
  if (!video) return clip.stop;
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  if (clip.stop == null) return duration > 0 ? duration : null;
  if (duration > 0) return Math.min(duration, clip.stop);
  return clip.stop;
};

function freezeAtEnd(video: HTMLVideoElement | undefined, finished: { value: boolean }, clip: ClipWindow) {
  if (!video) return;
  const stop = getClipStop(video, clip);
  if (stop != null) video.currentTime = Math.max(clip.start, stop - 1 / 60);
  video.pause();
  finished.value = true;
}

function resetVideo(video: HTMLVideoElement | undefined, finished: { value: boolean }, clip: ClipWindow) {
  finished.value = false;
  if (!video) return;
  video.pause();
  video.currentTime = clip.start;
}

const onWideEnded = () => {
  freezeAtEnd(wideVideoEl.value, wideFinished, clipWindows.value.wide);
  advanceAfterWide();
};
const onSplitLeftEnded = () => {
  freezeAtEnd(splitLeftVideoEl.value, splitLeftFinished, clipWindows.value.splitLeft);
  advanceAfterSplit();
};
const onSplitRightEnded = () => {
  freezeAtEnd(splitRightVideoEl.value, splitRightFinished, clipWindows.value.splitRight);
  advanceAfterSplit();
};
const onEnhancedLeftEnded = () => freezeAtEnd(enhancedLeftVideoEl.value, enhancedLeftFinished, clipWindows.value.enhancedLeft);
const onEnhancedRightEnded = () => freezeAtEnd(enhancedRightVideoEl.value, enhancedRightFinished, clipWindows.value.enhancedRight);
const onFoveaLeftEnded = () => freezeAtEnd(foveaLeftVideoEl.value, foveaLeftFinished, clipWindows.value.foveaLeft);
const onFoveaRightEnded = () => freezeAtEnd(foveaRightVideoEl.value, foveaRightFinished, clipWindows.value.foveaRight);

const stopAtClipEnd = (video: HTMLVideoElement | undefined, finished: { value: boolean }, clip: ClipWindow) => {
  if (!video || finished.value) return;
  const stop = getClipStop(video, clip);
  if (stop != null && video.currentTime >= stop - 1 / 120) freezeAtEnd(video, finished, clip);
};

const onWideTimeUpdate = () => {
  stopAtClipEnd(wideVideoEl.value, wideFinished, clipWindows.value.wide);
  advanceAfterWide();
  const t = wideVideoEl.value?.currentTime;
  if (typeof t === "number") {
    roiTimeLeft.value = t;
    roiTimeRight.value = t;
  }
};
const onSplitLeftTimeUpdate = () => {
  stopAtClipEnd(splitLeftVideoEl.value, splitLeftFinished, clipWindows.value.splitLeft);
  advanceAfterSplit();
  const t = splitLeftVideoEl.value?.currentTime;
  if (typeof t === "number") roiTimeLeft.value = t;
};
const onSplitRightTimeUpdate = () => {
  stopAtClipEnd(splitRightVideoEl.value, splitRightFinished, clipWindows.value.splitRight);
  advanceAfterSplit();
  const t = splitRightVideoEl.value?.currentTime;
  if (typeof t === "number") roiTimeRight.value = t;
};
const onEnhancedLeftTimeUpdate = () => stopAtClipEnd(enhancedLeftVideoEl.value, enhancedLeftFinished, clipWindows.value.enhancedLeft);
const onEnhancedRightTimeUpdate = () => stopAtClipEnd(enhancedRightVideoEl.value, enhancedRightFinished, clipWindows.value.enhancedRight);
const onFoveaLeftTimeUpdate = () => stopAtClipEnd(foveaLeftVideoEl.value, foveaLeftFinished, clipWindows.value.foveaLeft);
const onFoveaRightTimeUpdate = () => stopAtClipEnd(foveaRightVideoEl.value, foveaRightFinished, clipWindows.value.foveaRight);

const syncToClipStart = (video: HTMLVideoElement | undefined, clip: ClipWindow) => {
  if (!video) return;
  const stop = getClipStop(video, clip);
  const start = stop == null ? clip.start : Math.min(clip.start, stop);
  video.currentTime = start;
};

const onWideLoadedMetadata = () => syncToClipStart(wideVideoEl.value, clipWindows.value.wide);
const onSplitLeftLoadedMetadata = () => syncToClipStart(splitLeftVideoEl.value, clipWindows.value.splitLeft);
const onSplitRightLoadedMetadata = () => syncToClipStart(splitRightVideoEl.value, clipWindows.value.splitRight);
const onEnhancedLeftLoadedMetadata = () => syncToClipStart(enhancedLeftVideoEl.value, clipWindows.value.enhancedLeft);
const onEnhancedRightLoadedMetadata = () => syncToClipStart(enhancedRightVideoEl.value, clipWindows.value.enhancedRight);
const onFoveaLeftLoadedMetadata = () => syncToClipStart(foveaLeftVideoEl.value, clipWindows.value.foveaLeft);
const onFoveaRightLoadedMetadata = () => syncToClipStart(foveaRightVideoEl.value, clipWindows.value.foveaRight);

const stage = useStage(5, { preview: 3 }).transient(3);

function advanceAfterWide() {
  if (!isActive.value || stage.value !== 1 || !wideFinished.value) return;
  stage.busy = false;
  stage.value = 2;
}

function advanceAfterSplit() {
  if (!isActive.value || stage.value !== 2 || !splitLeftFinished.value || !splitRightFinished.value) return;
  stage.busy = false;
  stage.value = 3;
}

watch(
  [clipWindows, stage],
  () => {
    if (stage.value === 1) {
      const t = Math.max(0, clipWindows.value.wide.start);
      roiTimeLeft.value = t;
      roiTimeRight.value = t;
      return;
    }

    roiTimeLeft.value = Math.max(0, clipWindows.value.splitLeft.start);
    roiTimeRight.value = Math.max(0, clipWindows.value.splitRight.start);
  },
  { immediate: true },
);
const showSplit = computed(() => stage.value >= 2);
const zoomed = computed(() => stage.value >= 3);
const showTranscript = computed(() => stage.value >= 4);
const showEnhanced = computed(() => stage.value >= 4);
const showFovea = computed(() => stage.value >= 5);
const wideActive = computed(() => stage.value === 1);
const splitActive = computed(() => stage.value >= 2 && stage.value <= 4);
const enhancedActive = computed(() => stage.value === 4);
const foveaActive = computed(() => stage.value >= 5);

const zoomScale = 9;

const leftRoi = computed(() => ({
  top: `${(activeLeftRoi.value.y - activeLeftRoi.value.height / 2) * 100}%`,
  left: `${(activeLeftRoi.value.x - activeLeftRoi.value.width / 2) * 100}%`,
  width: `${activeLeftRoi.value.width * 100}%`,
  height: `${activeLeftRoi.value.height * 100}%`,
}));

const rightRoi = computed(() => ({
  top: `${(activeRightRoi.value.y - activeRightRoi.value.height / 2) * 100}%`,
  left: `${(activeRightRoi.value.x - activeRightRoi.value.width / 2) * 100}%`,
  width: `${activeRightRoi.value.width * 100}%`,
  height: `${activeRightRoi.value.height * 100}%`,
}));

const panelLeftRoi = computed(() => ({
  top: `${(activeLeftRoi.value.y - activeLeftRoi.value.height / 2) * 100}%`,
  left: `${(activeLeftRoi.value.x - activeLeftRoi.value.width / 2) * 100}%`,
  width: `${activeLeftRoi.value.width * 100}%`,
  height: `${activeLeftRoi.value.height * 100}%`,
}));

const panelRightRoi = computed(() => ({
  top: `${(activeRightRoi.value.y - activeRightRoi.value.height / 2) * 100}%`,
  left: `${(activeRightRoi.value.x - activeRightRoi.value.width / 2) * 100}%`,
  width: `${activeRightRoi.value.width * 100}%`,
  height: `${activeRightRoi.value.height * 100}%`,
}));

const panelTransform = (roi: RoiFrame) => {
  const tx = -(roi.x - roi.width / 2) * 100 * zoomScale;
  const ty = -(roi.y - roi.height / 2) * 100 * zoomScale;
  return `translate(${tx}%, ${ty}%) scale(${zoomScale})`;
};

const leftZoomTransform = computed(() => panelTransform(activeLeftRoi.value));
const rightZoomTransform = computed(() => panelTransform(activeRightRoi.value));

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
  const setPlaying = (video: HTMLVideoElement | undefined, playing: boolean, finished: { value: boolean }, clip: ClipWindow) => {
    if (!video) return;
    video.loop = false;
    if (video.currentTime < clip.start) video.currentTime = clip.start;

    const stop = getClipStop(video, clip);
    if (stop != null && video.currentTime >= stop - 1 / 120) {
      finished.value = true;
      video.pause();
      return;
    }

    if (playing && !finished.value) video.play().catch(() => {});
    else video.pause();
  };

  const active = isActive.value;
  const currentStage = stage.value;
  if (wideVideoEl.value) wideVideoEl.value.loop = false;

  setPlaying(wideVideoEl.value, active && currentStage === 1, wideFinished, clipWindows.value.wide);

  setPlaying(splitLeftVideoEl.value, active && currentStage === 2, splitLeftFinished, clipWindows.value.splitLeft);
  setPlaying(splitRightVideoEl.value, active && currentStage === 2, splitRightFinished, clipWindows.value.splitRight);
  setPlaying(enhancedLeftVideoEl.value, active && currentStage === 4, enhancedLeftFinished, clipWindows.value.enhancedLeft);
  setPlaying(enhancedRightVideoEl.value, active && currentStage === 4, enhancedRightFinished, clipWindows.value.enhancedRight);
  setPlaying(foveaLeftVideoEl.value, active && currentStage >= 5, foveaLeftFinished, clipWindows.value.foveaLeft);
  setPlaying(foveaRightVideoEl.value, active && currentStage >= 5, foveaRightFinished, clipWindows.value.foveaRight);
};

watch(
  [stage, isActive],
  ([currentStage, active]) => {
    if (currentStage === 1 && active) {
      resetVideo(wideVideoEl.value, wideFinished, clipWindows.value.wide);
      resetVideo(splitLeftVideoEl.value, splitLeftFinished, clipWindows.value.splitLeft);
      resetVideo(splitRightVideoEl.value, splitRightFinished, clipWindows.value.splitRight);
      resetVideo(enhancedLeftVideoEl.value, enhancedLeftFinished, clipWindows.value.enhancedLeft);
      resetVideo(enhancedRightVideoEl.value, enhancedRightFinished, clipWindows.value.enhancedRight);
      resetVideo(foveaLeftVideoEl.value, foveaLeftFinished, clipWindows.value.foveaLeft);
      resetVideo(foveaRightVideoEl.value, foveaRightFinished, clipWindows.value.foveaRight);
    }

    if (active && currentStage <= 2) {
      stage.busy = true;
    }
  },
  { immediate: true },
);

watch(
  [
    stage,
    isActive,
    clipWindows,
    wideVideoEl,
    splitLeftVideoEl,
    splitRightVideoEl,
    enhancedLeftVideoEl,
    enhancedRightVideoEl,
    foveaLeftVideoEl,
    foveaRightVideoEl,
  ],
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
  <div class="lip-reading" :class="{ 'has-transcript': showTranscript }" :data-stage="stage">
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
            @loadedmetadata="onWideLoadedMetadata"
            @ended="onWideEnded"
            @timeupdate="onWideTimeUpdate"
          />
          <div class="roi roi-blue show" :style="leftRoi" />
          <div class="roi roi-red show" :style="rightRoi" />
        </div>
      </div>

      <div class="multi-frame" :class="{ active: showSplit }">
        <div class="split-layer" :class="{ show: showSplit, fading: showEnhanced }">
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
                  @loadedmetadata="onSplitLeftLoadedMetadata"
                  @ended="onSplitLeftEnded"
                  @timeupdate="onSplitLeftTimeUpdate"
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
                  @loadedmetadata="onSplitRightLoadedMetadata"
                  @ended="onSplitRightEnded"
                  @timeupdate="onSplitRightTimeUpdate"
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
              @loadedmetadata="onEnhancedLeftLoadedMetadata"
              @ended="onEnhancedLeftEnded"
              @timeupdate="onEnhancedLeftTimeUpdate"
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
              @loadedmetadata="onEnhancedRightLoadedMetadata"
              @ended="onEnhancedRightEnded"
              @timeupdate="onEnhancedRightTimeUpdate"
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
              @loadedmetadata="onFoveaLeftLoadedMetadata"
              @ended="onFoveaLeftEnded"
              @timeupdate="onFoveaLeftTimeUpdate"
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
              @loadedmetadata="onFoveaRightLoadedMetadata"
              @ended="onFoveaRightEnded"
              @timeupdate="onFoveaRightTimeUpdate"
            />
          </div>
        </div>

        <div class="transition-label" :class="{ show: showFovea }">Enhanced -> Fovea</div>
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
  grid-template-rows: minmax(0, 1fr) 0;
  gap: 1rem;
  width: 100%;
  height: 100%;
}

.lip-reading.has-transcript {
  grid-template-rows: minmax(0, 1fr) auto;
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
  width: auto;
  height: 100%;
  aspect-ratio: 4 / 3;
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

.split-layer.fading {
  opacity: 0;
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

.panel-video {
  aspect-ratio: 4 / 3;
}

.wide-video {
  aspect-ratio: 4 / 3;
}

.swap-layer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  opacity: 0;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.swap-layer.show {
  opacity: 1;
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
  min-height: 0;
  overflow: hidden;
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