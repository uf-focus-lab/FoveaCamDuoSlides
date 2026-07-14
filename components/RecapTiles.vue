<script setup lang="ts">
import { useIsSlideActive } from "@slidev/client";
import FigureSvg from "assets/convergent-stereo/figure.svg";
import calibrationVideo from "assets/calibration.webm";
import cameraImage from "assets/camera.webp";
import Focus from "assets/logos/focus.svg";
import ufEceLogo from "assets/logos/uf-ece.webp";
import { computed, ref, watch } from "vue";
import { useStage } from "stores/stage";

type TileKind = "image" | "frame" | "diagram" | "text" | "video";
type TileGroup = "center" | "bio" | "mech" | "data";

interface TilePlacement {
  col: [number, number];
  row: [number, number];
}

interface MosaicTile {
  title?: string;
  body?: string;
  src?: string;
  cropPosition?: string;
  alt: string;
  kind: TileKind;
  className: string;
  group: TileGroup;
  stage: number;
  placement: TilePlacement;
  tone?: "slate" | "teal" | "amber" | "rose";
}

const GRID_COLUMNS = 8;
const GRID_ROWS = 5;

const props = withDefaults(
  defineProps<{
    crypsisZoom?: number;
    crypsisCropX?: number;
    crypsisCropY?: number;
  }>(),
  {
    crypsisZoom: 1.32,
    crypsisCropX: -12,
    crypsisCropY: -12,
  },
);

const isActive = useIsSlideActive();
const runId = ref(0);
const stage = useStage(6, { preview: -1 });

const crypsisUrls = import.meta.glob(
  "../assets/crypsis/*.{png,jpg,jpeg,webp,avif,gif}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const structureUrls = import.meta.glob(
  "../assets/structure/*.{png,jpg,jpeg,webp,avif,gif}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const inspirationUrls = import.meta.glob(
  "../assets/inspiration/*.{png,jpg,jpeg,webp,avif,gif}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const calibrationUrls = import.meta.glob(
  "../assets/calibration/**/*.webp",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const resultsUpfrontUrls = import.meta.glob(
  "../assets/results-upfront/*.{png,jpg,jpeg,webp,avif,gif}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const resultsUrls = import.meta.glob(
  "../assets/depth-results/**/*.{png,jpg,jpeg,webp,avif,gif}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const crypsisAsset = (name: string) => crypsisUrls[`../assets/crypsis/${name}`] ?? "";
const structureAsset = (name: string) => structureUrls[`../assets/structure/${name}`] ?? "";
const inspirationAsset = (name: string) => inspirationUrls[`../assets/inspiration/${name}`] ?? "";
const calibrationAsset =
  (name: string) => calibrationUrls[`../assets/calibration/${name}`] ?? "";
const resultsUpfrontAsset =
  (name: string) => resultsUpfrontUrls[`../assets/results-upfront/${name}`] ?? "";
const resultsAsset =
  (name: string) => resultsUrls[`../assets/depth-results/${name}`] ?? "";

const cameraImplementationImage = structureAsset("Base.webp");
const cameraTransparentImage = structureAsset("Transparent.webp");
const cameraMetalImage = structureAsset("Metal.webp");
const crypsisImage = crypsisAsset("crypsis.webp");
const hawkImage = inspirationAsset("hawk.webp");
const geckoImage = inspirationAsset("tokay_gecko.webp");
const geometryImage = inspirationAsset("triangulation.webp");
const calibrationSetupImage = calibrationAsset("extrinsic/setup.webp");
const resultDataset = resultsAsset("left/22.webp");
const resultWideImage = resultsUpfrontAsset("wide.webp");

watch(
  isActive,
  (active) => {
    if (!active) return;
    runId.value += 1;

    // Re-trigger entry animation whenever the slide becomes active.
    if (stage.value !== 1) {
      stage.value = 1;
    }
    requestAnimationFrame(() => {
      if (isActive.value && stage.value === 1) {
        stage.value = 2;
      }
    });
  },
  { immediate: true },
);

const frameSrc = computed(
  () => `${import.meta.env.BASE_URL}crypsis-simulation/index.html?kiosk=1&run=${runId.value}`,
);

const frameStyle = computed(() => ({
  width: `${Math.max(1, props.crypsisZoom) * 100}%`,
  height: `${Math.max(1, props.crypsisZoom) * 100}%`,
  transform: `translate(${props.crypsisCropX}%, ${props.crypsisCropY}%)`,
}));

const mosaicTiles: MosaicTile[] = [
  {
    title: "",
    src: cameraImage,
    cropPosition: "55% 30%",
    alt: "FoveaCam center tile",
    kind: "image",
    className: "mosaic-camera",
    group: "center",
    stage: 2,
    placement: { col: [3, 6], row: [1.7, 4.2] },
  },
  {
    title: "",
    src: hawkImage,
    cropPosition: "45% 30%",
    alt: "Hawk biological eye inspiration",
    kind: "image",
    className: "bio-top",
    group: "bio",
    stage: 2,
    placement: { col: [1.5, 4.45], row: [0.76, 1.5] },
  },
  {
    title: "Crypsis Simulation",
    alt: "Crypsis simulation",
    kind: "frame",
    className: "bio-crypsis-frame",
    group: "bio",
    stage: 2,
    placement: { col: [0.82, 2.9], row: [1.65, 3.35] },
  },
  {
    title: "",
    src: geckoImage,
    alt: "Gecko biological eye inspiration",
    kind: "image",
    className: "bio-crypsis-still",
    group: "bio",
    stage: 2,
    placement: { col: [0.6, 1.95], row: [3.45, 4.95] },
  },
  {
    title: "Stereo",
    src: geometryImage,
    alt: "Stereo geometry and triangulation inspiration",
    kind: "image",
    className: "bio-note",
    group: "bio",
    stage: 2,
    placement: { col: [2.0, 2.9], row: [3.45, 4.95] },
  },
  {
    title: "Calibration",
    src: calibrationSetupImage,
    cropPosition: "45% 30%",
    alt: "Calibration setup image",
    kind: "image",
    className: "mech-top",
    group: "mech",
    stage: 2,
    placement: { col: [4.55, 6.15], row: [0.5, 1.52] },
  },
  {
    title: "",
    src: cameraImplementationImage,
    alt: "Transparent camera render",
    kind: "image",
    className: "mech-shell",
    group: "mech",
    stage: 2,
    placement: { col: [6.1, 9.12], row: [1.0, 3.2] },
  },
  {
    title: "",
    cropPosition: "50% 58%",
    alt: "Calibration turntable video",
    kind: "video",
    className: "mech-metal",
    group: "mech",
    stage: 2,
    placement: { col: [6.1, 8.1], row: [3.3, 4.65] },
  },
  // {
  //   title: "Mechanical Path",
  //   src: cameraMetalImage,
  //   cropPosition: "58% 52%",
  //   alt: "Metal camera render",
  //   kind: "image",
  //   className: "mech-note",
  //   group: "mech",
  //   stage: 2,
  //   placement: { col: [8.15, 8.95], row: [3.3, 4.95] },
  // },
  {
    title: "Convergent Stereo",
    alt: "Convergent stereo pipeline diagram",
    kind: "diagram",
    className: "data-pipeline",
    group: "data",
    stage: 2,
    placement: { col: [3.1, 5.95], row: [4.3, 5.95] },
  },
  {
    title: "Lip Reading",
    src: resultDataset,
    cropPosition: "50% 40%",
    alt: "Depth result sample left image",
    kind: "image",
    className: "data-summary",
    group: "data",
    stage: 2,
    placement: { col: [6.05, 9.1], row: [5.02, 6.4] },
  },
  {
    title: "Dataset",
    src: resultDataset,
    cropPosition: "50% 70%",
    alt: "Depth result sample wide image",
    kind: "image",
    className: "data-chip",
    group: "data",
    stage: 2,
    placement: { col: [0.86, 2.95], row: [5.12, 6.12] },
  },
];

const showThankYou = computed(() => stage.value >= 6);

const activeGroup = computed<TileGroup | null>(() => {
  if (stage.value === 3) return "bio";
  if (stage.value === 4) return "mech";
  if (stage.value === 5) return "data";
  return null;
});

const toneClass = (tone?: MosaicTile["tone"]) => (tone ? `tone-${tone}` : "");

const mediaStyle = (tile: MosaicTile) =>
  tile.cropPosition ? { objectPosition: tile.cropPosition } : undefined;

const tileFocusClass = (tile: MosaicTile) => {
  const focus = activeGroup.value;
  if (!focus || stage.value < 3) return "";
  return tile.group === focus ? "highlighted" : "muted";
};

const placementRectStyle = (placement: TilePlacement) => {
  const [colStart, colEnd] = placement.col;
  const [rowStart, rowEnd] = placement.row;

  return {
    left: `calc(${((colStart - 1) / GRID_COLUMNS) * 100}% + var(--grid-gap) / 2)`,
    top: `calc(${((rowStart - 1) / GRID_ROWS) * 100}% + var(--grid-gap) / 2)`,
    width: `calc(${((colEnd - colStart) / GRID_COLUMNS) * 100}% - var(--grid-gap))`,
    height: `calc(${((rowEnd - rowStart) / GRID_ROWS) * 100}% - var(--grid-gap))`,
  };
};

const placementStyle = (tile: MosaicTile) => placementRectStyle(tile.placement);
</script>

<template>
  <section class="recap-shell">
    <div class="recap-stage" :class="{ fade: showThankYou }" aria-label="Recap image tiles">
      <div class="mosaic-grid" aria-label="Recap mosaic">
        <article
          v-for="tile in mosaicTiles"
          :key="tile.className"
          class="mosaic-tile"
          :style="placementStyle(tile)"
          :class="[
            tile.className,
            toneClass(tile.tone),
            tileFocusClass(tile),
            {
              show: stage >= tile.stage,
            },
          ]"
        >
          <video
            v-if="tile.kind === 'video'"
            :src="calibrationVideo"
            :title="tile.title ?? tile.alt"
            class="tile-video"
            :style="mediaStyle(tile)"
            autoplay
            muted
            loop
            playsinline
          />
          <iframe
            v-else-if="tile.kind === 'frame'"
            :key="`${tile.className}-${runId}`"
            :src="frameSrc"
            :title="tile.title ?? tile.alt"
            class="tile-frame"
            :style="frameStyle"
            loading="eager"
          />
          <img
            v-else-if="tile.kind === 'image'"
            :src="tile.src"
            :alt="tile.alt"
            class="tile-image"
            :style="mediaStyle(tile)"
          />
          <div
            v-else-if="tile.kind === 'diagram'"
            class="pipeline-preview"
            role="img"
            :aria-label="tile.alt"
          >
            <FigureSvg class="pipeline-svg" />
          </div>
          <div v-else class="text-tile-copy">
            <p v-if="tile.title" class="tile-title">{{ tile.title }}</p>
            <p class="tile-body">{{ tile.body }}</p>
          </div>

          <div v-if="tile.kind !== 'text' && (tile.title || tile.body)" class="tile-caption">
            <p v-if="tile.title" class="tile-title">{{ tile.title }}</p>
            <p v-if="tile.body" class="tile-body">{{ tile.body }}</p>
          </div>
        </article>
      </div>
    </div>

    <div class="thanks-overlay" :class="{ show: showThankYou }" aria-live="polite">
      <h2 class="thanks-title">Thank You</h2>
      <div class="thanks-logos" aria-label="FOCUS and UF ECE logos">
        <a
          href="https://z-yx.cc/FOCUS"
          class="focus-lab-logo"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Focus role="img" aria-label="FOCUS Lab" />
          <span class="focus-lab-suffix">Lab</span>
        </a>
        <div class="h-div" aria-hidden="true"></div>
        <img :src="ufEceLogo" alt="University of Florida ECE" class="uf-ece-logo" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.recap-shell {
  position: relative;
  min-height: 34rem;
}

.recap-stage {
  position: relative;
  width: min(1400px, 100%);
  min-height: 34rem;
  margin: 0.45rem auto 0;
  overflow: visible;
  display: grid;
  place-items: center;
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.recap-stage.fade {
  opacity: 0.13;
  transform: scale(0.99);
}

.mosaic-tile {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.42);
  background: #020617;
  box-shadow: inset 0 0 0 1px rgba(51, 65, 85, 0.55);
  transition:
    border-color 0.45s var(--transition-curve),
    box-shadow 0.45s var(--transition-curve);
}

.tile-title,
.tile-body {
  margin: 0;
}

.mosaic-grid {
  --grid-gap: 0.8rem;
  position: relative;
  width: 100%;
  min-height: 25rem;
  overflow: visible;
  margin-inline: auto;
}

.mosaic-tile {
  position: absolute;
  min-height: 0;
  opacity: 0;
  transform-origin: center;
  --tile-enter-duration: 0.55s;
  --tile-enter-delay: 0s;
  --tile-enter-scale: 0.985;
  transform: translate(var(--tile-enter-x, 0), var(--tile-enter-y, 0))
    scale(var(--tile-enter-scale));
  transition:
    opacity var(--tile-enter-duration) var(--transition-curve),
    transform var(--tile-enter-duration) var(--transition-curve);
  transition-delay: var(--tile-enter-delay), var(--tile-enter-delay);
}

.mosaic-tile.show {
  opacity: 1;
  transform: translate(0, 0) scale(1);
}

.mosaic-tile.highlighted {
  opacity: 1;
  transform: translate(0, 0) scale(1.045);
  transition-delay: 0s, 0s;
  border-color: rgba(125, 211, 252, 0.95);
  box-shadow:
    inset 0 0 0 1px rgba(125, 211, 252, 0.8),
    0 0 0 1px rgba(56, 189, 248, 0.45),
    0 8px 24px rgba(14, 116, 144, 0.28);
  z-index: 7;
}

.mosaic-tile.muted {
  opacity: 0.35;
  transform: translate(0, 0) scale(0.985);
  transition-delay: 0s, 0s;
  border-color: rgba(71, 85, 105, 0.56);
}

.mosaic-camera {
  --tile-enter-x: 0px;
  --tile-enter-y: 0px;
  --tile-enter-scale: 0.68;
  --tile-enter-delay: 0s;
  --tile-enter-duration: 0.58s;
  border-radius: 26px 18px 20px 22px;
}

.bio-top {
  --tile-enter-x: -28px;
  --tile-enter-y: -34px;
  --tile-enter-delay: 0.03s;
  --tile-enter-duration: 0.54s;
  border-radius: 18px 18px 14px 14px;
}

.bio-crypsis-frame {
  --tile-enter-x: -40px;
  --tile-enter-y: -18px;
  --tile-enter-delay: 0.05s;
  --tile-enter-duration: 0.56s;
  border-radius: 24px 24px 14px 20px;
}

.bio-crypsis-still {
  --tile-enter-x: -34px;
  --tile-enter-y: 28px;
  --tile-enter-delay: 0.11s;
  --tile-enter-duration: 0.53s;
  border-radius: 18px 22px 28px 16px;
}

.bio-note {
  --tile-enter-x: -18px;
  --tile-enter-y: 32px;
  --tile-enter-delay: 0.16s;
  --tile-enter-duration: 0.58s;
  border-radius: 20px 18px 24px 16px;
}

.mech-top {
  --tile-enter-x: 28px;
  --tile-enter-y: -34px;
  --tile-enter-delay: 0.06s;
  --tile-enter-duration: 0.55s;
  border-radius: 18px 18px 14px 14px;
}

.mech-shell {
  --tile-enter-x: 40px;
  --tile-enter-y: -18px;
  --tile-enter-delay: 0.08s;
  --tile-enter-duration: 0.57s;
  border-radius: 16px 24px 20px 22px;
}

.mech-metal {
  --tile-enter-x: 30px;
  --tile-enter-y: 22px;
  --tile-enter-delay: 0.13s;
  --tile-enter-duration: 0.54s;
  border-radius: 22px 18px 16px 26px;
}

.mech-note {
  --tile-enter-x: 36px;
  --tile-enter-y: 30px;
  --tile-enter-delay: 0.19s;
  --tile-enter-duration: 0.59s;
  border-radius: 24px 20px 16px 20px;
}

.data-pipeline {
  --tile-enter-x: -20px;
  --tile-enter-y: 36px;
  --tile-enter-delay: 0.1s;
  --tile-enter-duration: 0.56s;
  border-radius: 20px;
}

.data-summary {
  --tile-enter-x: 20px;
  --tile-enter-y: 36px;
  --tile-enter-delay: 0.15s;
  --tile-enter-duration: 0.57s;
  border-radius: 18px 22px 16px 20px;
}

.data-chip {
  --tile-enter-x: 34px;
  --tile-enter-y: 26px;
  --tile-enter-delay: 0.22s;
  --tile-enter-duration: 0.52s;
  border-radius: 24px 16px 24px 14px;
}

.tile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.tile-frame {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: #0a1420;
}

.tile-video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

.pipeline-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 42%, #0f172a 0%, #020617 78%);
}

.pipeline-preview :deep(*) {
  animation: none !important;
  transition: none !important;
}

.pipeline-preview :deep([data-step]) {
  opacity: 1 !important;
}

.pipeline-preview :deep(svg) {
  width: 84%;
  height: auto;
  background: transparent !important;
  background-color: transparent !important;
}

.tile-caption,
.text-tile-copy {
  position: absolute;
  inset: auto 0 0 0;
  padding: 0.8rem 0.9rem 0.85rem;
  background: linear-gradient(to top, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0.08));
  color: #f8fafc;
}

.text-tile-copy {
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: transparent;
}

.tile-title {
  font-size: 0.95rem;
  font-weight: 650;
  line-height: 1.15;
}

.tile-body {
  margin-top: 0.3rem;
  font-size: 0.82rem;
  line-height: 1.25;
  color: rgba(241, 245, 249, 0.82);
}

.tone-slate {
  background: linear-gradient(155deg, #0f172a, #111827 58%, #020617);
}

.tone-teal {
  background:
    radial-gradient(circle at top right, rgba(45, 212, 191, 0.24), transparent 54%),
    linear-gradient(155deg, #082f49, #0f172a 58%, #04111d);
}

.tone-amber {
  background:
    radial-gradient(circle at top left, rgba(251, 191, 36, 0.22), transparent 50%),
    linear-gradient(155deg, #422006, #1e293b 62%, #111827);
}

.tone-rose {
  background:
    radial-gradient(circle at center, rgba(251, 113, 133, 0.34), transparent 56%),
    linear-gradient(155deg, #3f0d1d, #1f2937 68%, #0f172a);
}

.thanks-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 2rem;
  opacity: 0;
  pointer-events: none;
  transform: translateY(0.75rem);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.thanks-overlay.show {
  opacity: 1;
  transform: translateY(0);
}

.thanks-title {
  margin: 0;
  font-size: clamp(2.4rem, 5.5vw, 3.9rem);
  font-weight: 650;
  letter-spacing: 0.02em;
  color: color-mix(in srgb, currentColor 92%, white 8%);
  text-align: center;
}

.thanks-logos {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: clamp(2rem, 5.2vw, 3.6rem);
  color: currentColor;
}

.focus-lab-logo {
  display: flex;
  color: white;
  font-weight: bold;
  text-decoration: none;
  align-items: center;
  justify-content: center;
  font-size: 1em;
  gap: 0.5ch;
  user-select: none;
}

.focus-lab-logo :deep(svg) {
  height: 1em;
  width: auto;
}

.focus-lab-suffix {
  line-height: 80%;
}

.h-div {
  width: 1px;
  height: 1.4em;
  background: var(--fc-fg);
  margin: 0 10px;
}

.uf-ece-logo {
  filter: brightness(0) invert(1);
  height: 1.2em;
  width: auto;
  transform: translateY(2px);
}
</style>
