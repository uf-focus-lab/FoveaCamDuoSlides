<script setup lang="ts">
import { computed, type CSSProperties } from "vue";
import { useStage } from "stores/stage";

interface FocusBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
  delayMs?: number;
}

interface DetailTile {
  src: string;
  alt: string;
  camera: "left" | "right";
}

interface AnaglyphTile {
  src: string;
  alt: string;
}

const stage = useStage(4);

// Resolve data-collection figures through Vite so they are hashed, copied into
// the build, and base-prefixed for subpath deploys (a bare "/assets/…" string
// would 404 on GitHub Pages). Keyed by path relative to assets/data-collection.
const assetUrls = import.meta.glob<string>(
  "../assets/data-collection/**/*.webp",
  { eager: true, query: "?url", import: "default" },
);
const asset = (name: string) =>
  assetUrls[`../assets/data-collection/${name}`];

const showWidePair = computed(() => stage.value >= 2);
const hideRightWide = computed(() => stage.value >= 3);
const showFocusAndDetails = computed(() => stage.value >= 4);

const roiBoxes: FocusBox[] = [
  {
    x: 43,
    y: 23,
    width: 15,
    height: 10,
    label: "Target A",
    color: "#22d3ee",
    delayMs: 0,
  },
  {
    x: 3,
    y: 55,
    width: 15,
    height: 10,
    label: "Target B",
    color: "#f97316",
    delayMs: 90,
  },
  {
    x: 55,
    y: 75,
    width: 15,
    height: 10,
    label: "Target C",
    color: "#84cc16",
    delayMs: 180,
  },
];

const detailTiles: DetailTile[] = [
  {
    src: asset("left_fovea/22.webp"),
    alt: "Left fovea sample 22",
    camera: "left",
  },
  {
    src: asset("right_fovea/22.webp"),
    alt: "Right fovea sample 22",
    camera: "right",
  },
  {
    src: asset("left_fovea/45.webp"),
    alt: "Left fovea sample 45",
    camera: "left",
  },
  {
    src: asset("right_fovea/45.webp"),
    alt: "Right fovea sample 45",
    camera: "right",
  },
  {
    src: asset("left_fovea/68.webp"),
    alt: "Left fovea sample 68",
    camera: "left",
  },
  {
    src: asset("right_fovea/68.webp"),
    alt: "Right fovea sample 68",
    camera: "right",
  },
];

const anaglyphTiles: AnaglyphTile[] = [
  {
    src: asset("diff/22.webp"),
    alt: "Anaglyph composite 22",
  },
  {
    src: asset("diff/45.webp"),
    alt: "Anaglyph composite 45",
  },
  {
    src: asset("diff/22.webp"),
    alt: "Anaglyph composite placeholder",
  },
];

function boxStyle(box: FocusBox): CSSProperties {
  return {
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
    "--box-color": box.color,
    "--box-delay": `${box.delayMs ?? 0}ms`,
  } as CSSProperties;
}

function tileStyle(index: number): CSSProperties {
  const row = Math.floor(index / 2) + 2;
  const column = (index % 2) + 1;
  const camera = detailTiles[index].camera;

  return {
    "--camera-color":
      camera === "left" ? "var(--camera-left)" : "var(--camera-right)",
    "--tile-delay": `${index * 85}ms`,
    gridColumn: String(column),
    gridRow: String(row),
  } as CSSProperties;
}

function anaglyphStyle(index: number): CSSProperties {
  return {
    "--tile-delay": `${(detailTiles.length + index) * 85}ms`,
    gridColumn: "3",
    gridRow: String(index + 2),
  } as CSSProperties;
}
</script>

<template>
  <div
    class="storyboard"
    :class="{
      'show-wide-pair': showWidePair,
      'hide-right-wide': hideRightWide,
      'show-focus-and-details': showFocusAndDetails,
    }"
    aria-label="Data collection storyboard controlled by left/right arrow keys"
  >
    <div class="wide-angle-label" aria-hidden="true">Wide Angle</div>

    <div class="storyboard-main">
      <section class="wide-slot left-slot">
        <figure class="wide-card left-card">
          <img
            class="wide-image"
            :src="asset('wide/R_100.webp')"
            alt="Wide-angle photo at baseline one"
          />

          <div class="overlay-layer" aria-hidden="true">
            <div
              v-for="(box, boxIndex) in roiBoxes"
              :key="`roi-${boxIndex}`"
              class="focus-box"
              :style="boxStyle(box)"
            >
              <span class="box-label">{{ box.label }}</span>
            </div>
          </div>
        </figure>
      </section>

      <div class="baseline-slot" aria-hidden="true">
        <div class="baseline-arrow">
          <span class="baseline-text">600mm</span>
          <svg viewBox="0 0 100 14" preserveAspectRatio="none" class="baseline-svg">
            <line x1="6" y1="7" x2="94" y2="7" />
            <path d="M6 7 L11 4 L11 10 Z" />
            <path d="M94 7 L89 4 L89 10 Z" />
          </svg>
        </div>
      </div>

      <section class="wide-slot right-slot">
        <figure class="wide-card right-card">
          <img
            class="wide-image"
            :src="asset('wide/R_300.webp')"
            alt="Wide-angle photo at baseline two"
          />
        </figure>

        <div class="detail-grid" aria-hidden="true">
          <div class="detail-column-labels">
            <p class="column-label column-label-left">Left fovea</p>
            <p class="column-label column-label-right">Right fovea</p>
            <p class="column-label column-label-center">Anaglyph</p>
          </div>

          <article
            v-for="(tile, index) in detailTiles"
            :key="`${tile.src}-${index}`"
            class="detail-tile detail-tile-fovea"
            :style="tileStyle(index)"
          >
            <img class="detail-image" :src="tile.src" :alt="tile.alt" />
          </article>

          <article
            v-for="(tile, index) in anaglyphTiles"
            :key="`${tile.src}-anaglyph-${index}`"
            class="detail-tile detail-tile-anaglyph"
            :style="anaglyphStyle(index)"
          >
            <img class="detail-image" :src="tile.src" :alt="tile.alt" />
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.storyboard {
  --label-band: 2.4rem;
  --baseline-col: 7rem;
  --main-gap: 1rem;
  --detail-expand: calc(var(--baseline-col) + var(--main-gap));
  position: relative;
  width: 100%;
  padding-top: var(--label-band);
}

.storyboard-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--baseline-col) minmax(0, 1fr);
  gap: var(--main-gap);
}

.wide-slot {
  position: relative;
  min-height: 21rem;
}

.wide-angle-label {
  position: absolute;
  top: 0.15rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #dbeafe;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid color-mix(in srgb, var(--camera-center) 72%, transparent);
  border-radius: 999px;
  padding: 0.28rem 0.62rem;
  opacity: 0;
  transition:
    transform var(--transition-duration) var(--transition-curve),
    left var(--transition-duration) var(--transition-curve),
    top var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve);
}

.baseline-slot {
  display: flex;
  align-items: center;
  justify-content: center;
}

.baseline-arrow {
  position: relative;
  width: 100%;
  z-index: 4;
  opacity: 0;
  transform: scale(0.94);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.baseline-text {
  position: absolute;
  left: 50%;
  top: -1.1rem;
  transform: translateX(-50%);
  font-size: 0.67rem;
  font-weight: 700;
  color: #bae6fd;
}

.baseline-svg {
  display: block;
  width: 100%;
  height: 0.95rem;
}

.baseline-svg line {
  stroke: #38bdf8;
  stroke-width: 1.4;
}

.baseline-svg path {
  fill: #38bdf8;
}

.wide-card {
  position: absolute;
  inset: 0;
  margin: 0;
  border-radius: 18px;
  overflow: hidden;
  border: 2px solid color-mix(in srgb, var(--camera-center) 62%, transparent);
  background: #0f172a;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.24);
  opacity: 0;
  filter: blur(6px) saturate(0.85);
}

.left-card {
  transform: translate3d(-110px, 55px, 0) scale(0.9) rotate(-1deg);
}

.right-card {
  transform: translate3d(110px, 55px, 0) scale(0.9) rotate(1deg);
}

.storyboard.show-wide-pair .wide-card {
  opacity: 1;
  filter: blur(0) saturate(1);
  transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
  transition:
    transform var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve),
    filter var(--transition-duration) var(--transition-curve);
}

.storyboard.show-wide-pair .wide-angle-label,
.storyboard.show-wide-pair .baseline-arrow {
  opacity: 1;
}

.storyboard.show-wide-pair .right-card {
  transition-delay: 120ms;
}

.storyboard.hide-right-wide .right-card {
  opacity: 0;
  transform: translate3d(120px, -24px, 0) scale(0.84);
  filter: blur(8px) saturate(0.65);
  transition:
    transform var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve),
    filter var(--transition-duration) var(--transition-curve);
}

.storyboard.hide-right-wide .wide-angle-label {
  left: 21%;
  top: 0.15rem;
  transform: translateX(-50%);
}

.storyboard.hide-right-wide .baseline-arrow {
  opacity: 0;
  transform: scale(0.84);
}

.wide-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.focus-box {
  position: absolute;
  border: 2px solid var(--box-color);
  background: color-mix(in srgb, var(--box-color) 18%, transparent);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12) inset;
  opacity: 0;
  transform: scale(0.74);
}

.storyboard.show-focus-and-details .focus-box {
  animation: roi-pop var(--transition-duration) var(--transition-curve) both;
  animation-delay: var(--box-delay);
}

.box-label {
  position: absolute;
  left: -2px;
  top: -1.55rem;
  font-size: 0.62rem;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid var(--box-color);
  border-radius: 999px;
  padding: 0.2rem 0.42rem;
  white-space: nowrap;
}

.detail-grid {
  position: absolute;
  top: calc(var(--label-band) * -1);
  right: 0;
  bottom: 0;
  left: calc(-1 * var(--detail-expand));
  height: calc(100% + var(--label-band));
  width: calc(100% + var(--detail-expand));
  display: grid;
  grid-template-columns: .8fr .8fr .8fr;
  grid-template-rows: auto repeat(3, auto);
  align-content: start;
  gap: 0.7rem;
  opacity: 0;
  pointer-events: none;
}

.storyboard.show-focus-and-details .detail-grid {
  opacity: 1;
}

.detail-column-labels {
  grid-column: 1 / span 3;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.7rem;
  align-items: center;
  opacity: 0;
  transform: translate3d(0, -8px, 0);
}

.storyboard.show-focus-and-details .detail-column-labels {
  opacity: 1;
  transform: translate3d(0, 0, 0);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.column-label {
  --camera-label-color: var(--camera-center);
  margin: 0;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #e0f2fe;
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid color-mix(in srgb, var(--camera-label-color) 72%, transparent);
  border-radius: 999px;
  padding: 0.24rem 0.45rem;
}

.column-label-left {
  --camera-label-color: var(--camera-left);
}

.column-label-right {
  --camera-label-color: var(--camera-right);
}

.column-label-center {
  --camera-label-color: var(--camera-center);
}

.detail-tile {
  aspect-ratio: 4 / 3;
  width: 92%;          /* smaller border box */
  justify-self: center;
  align-self: center;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: #111827;
  transform: translate3d(0, 24px, 0) scale(0.93);
  opacity: 0;
}

.detail-tile-fovea {
  border-color: color-mix(in srgb, var(--camera-color) 72%, transparent);
}

.storyboard.show-focus-and-details .detail-tile {
  animation: tile-rise var(--transition-duration) var(--transition-curve) both;
  animation-delay: var(--tile-delay);
}

.detail-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #020617;
}

.detail-tile-anaglyph {
  min-height: 0;
}

@keyframes roi-pop {
  0% {
    opacity: 0;
    transform: scale(0.68);
  }
  60% {
    opacity: 1;
    transform: scale(1.06);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes tile-rise {
  0% {
    opacity: 0;
    transform: translate3d(0, 20px, 0) scale(0.92);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@media (max-width: 980px) {
  .storyboard {
    --label-band: 1.9rem;
    padding-top: 1.9rem;
  }

  .storyboard-main {
    grid-template-columns: 1fr;
  }

  .wide-slot {
    min-height: 16rem;
  }

  .baseline-slot {
    min-height: 2rem;
  }

  .right-slot {
    min-height: 20rem;
  }

  .detail-grid {
    top: 0;
    height: 100%;
    width: 100%;
    left: 0;
    grid-template-columns: 1fr;
    grid-template-rows: auto repeat(10, auto);
  }

  .detail-column-labels {
    grid-column: 1;
    grid-template-columns: 1fr;
  }

  .detail-tile,
  .detail-tile-anaglyph {
    grid-column: 1 !important;
    grid-row: auto !important;
  }

  .storyboard.hide-right-wide .wide-angle-label {
    left: 50%;
    top: 0.15rem;
  }
}
</style>
