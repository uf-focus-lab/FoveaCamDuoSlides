<script setup lang="ts">
import { useIsSlideActive } from "@slidev/client";
import FigureSvg from "assets/convergent-stereo/figure.svg";
import Focus from "assets/logos/focus.svg";
import ufEceLogo from "assets/logos/uf-ece.webp";
import { computed, ref, watch } from "vue";
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
const stage = useStage(4, { preview: -1 });

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

const crypsisAsset = (name: string) => crypsisUrls[`../assets/crypsis/${name}`] ?? "";
const structureAsset = (name: string) => structureUrls[`../assets/structure/${name}`] ?? "";

const cameraImplementationImage = structureAsset("Base.webp");

watch(
  isActive,
  (active) => {
    if (active) runId.value += 1;
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
  <section class="recap-shell">
    <div class="recap-grid" :class="{ fade: showThankYou }" aria-label="Recap image tiles">
      <article class="recap-tile top-left" :class="{ show: stage >= tiles[0].stage }">
        <iframe
          :key="runId"
          :src="frameSrc"
          :title="tiles[0].label"
          class="tile-frame"
          :style="frameStyle"
          loading="eager"
        />
        <p class="tile-label">{{ tiles[0].label }}</p>
      </article>

      <article class="recap-tile top-right" :class="{ show: stage >= tiles[1].stage }">
        <img :src="tiles[1].src" :alt="tiles[1].alt" class="tile-image" />
        <p class="tile-label">{{ tiles[1].label }}</p>
      </article>

      <article class="recap-tile bottom-center" :class="{ show: stage >= tiles[2].stage }">
        <div class="pipeline-preview" role="img" :aria-label="tiles[2].alt">
          <FigureSvg class="pipeline-svg" />
        </div>
        <p class="tile-label">{{ tiles[2].label }}</p>
      </article>
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
}

.recap-grid {
  width: min(1100px, 100%);
  margin: 0.45rem auto 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.recap-grid.fade {
  opacity: 0.13;
  transform: scale(0.99);
}

.recap-tile {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.42);
  background: #020617;
  box-shadow: inset 0 0 0 1px rgba(51, 65, 85, 0.55);
  opacity: 0;
  transform: translateY(14px) scale(0.985);
  transition:
    opacity 0.45s var(--transition-curve),
    transform 0.45s var(--transition-curve);
}

.recap-tile.show {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.top-left,
.top-right {
  aspect-ratio: 16 / 10;
}

.bottom-center {
  grid-column: 1 / -1;
  width: var(--recap-bottom-width, 52%);
  max-width: 100%;
  margin-inline: auto;
  justify-self: center;
  place-self: center;
  aspect-ratio: 16 / 10;
}

.tile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.tile-frame {
  border: 0;
  display: block;
  background: #0a1420;
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
  background: linear-gradient(to top, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0.08));
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
