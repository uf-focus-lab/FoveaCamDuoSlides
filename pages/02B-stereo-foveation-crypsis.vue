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

const stereoImage = computed(() => inspirationImages["hawk.webp"] ?? "");
const foveaImage = computed(() => inspirationImages["fovea.webp"] ?? "");

const stage = useStage(3, { preview: 2 });

const showStereo = computed(() => stage.value >= 1);
const showFovea = computed(() => stage.value >= 2);
const showTextBox = computed(() => stage.value >= 3);

const stereoBlurb = "Multiple eyes allow triangulation of objects in the world.";

const foveationBlurb = "Concentrated photoreceptors provide details in regions of interest.";
</script>

<template>
  <section class="comparison-layout" :data-stage="stage">
    <div class="top-row">
      <article class="topic-card stereo-card" :class="{ show: showStereo }">
        <div class="topic-media">
          <img v-if="stereoImage" :src="stereoImage" alt="Stereo vision reference" />
        </div>

        <div class="topic-copy">
          <h2>Stereo Vision</h2>
          <p class="topic-blurb">{{ stereoBlurb }}</p>
        </div>
      </article>

      <article class="topic-card fovea-card" :class="{ show: showFovea }">
        <div class="topic-media">
          <img v-if="foveaImage" :src="foveaImage" alt="Foveation reference" />
        </div>

        <div class="topic-copy">
          <h2>Foveation</h2>
          <p class="topic-blurb">{{ foveationBlurb }}</p>
        </div>
      </article>
    </div>

    <div class="bottom-row reveal" :class="{ show: showTextBox }">
      <div class="reveal-body">
        <aside class="text-box">
          <div class="capability-callout">
            Stereo and foveation provide many capabilities.
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<style scoped>
.comparison-layout {
  height: calc(100% - 5.6rem);
  margin-top: 3rem;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 0.95rem;
  align-content: start;
}

.top-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.95rem;
  align-items: stretch;
}

.topic-card {
  display: grid;
  grid-template-columns: var(--topic-media-width, 8.8rem) minmax(0, 1fr);
  gap: 4rem;
  align-items: stretch;
  min-height: 14.8rem;
  padding: 0.9rem;
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 1.2rem;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  opacity: 0;
  transform: translate3d(0, 0.8rem, 0);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.topic-media {
  aspect-ratio: 1 / 1.05;
  overflow: hidden;
  border-radius: 0.9rem;
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.topic-card.show {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.stereo-card {
  background: color-mix(in srgb, var(--fc-bg) 94%, var(--camera-left) 6%);
}

.fovea-card {
  background: color-mix(in srgb, var(--fc-bg) 94%, var(--camera-center) 6%);
}

.topic-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.topic-copy {
  display: grid;
  padding: 0.15rem 0.35rem 0.15rem 0.15rem;
  min-width: 0;
  gap: 0.75rem;
  align-content: center;
  justify-items: center;
  text-align: center;
}

.topic-copy h2 {
  margin: 0;
}

.topic-copy h2 {
  font-size: 1.65rem;
}

.topic-blurb {
  margin: 0;
  font-size: 1rem;
  line-height: 1.3;
  max-width: 28ch;
  text-wrap: balance;
}

.bottom-row {
  align-self: start;
}

.reveal {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve);
}

.reveal.show {
  grid-template-rows: 1fr;
  opacity: 1;
}

.reveal-body {
  display: grid;
  justify-items: center;
  min-height: 0;
  overflow: hidden;
}

.text-box {
  width: fit-content;
  max-width: min(92%, 56rem);
  border: 1px dashed color-mix(in srgb, currentColor 18%, transparent);
  border-radius: 1.2rem;
  background: color-mix(in srgb, var(--fc-bg) 97%, var(--yellow-soft) 3%);
  padding: 0.85rem 0.95rem;
}

.capability-callout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.42rem 0.82rem;
  border: 2px solid color-mix(in srgb, var(--yellow-1) 22%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--yellow-soft) 75%, transparent);
  color: var(--yellow-1);
  font-style: italic;
  font-weight: 600;
  font-size: 1.5rem;
}
</style>
