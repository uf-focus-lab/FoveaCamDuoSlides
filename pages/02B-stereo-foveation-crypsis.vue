<script setup lang="ts">
/// <reference types="vite/client" />

import { computed } from "vue";
import { useStage } from "stores/stage";

const assetUrls = import.meta.glob(
  "../assets/inspiration/*.{png,jpg,jpeg,webp,avif,gif}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const inspirationImages = Object.fromEntries(
  Object.entries(assetUrls).map(([path, src]) => [path.split("/").pop() ?? path, src]),
) as Record<string, string>;

// Pick the file for each slot here.
const slotImages = {
  stereo: "hawk.webp",
  foveation: "fovea.gif",
};

const stereoImage = computed(() => inspirationImages[slotImages.stereo] ?? "");
const foveationImage = computed(
  () => inspirationImages[slotImages.foveation] ?? "",
);

const stage = useStage(3, { preview: -1 });

const stereoBullets = [
  "Multiple eyes allow triangulation of objects in the world.",
  "Triangulation gives animals a sense of depth and distance.",
];

const foveationBullets = [
  "Foveation allows animals to focus on a small region of interest.",
  "This allows animals to track objects of interest with high acuity.",
];
</script>

<template>
  <section class="comparison-layout">
    <div class="left-column">
      <article class="topic-card reveal" :class="{ show: stage >= 1, past: stage >= 2 }">
        <div class="topic-media">
          <img v-if="stereoImage" :src="stereoImage" alt="Stereo vision reference" />
          <div v-else class="media-placeholder">Square image</div>
        </div>

        <div class="topic-copy">
          <h2>Stereo Vision</h2>
          <ul>
            <li v-for="bullet in stereoBullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </div>
      </article>

      <article class="topic-card reveal" :class="{ show: stage >= 2 }">
        <div class="topic-media">
          <img v-if="foveationImage" :src="foveationImage" alt="Foveation reference" />
          <div v-else class="media-placeholder">Square image</div>
        </div>

        <div class="topic-copy">
          <h2>Foveation</h2>
          <ul>
            <li v-for="bullet in foveationBullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </div>
      </article>
    </div>

    <aside class="animation-panel reveal" :class="{ show: stage >= 3 }">
      <article class="crypsis-placeholder">
        <h2>Crypsis Animation</h2>
      </article>
    </aside>
  </section>
</template>

<style scoped>
.comparison-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(20rem, 0.95fr);
  gap: 2rem;
  height: calc(100% - 6.6rem);
  margin-top: 0.9rem;
}

.left-column {
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 1.15rem;
}

.topic-card,
.animation-frame {
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 1.4rem;
  background: color-mix(in srgb, var(--fc-bg) 94%, var(--camera-right) 6%);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
}

.topic-card {
  display: grid;
  grid-template-columns: 9rem minmax(0, 1fr);
  gap: 0.9rem;
  align-items: start;
  padding: 0.9rem;
}

.topic-media {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 0.9rem;
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.topic-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--fc-muted);
  font-size: 0.82rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.topic-copy h2 {
  margin: 0 0 0.45rem;
  font-size: 1.1rem;
}

.topic-copy ul {
  margin: 0;
  padding-left: 1rem;
  display: grid;
  gap: 0.32rem;
  font-size: 0.92rem;
  line-height: 1.22;
}

.topic-copy li::marker {
  color: var(--camera-right);
}

.animation-panel {
  min-height: 0;
}

.crypsis-placeholder {
  height: 100%;
  min-height: 0;
  border: 1px dashed color-mix(in srgb, currentColor 18%, transparent);
  border-radius: 1.4rem;
  background: color-mix(in srgb, var(--fc-bg) 97%, var(--camera-center) 3%);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  display: grid;
  place-items: center;
  padding: 1.25rem;
}

.crypsis-placeholder h2 {
  margin: 0;
  color: var(--fc-muted);
  font-size: 1.15rem;
}

.reveal {
  opacity: 0;
  transform: translateY(1rem);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.reveal.show {
  opacity: 1;
  transform: translateY(0);
}

.reveal.past {
  opacity: 0.72;
}

@media (max-width: 1100px) {
  .comparison-layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto;
    height: auto;
  }

  .animation-panel {
    min-height: 18rem;
  }

  .topic-card {
    grid-template-columns: 8rem minmax(0, 1fr);
  }
}

@media (max-width: 800px) {
  .topic-card {
    grid-template-columns: minmax(0, 1fr);
  }

  .topic-media {
    max-width: 14rem;
  }
}
</style>