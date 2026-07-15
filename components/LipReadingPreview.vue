<script setup lang="ts">
import { useIsSlideActive } from "@slidev/client";
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { useStage } from "stores/stage";
import widePoster from "assets/results-upfront/wide.webp";
import wideVideo from "assets/liptracking/center.webm";
import zoomLeftVideo from "assets/liptracking/center_cropped_left_bbox.h264.mp4";
import zoomRightVideo from "assets/liptracking/center_cropped_right_bbox.h264.mp4";
import foveaLeftVideo from "assets/liptracking/desirablytrimmedwithaudio/left.webm";
import foveaRightVideo from "assets/liptracking/desirablytrimmedwithaudio/right.webm";
import trackLeftVideo from "assets/liptracking/desirablytrimmedwithaudio/left_facetrack.webm";
import trackRightVideo from "assets/liptracking/desirablytrimmedwithaudio/right_facetrack.webm";

const isActive = useIsSlideActive();

const sides = ["left", "right"] as const;
type Side = (typeof sides)[number];
type Token = { text: string; correct: boolean };
type VideoKey = "wide" | "splitLeft" | "splitRight" | "zoomLeft" | "zoomRight" | "foveaLeft" | "foveaRight";
type ClipWindowInput = { start?: number; stop?: number | null };
type ClipWindow = { start: number; stop: number | null };
type RoiFrameInput = { t: number; x: number; y: number; width?: number; height?: number };
type RoiFrame = { t: number; x: number; y: number; width: number; height: number };
type RoiTracksInput = Partial<Record<Side, RoiFrameInput[]>>;

const props = withDefaults(
  defineProps<{
    wideVideoScale?: number;
    wideVideoStartScale?: number;
    clipWindows?: Partial<Record<VideoKey, ClipWindowInput>>;
    roiTracks?: RoiTracksInput;
  }>(),
  {
    wideVideoScale: 1.1,
    wideVideoStartScale: 1.25,
    clipWindows: () => ({}),
    roiTracks: () => ({}),
  },
);

// ---------------------------------------------------------------- transcripts

const transcriptSource: Record<Side, { gt: string; predicted: string }> = {
  left: {
    gt: "Yeah, I just arrived in today, its been a lot of fun, the hotel is super nice, yeah definitey, super beautiful, the courtyard is amazing, theres a lot of plants, I think a lot of them are real, which is really awesome. And theres even real birds flying around, like, alive birds.",
    predicted:
      "I JUST DO WHAT I'VE DONE TODAY IT'S BEEN A LOT OF FUN THE HOTEL IS SUPER NICE YEAH DEFINITELY SUPER BEAUTIFUL THE COURTYARD IS AMAZING THERE'S A LOT OF PLANTS AND A LOT OF THEM ARE REAL WHICH IS REALLY AWESOME AND THERE'S EVEN REAL BIRDS FLYING AROUND LIKE A LOT OF BIRDS",
  },
  right: {
    gt: "Oh my god oh my go- what? On fire? How am I gonna get my paper in now?! Thats okay, reviewer number two already rejected it, ill try again next year.",
    predicted:
      "OH MY GOD WHAT ON FIRE HOW AM I GOING TO DEAL WITH MY PAPER IN THE HOUSE THAT'S OK AND MY VIEWING NUMBERS ARE ALREADY REJECTED NOW I'LL TRY IT AGAIN NEXT YEAR",
  },
};

const normalizeWord = (word: string) => word.toLowerCase().replace(/[^a-z0-9]/g, "");

// Word-level LCS of predicted vs GT; predicted tokens on the LCS are "correct".
function alignPrediction(predicted: string, gt: string): Token[] {
  const pred = predicted.split(/\s+/).filter(Boolean);
  const ref = gt.split(/\s+/).filter(Boolean).map(normalizeWord);
  const norm = pred.map(normalizeWord);
  const m = pred.length;
  const n = ref.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      dp[i][j] = norm[i] && norm[i] === ref[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const correct = new Array<boolean>(m).fill(false);
  for (let i = 0, j = 0; i < m && j < n; ) {
    if (norm[i] && norm[i] === ref[j]) {
      correct[i] = true;
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i += 1;
    else j += 1;
  }
  return pred.map((text, i) => ({ text, correct: correct[i] }));
}

const transcript: Record<Side, { prediction: Token[]; gt: string }> = {
  left: { prediction: alignPrediction(transcriptSource.left.predicted, transcriptSource.left.gt), gt: transcriptSource.left.gt },
  right: { prediction: alignPrediction(transcriptSource.right.predicted, transcriptSource.right.gt), gt: transcriptSource.right.gt },
};

// -------------------------------------------------------------- clip windows

const defaultClipWindows: Record<VideoKey, ClipWindow> = {
  wide: { start: 15, stop: 20 },
  splitLeft: { start: 20, stop: 22 },
  splitRight: { start: 20, stop: 22 },
  zoomLeft: { start: 22, stop: null },
  zoomRight: { start: 22, stop: null },
  foveaLeft: { start: 0, stop: null },
  foveaRight: { start: 0, stop: null },
};

const asFiniteNumber = (value: unknown): number | undefined => {
  if (value == null) return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeClipWindow = (input: ClipWindowInput | undefined, fallback: ClipWindow): ClipWindow => {
  const start = Math.max(0, asFiniteNumber(input?.start) ?? fallback.start);
  // Keep fallback stop unless a stop override is explicitly provided.
  const rawStop = input && "stop" in input ? input.stop : fallback.stop;
  const stop = rawStop == null ? null : (asFiniteNumber(rawStop) ?? fallback.stop);
  return { start, stop: stop == null ? null : Math.max(start + 0.01, stop) };
};

const clipWindows = computed<Record<VideoKey, ClipWindow>>(() => {
  const entries = (Object.keys(defaultClipWindows) as VideoKey[]).map((key) => [
    key,
    normalizeClipWindow(props.clipWindows[key], defaultClipWindows[key]),
  ]);
  return Object.fromEntries(entries) as Record<VideoKey, ClipWindow>;
});

// ---------------------------------------------------------------- ROI tracks

const defaultRoi: Record<Side, RoiFrame> = {
  left: { t: 0, x: 0.177, y: 0.241, width: 160 / 1440, height: 120 / 1080 },
  right: { t: 0, x: 0.69, y: 0.59, width: 152 / 1440, height: 114 / 1080 },
};

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

const roiTracks = computed<Record<Side, RoiFrame[]>>(() => ({
  left: normalizeRoiTrack(props.roiTracks.left, defaultRoi.left),
  right: normalizeRoiTrack(props.roiTracks.right, defaultRoi.right),
}));

const roiTime = reactive<Record<Side, number>>({ left: 0, right: 0 });

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const sampleRoiTrack = (track: RoiFrame[], time: number): RoiFrame => {
  const clamped = Math.max(0, time);
  if (clamped <= track[0].t) return track[0];
  for (let i = 1; i < track.length; i += 1) {
    const a = track[i - 1];
    const b = track[i];
    if (clamped <= b.t) {
      const alpha = (clamped - a.t) / Math.max(1e-6, b.t - a.t);
      return {
        t: clamped,
        x: lerp(a.x, b.x, alpha),
        y: lerp(a.y, b.y, alpha),
        width: lerp(a.width, b.width, alpha),
        height: lerp(a.height, b.height, alpha),
      };
    }
  }
  return track[track.length - 1];
};

const activeRoi = computed<Record<Side, RoiFrame>>(() => ({
  left: sampleRoiTrack(roiTracks.value.left, roiTime.left),
  right: sampleRoiTrack(roiTracks.value.right, roiTime.right),
}));

// ROI box in canvas percentage coords (the canvases share the video's 4:3 frame,
// so normalized video coords map 1:1 onto element percentages).
const roiStyle = computed<Record<Side, Record<string, string>>>(() => {
  const style = (roi: RoiFrame) => ({
    top: `${(roi.y - roi.height / 2) * 100}%`,
    left: `${(roi.x - roi.width / 2) * 100}%`,
    width: `${roi.width * 100}%`,
    height: `${roi.height * 100}%`,
  });
  return { left: style(activeRoi.value.left), right: style(activeRoi.value.right) };
});

// Zoom the panel canvas (origin center) so the ROI fills the panel.
const zoomTransform = computed<Record<Side, string>>(() => {
  const transform = (roi: RoiFrame) => {
    const s = 1 / roi.width;
    return `translate(${s * (0.5 - roi.x) * 100}%, ${s * (0.5 - roi.y) * 100}%) scale(${s})`;
  };
  return { left: transform(activeRoi.value.left), right: transform(activeRoi.value.right) };
});

// -------------------------------------------------------------------- videos

const getClipStop = (video: HTMLVideoElement | undefined, clip: ClipWindow): number | null => {
  if (!video) return clip.stop;
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  if (clip.stop == null) return duration > 0 ? duration : null;
  return duration > 0 ? Math.min(duration, clip.stop) : clip.stop;
};

function clipVideo(getClip: () => ClipWindow, onTime?: (t: number) => void) {
  const el = ref<HTMLVideoElement>();
  const finished = ref(false);

  const freeze = () => {
    const video = el.value;
    if (!video) return;
    const stop = getClipStop(video, getClip());
    if (stop != null) video.currentTime = Math.max(getClip().start, stop - 1 / 60);
    video.pause();
    finished.value = true;
  };

  const reset = () => {
    finished.value = false;
    const video = el.value;
    if (!video) return;
    video.pause();
    video.currentTime = getClip().start;
    onTime?.(video.currentTime);
  };

  const onLoadedMetadata = () => {
    const video = el.value;
    if (!video) return;
    const clip = getClip();
    const stop = getClipStop(video, clip);
    video.currentTime = stop == null ? clip.start : Math.min(clip.start, stop);
  };

  const onTimeUpdate = () => {
    const video = el.value;
    if (!video) return;
    if (!finished.value) {
      const stop = getClipStop(video, getClip());
      if (stop != null && video.currentTime >= stop - 1 / 120) freeze();
    }
    onTime?.(video.currentTime);
  };

  const setPlaying = (playing: boolean) => {
    const video = el.value;
    if (!video) return;
    video.loop = false;
    const clip = getClip();
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

  return { el, finished, freeze, reset, setPlaying, onLoadedMetadata, onTimeUpdate, onEnded: freeze };
}

// Progressive transcript reveal, paced by fovea playback (fraction of duration).
const reveal = reactive<Record<Side, number>>({ left: 0, right: 0 });
const shownTokens = computed<Record<Side, number>>(() => ({
  left: Math.ceil(reveal.left * transcript.left.prediction.length),
  right: Math.ceil(reveal.right * transcript.right.prediction.length),
}));

const clip = (key: VideoKey) => clipWindows.value[key];
const wide = clipVideo(
  () => clip("wide"),
  (t) => {
    roiTime.left = t;
    roiTime.right = t;
  },
);
const split: Record<Side, ReturnType<typeof clipVideo>> = {
  left: clipVideo(() => clip("splitLeft"), (t) => (roiTime.left = t)),
  right: clipVideo(() => clip("splitRight"), (t) => (roiTime.right = t)),
};
const zoom: Record<Side, ReturnType<typeof clipVideo>> = {
  left: clipVideo(() => clip("zoomLeft")),
  right: clipVideo(() => clip("zoomRight")),
};
const fovea: Record<Side, ReturnType<typeof clipVideo>> = {
  left: clipVideo(() => clip("foveaLeft"), (t) => setReveal("left", t)),
  right: clipVideo(() => clip("foveaRight"), (t) => setReveal("right", t)),
};
const track: Record<Side, ReturnType<typeof clipVideo>> = {
  left: clipVideo(() => clip("foveaLeft")),
  right: clipVideo(() => clip("foveaRight")),
};
const allVideos = [wide, ...sides.flatMap((side) => [split[side], zoom[side], fovea[side], track[side]])];

// Template refs inside v-for are collected into arrays by Vue, so bind each
// video element through a function ref instead.
const bindEl = (video: ReturnType<typeof clipVideo>) => (el: unknown) => {
  video.el.value = (el as HTMLVideoElement | null) ?? undefined;
};

function setReveal(side: Side, t: number) {
  const duration = fovea[side].el.value?.duration;
  reveal[side] = duration && Number.isFinite(duration) && duration > 0 ? Math.min(1, t / duration) : 0;
}

const meta: Record<
  Side,
  { roiClass: string; label: string; color: string; zoomSrc: string; foveaSrc: string; trackSrc: string }
> = {
  left: {
    roiClass: "roi-blue",
    label: "Conversation A",
    color: "var(--camera-right)",
    zoomSrc: zoomLeftVideo,
    foveaSrc: foveaLeftVideo,
    trackSrc: trackLeftVideo,
  },
  right: {
    roiClass: "roi-red",
    label: "Conversation B",
    color: "var(--camera-left)",
    zoomSrc: zoomRightVideo,
    foveaSrc: foveaRightVideo,
    trackSrc: trackRightVideo,
  },
};

// -------------------------------------------------------------------- stages
// 1 wide plays → 2 (transient) wide finishes & freezes → 3 split panels →
// 4 zoom into ROI, crossfade to low-res crops → 5 swipe to FoveaCam w/ audio →
// 6 face-track overlay + transcripts.

async function finishWideTransition() {
  const video = wide.el.value;
  if (!video) return;
  const clipWindow = clip("wide");

  wide.finished.value = false;
  video.loop = false;
  if (video.currentTime < clipWindow.start) video.currentTime = clipWindow.start;

  const stop = getClipStop(video, clipWindow);
  const remaining = stop != null ? stop - video.currentTime : Number.POSITIVE_INFINITY;
  if (stop != null && remaining <= 0.05) return wide.freeze();

  await video.play().catch(() => {});

  await new Promise<void>((resolve) => {
    let done = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const complete = () => {
      if (done) return;
      done = true;
      video.removeEventListener("ended", complete);
      video.removeEventListener("pause", onPause);
      if (timeoutId) clearTimeout(timeoutId);
      wide.freeze();
      resolve();
    };

    const onPause = () => {
      const currentStop = getClipStop(video, clipWindow);
      if (video.ended || (currentStop != null && currentStop - video.currentTime <= 0.05)) complete();
    };

    video.addEventListener("ended", complete, { once: true });
    video.addEventListener("pause", onPause);

    if (Number.isFinite(remaining) && remaining > 0) timeoutId = setTimeout(complete, remaining * 1000 + 120);
  });
}

const stage = useStage(6, { preview: 3 }).transient(2, finishWideTransition);

const zoomed = computed(() => stage.value >= 4);
const wideScale = computed(() => Math.max(1, stage.value <= 1 ? props.wideVideoStartScale : props.wideVideoScale));

// Once the 0.9s panel zoom transform lands, crossfade from the CSS-zoomed
// split video to the pre-cropped low-res clips and start playing them.
const zoomSettled = ref(false);
let zoomSettleTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  [stage, isActive],
  ([currentStage, active]) => {
    if (zoomSettleTimer) {
      clearTimeout(zoomSettleTimer);
      zoomSettleTimer = undefined;
    }
    if (currentStage === 4 && active) {
      zoomSettleTimer = setTimeout(() => {
        zoomSettled.value = true;
      }, 950);
    } else {
      zoomSettled.value = currentStage > 4;
    }
  },
  { immediate: true },
);

// Freeze the ROI clock at each stage's reference time while nothing is playing.
watch(
  [clipWindows, stage],
  () => {
    if (stage.value <= 2) {
      roiTime.left = clip("wide").start;
      roiTime.right = clip("wide").start;
    } else if (stage.value === 3) {
      roiTime.left = clip("splitLeft").start;
      roiTime.right = clip("splitRight").start;
    }
  },
  { immediate: true },
);

const syncPlayback = () => {
  const active = isActive.value;
  const currentStage = stage.value;
  const splitPlaying = active && (currentStage === 3 || (currentStage === 4 && !zoomSettled.value));
  const zoomPlaying = active && currentStage === 4 && zoomSettled.value;
  const foveaPlaying = active && currentStage >= 5;

  wide.setPlaying(active && currentStage <= 2);
  for (const side of sides) {
    split[side].setPlaying(splitPlaying);
    zoom[side].setPlaying(zoomPlaying);
    // FoveaCam clips carry the conversation audio; the face-track overlays
    // play muted in lockstep purely for the stage-6 crossfade.
    const foveaEl = fovea[side].el.value;
    if (foveaEl) foveaEl.muted = !foveaPlaying;
    fovea[side].setPlaying(foveaPlaying);
    track[side].setPlaying(foveaPlaying);
  }
};

watch([stage, isActive, clipWindows, zoomSettled, ...allVideos.map((video) => video.el)], syncPlayback, { immediate: true });

watch(
  [stage, isActive],
  ([currentStage, active], [previousStage] = [0, false]) => {
    if (currentStage === 1 && active) {
      for (const video of allVideos) video.reset();
      reveal.left = 0;
      reveal.right = 0;
    } else if (currentStage < 5 && previousStage >= 5) {
      // Backing out of the FoveaCam stages restarts those clips cleanly.
      for (const side of sides) {
        fovea[side].reset();
        track[side].reset();
      }
    } else if (currentStage < 4 && previousStage >= 4) {
      for (const side of sides) zoom[side].reset();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (zoomSettleTimer) clearTimeout(zoomSettleTimer);
  for (const video of allVideos) video.el.value?.pause();
});
</script>

<template>
  <div class="lip-reading" :data-stage="stage" :style="{ '--wide-scale': String(wideScale) }">
    <div class="stage-area">
      <div class="wide-frame" :class="{ active: stage < 3 }">
        <div class="frame-center">
          <div class="video-canvas wide-canvas">
            <video
              :ref="bindEl(wide)"
              class="media-video"
              :src="wideVideo"
              :poster="widePoster"
              muted
              playsinline
              preload="auto"
              @loadedmetadata="wide.onLoadedMetadata"
              @ended="wide.onEnded"
              @timeupdate="wide.onTimeUpdate"
            />
            <div v-for="side in sides" :key="side" class="roi" :class="meta[side].roiClass" :style="roiStyle[side]" />
          </div>
        </div>
      </div>

      <div class="multi-frame" :class="{ active: stage >= 3 }">
        <div class="split-layer" :class="{ show: stage >= 3 }">
          <div v-for="side in sides" :key="side" class="panel">
            <div class="frame-center">
              <div class="video-canvas panel-zoom" :style="{ transform: zoomed ? zoomTransform[side] : undefined }">
                <video
                  :ref="bindEl(split[side])"
                  class="media-video"
                  :src="wideVideo"
                  muted
                  playsinline
                  preload="auto"
                  @loadedmetadata="split[side].onLoadedMetadata"
                  @ended="split[side].onEnded"
                  @timeupdate="split[side].onTimeUpdate"
                />
                <div class="roi" :class="[meta[side].roiClass, { hide: zoomed }]" :style="roiStyle[side]" />
              </div>
            </div>
            <!-- Pre-cropped low-res clip, crossfaded in once the zoom lands. -->
            <video
              :ref="bindEl(zoom[side])"
              class="media-video crop-video"
              :class="{ show: zoomSettled }"
              :src="meta[side].zoomSrc"
              muted
              playsinline
              preload="auto"
              @loadedmetadata="zoom[side].onLoadedMetadata"
              @ended="zoom[side].onEnded"
              @timeupdate="zoom[side].onTimeUpdate"
            />
          </div>
        </div>

        <div class="fovea-layer" :class="{ show: stage >= 5 }">
          <div v-for="side in sides" :key="side" class="panel">
            <video
              :ref="bindEl(fovea[side])"
              class="media-video"
              :src="meta[side].foveaSrc"
              muted
              playsinline
              preload="auto"
              @loadedmetadata="fovea[side].onLoadedMetadata"
              @ended="fovea[side].onEnded"
              @timeupdate="fovea[side].onTimeUpdate"
            />
            <!-- Face-tracking render, crossfaded in at stage 6. -->
            <video
              :ref="bindEl(track[side])"
              class="media-video track-video"
              :class="{ show: stage >= 6 }"
              :src="meta[side].trackSrc"
              muted
              playsinline
              preload="auto"
              @loadedmetadata="track[side].onLoadedMetadata"
              @ended="track[side].onEnded"
              @timeupdate="track[side].onTimeUpdate"
            />
          </div>
        </div>

        <div class="transition-label" :class="{ show: stage >= 4 }">
          {{ stage >= 5 ? "FoveaCam · high-res" : "Wide-angle crop · low-res" }}
        </div>
      </div>
    </div>

    <div class="transcript-grid" :class="{ show: stage >= 6 }">
      <div v-for="side in sides" :key="side" class="transcript-column" :style="{ '--roi-color': meta[side].color }">
        <div class="conversation-label">{{ meta[side].label }}</div>
        <div class="transcript-box">
          <div class="transcript-label">Prediction (lip reading)</div>
          <p>
            <span
              v-for="(token, index) in transcript[side].prediction"
              :key="index"
              class="token"
              :class="{ correct: token.correct, on: index < shownTokens[side] }"
            >
              {{ token.text }}
            </span>
          </p>
        </div>
        <div class="transcript-box gt-box">
          <div class="transcript-label">Ground truth</div>
          <p class="gt-text">{{ transcript[side].gt }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lip-reading {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 0.8rem;
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
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.wide-frame {
  height: 100%;
  aspect-ratio: 3 / 2;
}

.multi-frame {
  width: 100%;
  aspect-ratio: 3;
  position: absolute;
  inset: 0;
  margin: auto;
}

.wide-frame.active,
.multi-frame.active {
  opacity: 1;
  pointer-events: auto;
}

/* Centers a 4:3 video canvas inside its (wider-cropped) frame; the canvas
   shares the video's aspect so normalized ROI coords map 1:1 onto it. */
.frame-center {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.video-canvas {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
}

.wide-canvas {
  transform: scale(var(--wide-scale, 1));
  transition: transform var(--transition-duration) var(--transition-curve);
}

.panel-zoom {
  transform-origin: center;
  transition: transform 0.9s cubic-bezier(0.6, 0, 0.2, 1);
}

.media-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.roi {
  position: absolute;
  outline-width: 2px;
  outline-style: solid;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.5);
  opacity: 1;
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    top var(--transition-duration) var(--transition-curve),
    left var(--transition-duration) var(--transition-curve),
    width var(--transition-duration) var(--transition-curve),
    height var(--transition-duration) var(--transition-curve);
}

.roi.hide {
  opacity: 0;
}

.roi-red {
  color: var(--camera-left);
  outline-color: var(--camera-left);
}

.roi-blue {
  color: var(--camera-right);
  outline-color: var(--camera-right);
}

.split-layer {
  position: absolute;
  inset: 0;
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
  overflow: hidden;
}

.panel + .panel {
  border-left: 1px solid rgba(255, 255, 255, 0.25);
}

.crop-video {
  z-index: 2;
  opacity: 0;
  transition: opacity 0.6s ease-in-out;
}

.crop-video.show {
  opacity: 1;
}

.fovea-layer {
  position: absolute;
  inset: 0;
  /* Above the split layer's z-index:2 crop videos, below the label pill. */
  z-index: 3;
  display: grid;
  grid-template-columns: 1fr 1fr;
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.85s cubic-bezier(0.6, 0, 0.2, 1);
}

.fovea-layer.show {
  clip-path: inset(0);
}

.track-video {
  z-index: 2;
  opacity: 0;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.track-video.show {
  opacity: 1;
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
  white-space: nowrap;
  opacity: 0;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.transition-label.show {
  opacity: 1;
}

/* Collapsed until stage 6 so the video stages get the full canvas, then the
   transcripts push in from the bottom. The max-height layout transition is a
   deliberate one-shot reflow (bounded, never mid-video-frame-loop). */
.transcript-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  gap: 0.8rem;
  width: 100%;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  transform: translateY(0.6rem);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve),
    max-height var(--transition-duration) var(--transition-curve);
}

.transcript-grid.show {
  max-height: 20rem;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.transcript-column {
  display: grid;
  grid-template-rows: auto auto auto;
  align-content: start;
  gap: 0.35rem;
  min-width: 0;
}

.conversation-label {
  font-size: 0.66rem;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  opacity: 0.85;
  padding-left: 0.42rem;
  border-left: 3px solid var(--roi-color, currentColor);
}

.transcript-box {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 0.45rem;
  background: var(--bg-soft);
}

.transcript-label {
  margin-bottom: 0.12rem;
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.7;
}

.transcript-box p {
  margin: 0;
  font-size: 0.62rem;
  line-height: 1.35;
}

.token {
  /* inline-block restores soft-wrap points: Vue condenses the template
     whitespace between the token spans away entirely. */
  display: inline-block;
  margin-right: 0.26rem;
  color: var(--text-1);
  opacity: 0;
  transition: opacity 0.3s var(--transition-curve);
}

.token.on {
  opacity: 1;
}

.token.correct {
  color: var(--green-1);
  background: var(--green-soft);
  border-radius: 0.2rem;
  padding: 0.02rem 0.14rem;
}

.gt-box {
  border-color: color-mix(in srgb, var(--roi-color, currentColor) 45%, transparent);
}

.gt-text {
  color: var(--text-2);
}
</style>
