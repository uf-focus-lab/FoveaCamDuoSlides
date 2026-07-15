<script setup lang="ts">
import { useIsSlideActive } from "@slidev/client";
import FigureSvg from "assets/convergent-stereo/figure.svg";
import CrossSectionSvg from "assets/cross-section.svg";
import Focus from "assets/logos/focus.svg";
import ufEceLogo from "assets/logos/uf-ece.webp";
import CrypsisSimulationFrame from "../pages/07B-crypsis-simulation-frame.vue";
import { computed, ref, watch } from "vue";
import Simulation from "../crypsis-simulation/lib/simulation";
import { useStage } from "stores/stage";

interface Tile {
  label: string;
  src: string;
  alt: string;
  stage: number;
}

const props = withDefaults(
  defineProps<{
    crypsisZoom?: number;
    crypsisCenterX?: number;
    crypsisCenterY?: number;
    crypsisCropX?: number;
    crypsisCropY?: number;
  }>(),
  {
    crypsisZoom: 1.32,
    crypsisCenterX: 50,
    crypsisCenterY: 50,
  },
);

const isActive = useIsSlideActive();
const runId = ref(0);
const stage = useStage(4, { preview: -1 });
const sim = new Simulation("mission");
const thanks = computed(() => stage.value === 4);

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

const driftUrls = import.meta.glob(
  "../assets/drift/*.{png,jpg,jpeg,webp,avif,gif}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const driftAsset = (name: string) => driftUrls[`../assets/drift/${name}`] ?? "";

const crypsisAsset = (name: string) =>
  crypsisUrls[`../assets/crypsis/${name}`] ?? "";
const structureAsset = (name: string) =>
  structureUrls[`../assets/structure/${name}`] ?? "";
const algAsset = (name: string) =>
  (import.meta.glob("../assets/alg_example/*.{png,jpg,jpeg,webp,avif,gif}", {
    eager: true,
    import: "default",
    query: "?url",
  })[`../assets/alg_example/${name}`] as string) ?? "";

const cameraImplementationImage = driftAsset("on-tripod.webp");
const wideSample = algAsset("fovea-left.webp");
const disparitySample = algAsset("disparity.webp");
const crypsisImage = crypsisAsset("crypsis.webp");

watch(
  isActive,
  (active) => {
    if (active) runId.value += 1;
  },
  { immediate: true },
);

const zoom = computed(() => Math.max(1, props.crypsisZoom));
const clampCenterForZoom = (value: number, zoomFactor: number) => {
  const min = 50 / zoomFactor;
  const max = 100 - min;
  return Math.min(max, Math.max(min, value));
};
const centerX = computed(() =>
  clampCenterForZoom(props.crypsisCenterX, zoom.value),
);
const centerY = computed(() =>
  clampCenterForZoom(props.crypsisCenterY, zoom.value),
);

const frameStyle = computed(() => ({
  width: `${zoom.value * 100}%`,
  height: `${zoom.value * 100}%`,
  left: `${props.crypsisCropX ?? 50 - (centerX.value / 100) * zoom.value * 100}%`,
  top: `${props.crypsisCropY ?? 50 - (centerY.value / 100) * zoom.value * 100}%`,
}));

const tiles: Tile[] = [
  {
    label: "Biological Inspiration",
    src: "",
    alt: "Crypsis simulation",
    stage: 1,
  },
  {
    label: "Camera Implementation",
    src: cameraImplementationImage,
    alt: "Base camera structure render",
    stage: 2,
  },
  {
    label: "Dataset / Algorithm",
    src: "",
    alt: "Convergent stereo pipeline diagram",
    stage: 3,
  },
];

const showThankYou = computed(() => stage.value >= 4);
</script>

<template>
  <section class="recap-shell" :class="{ thanks }">
    <div class="recap-grid" aria-label="Recap image tiles">
      <article
        class="recap-tile"
        :class="{
          revealed: stage >= 1,
          dimmed: stage >= 1 && stage < 4 && stage !== tiles[0].stage,
        }"
      >
        <div
          class="tile-crypsis-viewport"
          :aria-label="tiles[0].alt"
          role="img"
        >
          <div :key="runId" class="tile-frame" :style="frameStyle">
            <CrypsisSimulationFrame
              :sim="sim"
              :stage="stage"
              style="--frame-left: 0%"
            />
          </div>
        </div>
        <p class="tile-label">{{ tiles[0].label }}</p>
      </article>

      <div class="v-divider" aria-hidden="true"></div>

      <article
        class="recap-tile stacked-column"
        :class="{
          revealed: stage >= 1,
          dimmed: stage >= 1 && stage < 4 && stage !== tiles[1].stage,
        }"
      >
        <div class="stack-top">
          <img :src="tiles[1].src" :alt="tiles[1].alt" class="tile-image" />
        </div>
        <div class="stack-bottom svg-wrapper">
          <CrossSectionSvg class="section-svg" />
        </div>
        <p class="tile-label">{{ tiles[1].label }}</p>
      </article>

      <div class="v-divider" aria-hidden="true"></div>

      <article
        class="recap-tile stacked-column"
        :class="{
          revealed: stage >= 1,
          dimmed: stage >= 1 && stage < 4 && stage !== tiles[2].stage,
        }"
      >
        <div
          class="stack-top pipeline-preview"
          role="img"
          :aria-label="tiles[2].alt"
        >
          <FigureSvg class="pipeline-svg" />
        </div>
        <div class="stack-bottom images-row">
          <img :src="wideSample" alt="Wide stereo sample" class="half-image" />
          <img
            :src="disparitySample"
            alt="Disparity sample"
            class="half-image"
          />
        </div>
        <p class="tile-label">{{ tiles[2].label }}</p>
      </article>
    </div>

    <h2 class="thanks-title">Thank You</h2>
    <div class="thanks-logos" aria-label="FOCUS and UF ECE logos">
      <div class="focus-lab-logo">
        <Focus role="img" aria-label="FOCUS Lab" />
        <span class="focus-lab-suffix">Lab</span>
      </div>
      <div class="h-div" aria-hidden="true"></div>
      <img
        :src="ufEceLogo"
        alt="University of Florida ECE"
        class="uf-ece-logo"
      />
    </div>
  </section>
</template>

<style scoped>
.recap-shell {
  position: absolute;
  top: 60px;
  left: 40px;
  right: 40px;
  bottom: 60px;
  overflow: visible;
  transition:
    top var(--transition-duration) var(--transition-curve),
    left var(--transition-duration) var(--transition-curve),
    right var(--transition-duration) var(--transition-curve),
    bottom var(--transition-duration) var(--transition-curve);
}

.recap-shell .thanks-title,
.recap-shell .thanks-logos {
  opacity: 0;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.recap-shell.thanks .thanks-title,
.recap-shell.thanks .thanks-logos {
  opacity: 1;
}

.recap-shell.thanks {
  top: 120px;
  bottom: 120px;
}

.recap-grid {
  width: 100%;
  height: 100%;
  margin: 0.45rem 0 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 0 1rem;
  transition:
    -webkit-filter var(--transition-duration) var(--transition-curve),
    filter var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.recap-tile {
  position: relative;
  overflow: hidden;
  border-radius: 0;
  border: none;
  background: #020617;
  box-shadow: none;
  height: 100%;
  opacity: 0;
  transform: translateY(10px) scale(0.8);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.recap-tile.revealed {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.recap-tile.dimmed {
  opacity: 0.42;
  filter: blur(4px);
}

.v-divider {
  width: 2px;
  align-self: stretch;
  background: rgba(248, 250, 252, 0.12);
}

.tile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.tile-frame {
  position: absolute;
  display: block;
  border: 0;
}

.tile-crypsis-viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.stacked-column {
  display: flex;
  flex-direction: column;
}

.stack-top,
.stack-bottom {
  position: relative;
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow: hidden;
}

.svg-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #080f1e;
  padding-bottom: 2.2rem;
}

.section-svg {
  width: 80%;
  height: auto;
  max-height: 80%;
}

.images-row {
  display: flex;
  flex-direction: row;
  padding-bottom: 2.2rem;
  background: #020617;
}

.half-image {
  flex: 1;
  width: 50%;
  height: 100%;
  object-fit: cover;
  display: block;
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

.tile-label {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 0.55rem 0.75rem;
  background: linear-gradient(
    to top,
    rgba(2, 6, 23, 0.92),
    rgba(2, 6, 23, 0.08)
  );
  color: #f8fafc;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-align: center;
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
  font-size: 2em;
  font-weight: 650;
  letter-spacing: 0.02em;
  text-align: center;
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translate(-50%, -100%);
}

.thanks-logos {
  position: absolute;
  left: 50%;
  bottom: -120px;
  transform: translate(-50%, -100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
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
  width: 2px;
  height: 1.4em;
  background: var(--fc-fg);
  margin: 0 20px;
}

.uf-ece-logo {
  filter: brightness(0) invert(1);
  height: 1em;
  width: auto;
  transform: translateY(2px);
}
</style>
