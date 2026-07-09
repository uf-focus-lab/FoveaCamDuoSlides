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

type RelatedWorkSlide = {
  file: string;
  label: string;
};

// Swap these file names and captions to match the related-work examples you
// want to show. The footer below is reserved for citations.
const selectedImageNames: RelatedWorkSlide[] = [
  { file: "triangulation.webp", label: "Triangulation" },
  { file: "segmentation.webp", label: "Segmentation" },
  { file: "fovea.webp", label: "Foveated Vision" },
  { file: "kismet.webp", label: "Active Vision" },
];

const slides = selectedImageNames.flatMap<CoverFlowItem>(({ file, label }) => {
  const src = assetsByName[file];
  if (!src) {
    console.warn(`[02A-related-work] Missing related work image: ${file}`);
    return [];
  }
  return [{ src, caption: label, key: file }];
});

const citations = [
  "Add citations here.",
  "For example: Author et al. (Year), Conference / Journal.",
];

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
      class="related-work-cover-flow"
    />

    <footer class="citation-footer" aria-label="Related work citations">
      <p v-for="citation in citations" :key="citation" class="citation-line">
        {{ citation }}
      </p>
    </footer>
  </section>
</template>

<style scoped>
section.slide {
  --footer-height: 84px;
  --footer-gap: 28px;
  position: absolute;
  top: 110px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: visible;
}

.related-work-cover-flow {
  position: absolute;
  inset: 0 3.5rem calc(var(--footer-height) + var(--footer-gap) + 5rem);
  height: calc(100% - (var(--footer-height) + var(--footer-gap) + 1rem));
  z-index: 2;
  overflow: visible;
}

.related-work-cover-flow :deep(.cover-flow-caption) {
  color: var(--fc-fg);
  letter-spacing: 0.04em;
}

.citation-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: var(--footer-height);
  padding: 0.55rem 1.1rem 0.1rem;
  border-top: 1px solid rgb(255 255 255 / 0.14);
  color: rgb(226 232 240 / 0.92);
  font-size: 0.72rem;
  line-height: 1.35;
}

.citation-line {
  margin: 0.12rem 0;
}
</style>