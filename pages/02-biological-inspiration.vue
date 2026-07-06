<script setup lang="ts">
import { computed } from "vue";
import CoverFlow, { type CoverFlowItem } from "components/CoverFlow.vue";
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

type AnimalSlide = {
  file: string;
  label: string;
};

// Choose which inspiration images appear in the cover flow, their order, and
// the label shown at the bottom of the slide.
const selectedImageNames: AnimalSlide[] = [
  // { file: "fovea.webp", label: "Fovea" },
  { file: "gecko.webp", label: "Mossy New Caledonian Gecko" },
  // { file: "hawk.webp", label: "Hawk" },
  { file: "nurse_shark.webp", label: "Atlantic Nurse Shark" },
  { file: "octopus.webp", label: "Giant Pacific Octopus" },
  { file: "tokay_gecko.webp", label: "Tokay Gecko" },
  // { file: "kismet.webp", label: "Kismet" },
];

const slides = selectedImageNames.flatMap<CoverFlowItem>(({ file, label }) => {
  const src = assetsByName[file];
  if (!src) {
    console.warn(`[02-biological-inspiration] Missing inspiration image: ${file}`);
    return [];
  }
  return [{ src, caption: label, key: file }];
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

.inspiration-cover-flow :deep(.cover-flow-caption) {
  color: var(--fc-fg);
  letter-spacing: 0.04em;
}
</style>
