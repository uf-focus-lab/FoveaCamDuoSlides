<script setup lang="ts">
/// <reference types="vite/client" />

import { computed } from "vue";
import { useStage } from "stores/stage";
import StereoSection from "./04A-stereo-section.vue";
import FoveaSection from "./04B-fovea-section.vue";

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
</script>

<template>
  <section class="comparison-layout" :data-stage="stage">
    <div class="top-row">
      <StereoSection :show="showStereo" :image="stereoImage" />
      <FoveaSection :show="showFovea" :image="foveaImage" />
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
  gap: 0;
  align-items: stretch;
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
