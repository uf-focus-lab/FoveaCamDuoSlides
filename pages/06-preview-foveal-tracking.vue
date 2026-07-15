<script setup lang="ts">
import { useIsSlideActive } from "@slidev/client";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useStage } from "stores/stage";
import wideImage from "assets/results-upfront/wide.webp";
import leftImage from "assets/results-upfront/left.webp";
import rightImage from "assets/results-upfront/right.webp";

// Zoom region, defined by its centre and a single scale ratio relative to the
// original frame — so the box aspect ratio is strictly the frame's (4:3) and
// cannot drift. All values are fractions of the frame in [0, 1]. Fine-tune these.
const boxCenter = { x: 0.5035, y: 0.4448 };
const boxScale = 1 / 9; // box spans 15% of the frame in each dimension

const stage = useStage(5, { preview: 2 });
const showBox = computed(() => stage.value >= 2); // viewbox drawn, rest dimmed
const zoomed = computed(() => stage.value >= 3); // magnify the wide slice
const showFovea = computed(() => stage.value >= 4); // wipe in the left fovea
const looping = computed(() => stage.value >= 5); // cross-fade left/right

// Effective (35 mm-equivalent) focal lengths from the manual-control calibration
// intrinsics: f_eq = 43.267 mm (35 mm diagonal) × f_px / 1800 px (1440×1080
// sensor diagonal), same convention as the iPhone EXIF. The fovea's f_px is
// exactly 9× the wide's — matching boxScale = 1/9 — so the wide's digital crop
// reaches the same focal length as the optical fovea.
const WIDE_EFL = 76.48; // wide camera (IMX273), f_px ≈ 3182
const FOVEA_EFL = 688.3; // fovea camera, f_px ≈ 28637
const zoomEfl = computed(() => Math.round(WIDE_EFL / boxScale)); // wide cropped to the ROI

// Caption for the main tile, printed like the EXIF strip in a fine photo's
// margin — one line per stage (1-indexed), cross-faded as the stage advances.
// The effective (35 mm-equivalent) focal length is the headline value; exposure
// / ISO fields are still placeholders.
const captions = computed(() => [
  {
    efl: `${Math.round(WIDE_EFL)} mm eq`,
    label: "Wide",
    params: "IMX273 · 1440×1080 · 25° × 19° FOV",
  },
  {
    efl: `${Math.round(WIDE_EFL)} mm eq`,
    label: "Region of Interest",
    params: "2.8° × 2.1° · 1/9 crop",
  },
  {
    efl: `${zoomEfl.value} mm eq`,
    label: "9× Digital Zoom",
    params: "160 × 120 px · 0.02 MP",
  },
  {
    efl: `${Math.round(FOVEA_EFL)} mm eq`,
    label: "Fovea · Left",
    params: "1440×1080 · 9× optical",
  },
  {
    efl: `${Math.round(FOVEA_EFL)} mm eq`,
    label: "Stereo Fovea",
    params: "200 mm baseline · 0.4° vergence",
  },
]);
const mainCaptionIndex = computed(() =>
  Math.min(stage.value, captions.value.length),
);

// Single source of truth for the region edges (% of frame). Before stage 2 the
// region is the whole frame; from stage 2 it collapses onto the box. The dim
// overlay's hole and its stroke both derive from this and share one transition,
// so the stroke stays welded to the dimming edge at every frame.
const inset = computed(() => {
  if (!showBox.value) return { top: 0, right: 0, bottom: 0, left: 0 };
  const h = boxScale / 2;
  return {
    top: (boxCenter.y - h) * 100,
    left: (boxCenter.x - h) * 100,
    right: (1 - (boxCenter.x + h)) * 100,
    bottom: (1 - (boxCenter.y + h)) * 100,
  };
});
// The dim overlay covers everything *except* the box (an even-odd rectangular
// hole), so the box stays crisp and full-colour while the surround is dimmed and
// desaturated. Its stroke child sits on that same hole edge — the single box.
const dimClip = computed(() => {
  const i = inset.value;
  const [l, t, r, b] = [i.left, i.top, 100 - i.right, 100 - i.bottom];
  return `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${l}% ${t}%, ${r}% ${t}%, ${r}% ${b}%, ${l}% ${b}%, ${l}% ${t}%)`;
});
const strokeStyle = computed(() => {
  const i = inset.value;
  return {
    top: `${i.top}%`,
    right: `${i.right}%`,
    bottom: `${i.bottom}%`,
    left: `${i.left}%`,
  };
});

// Transform that maps the box region onto the whole frame (origin top-left).
const zoomTransform = computed(() => {
  const s = 1 / boxScale;
  const tx = -(boxCenter.x - boxScale / 2) * 100 * s;
  const ty = -(boxCenter.y - boxScale / 2) * 100 * s;
  return `translate(${tx}%, ${ty}%) scale(${s})`;
});

// Infinite left/right cross-fade, only while the slide is live and on stage 5.
const showRight = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;
const isActive = useIsSlideActive();

watch(
  [looping, isActive],
  ([run, active]) => {
    clearInterval(timer);
    timer = undefined;
    if (!run || !active) {
      showRight.value = false;
      return;
    }
    timer = setInterval(() => (showRight.value = !showRight.value), 600);
  },
  { immediate: true },
);
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div class="preview" :data-stage="stage">
    <!-- Main tile: wide → zoom → fovea, with its per-stage metadata caption. -->
    <div class="tile tile-main">
      <div class="frame">
        <!-- Wide angle plus its dim overlay; both live in the zoomer so the whole
             thing magnifies the slice at stage 3. The dim surround and its stroke
             are carried outward by the zoom into the clipped overflow, rather than
             fading, so the box edge dissolves into the frame edge. -->
        <div
          class="zoomer"
          :class="{ zoomed }"
          :style="{ transform: zoomed ? zoomTransform : undefined }"
        >
          <!-- Two stacked copies: pixelated underneath, interpolated on top. As
               the zoom magnifies the slice, the interpolated copy fades out to
               reveal the pixel blocks beneath. -->
          <img class="wide wide-pixel" :src="wideImage" alt="" aria-hidden="true" />
          <img class="wide wide-smooth" :src="wideImage" alt="Wide-angle view" />
          <div class="dim" :class="{ show: showBox }" aria-hidden="true">
            <img
              class="dim-fill"
              :src="wideImage"
              :style="{ clipPath: dimClip }"
              alt=""
            />
            <div class="dim-stroke" :style="strokeStyle" />
          </div>
        </div>

        <!-- Fovea pair: left is the base, right cross-fades on top; the layer
             wipes in left-to-right to contrast against the pixelated wide slice. -->
        <div class="fovea" :class="{ show: showFovea }">
          <img class="fovea-img" :src="leftImage" alt="Left fovea view" />
          <img
            class="fovea-img fovea-right"
            :src="rightImage"
            alt="Right fovea view"
            :style="{ opacity: showRight ? 1 : 0 }"
          />
        </div>
      </div>

      <div class="caption" aria-live="polite">
        <p
          v-for="(c, i) in captions"
          :key="i"
          class="caption-line"
          :class="{ show: mainCaptionIndex === i + 1 }"
        >
          <span class="cap-efl">{{ c.efl }}</span>
          <span class="cap-label">{{ c.label }}</span>
          <span class="cap-sep">—</span>
          <span class="cap-params">{{ c.params }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview {
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  width: 100%;
  height: 100%;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  min-width: 0;
  min-height: 0;
}

.frame {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 0.5rem;
  isolation: isolate;
  background: #000;
  box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 14%, transparent);

  /* Shared timing for the region collapse: the dim hole and its stroke both
     animate with this, so the stroke stays glued to the dim boundary. */
  --roi-collapse: 0.7s var(--transition-curve);
}

.zoomer,
.fovea {
  position: absolute;
  inset: 0;
}

.zoomer {
  transform-origin: 0 0;
  transition: transform 0.9s cubic-bezier(0.6, 0, 0.2, 1);
}

.wide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Bottom copy: nearest-neighbour, so once magnified it shows real pixel blocks. */
.wide-pixel {
  image-rendering: pixelated;
}

/* Top copy: smooth (interpolated). Sits over the pixelated one until the zoom,
   then fades out to reveal the blocks beneath. */
.wide-smooth {
  transition: opacity 0.9s ease-in;
}

.zoomer.zoomed .wide-smooth {
  opacity: 0;
}

.dim {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.35s var(--transition-curve);
}

.dim.show {
  opacity: 1;
}

.dim-fill {
  /* A dimmed/desaturated copy of the wide image, clipped to a hole around the
     box so the crisp original below shows through the box, undimmed. */
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(0.9) brightness(0.5);
  transition: clip-path var(--roi-collapse);
}

.dim-stroke {
  /* Outline (not border) so the stroke sits just *outside* the box edge; at full
     zoom the box edge maps to the frame edge, carrying the stroke into the
     clipped overflow instead of leaving a ring inside the frame. The small
     offset pushes it fully clear of the edge so sub-pixel rounding at high zoom
     can't leak a red sliver back inside; unzoomed it's an imperceptible gap. */
  position: absolute;
  outline: 2px solid var(--camera-left);
  outline-offset: 1px;
  transition:
    top var(--roi-collapse),
    right var(--roi-collapse),
    bottom var(--roi-collapse),
    left var(--roi-collapse);
}

.fovea {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.8s cubic-bezier(0.6, 0, 0.2, 1);
}

.fovea.show {
  clip-path: inset(0);
}

.fovea-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fovea-right {
  transition: opacity 0.2s ease-in-out;
}

.caption {
  flex: none;
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 1.4rem;
}

.caption-line {
  position: absolute;
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 0.55em;
  white-space: nowrap;
  font-family: "Times New Roman", Times, serif;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  /* Lining (title) figures sit on the baseline with the uppercase text, unlike
     Georgia's old-style figures that hang below it. */
  font-variant-numeric: lining-nums tabular-nums;
  color: color-mix(in srgb, currentColor 88%, transparent);
  opacity: 0;
  transition: opacity 0.5s var(--transition-curve);
}

.caption-line.show {
  opacity: 1;
}

.cap-efl {
  /* Effective focal length — the headline value on every stage. */
  font-size: 1.15em;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: currentColor;
}

.cap-label {
  letter-spacing: 0.11em;
  color: currentColor;
}

.cap-sep {
  opacity: 0.5;
}
</style>
