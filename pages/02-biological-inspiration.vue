<script setup lang="ts">
import { useNav } from "@slidev/client";
import { computed } from "vue";
import CoverFlow from "components/CoverFlow.vue";
import { useStage } from "stores/stage";

const assetUrls = import.meta.glob(
  "../assets/inspiration/*.{png,jpg,jpeg,webp,avif,gif}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const assetsByName = Object.fromEntries(
  Object.entries(assetUrls).map(([path, src]) => [path.split("/").pop(), src]),
) as Record<string, string>;

// Choose which inspiration images appear in the cover flow and their order.
const selectedImageNames = [
  // "fovea.webp",
  "gecko.webp",
  // "hawk.webp",
  "nurse_shark.webp",
  "octopus.webp",
  "tokay_gecko.webp",
  "kismet.webp",
];

const slides = selectedImageNames.flatMap((name) => {
  const src = assetsByName[name];
  if (!src) {
    console.warn(`[02-biological-inspiration] Missing inspiration image: ${name}`);
    return [];
  }
  return [src];
});

const stage = useStage(Math.max(slides.length, 1), {
  preview: Math.floor(slides.length / 2),
});

const activeIndex = computed(() => {
  const length = slides.length;
  if (!length) {
    return 0;
  }
  return Math.min(stage.value - 1, length - 1);
});
</script>

<template>
  <section class="slide">
    <CoverFlow
      :items="slides"
      :active-index="activeIndex"
      class="inspiration-cover-flow"
    />
  </section>
</template>

<style scoped>
section.slide {
  position: absolute;
  top: 160px;
  left: 0;
  right: 0;
  bottom: 80px;
  overflow: visible;
}
.inspiration-cover-flow {
  inset: 0;
  z-index: 2;
  overflow: visible;
}
</style>
