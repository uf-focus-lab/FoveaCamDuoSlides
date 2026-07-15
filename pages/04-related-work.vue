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

type RelatedField = {
  title: string;
  imageFile: string;
  // Citations for this field, shown in the reserved footer while its tile is
  // the highlighted (centered) one in the cover flow.
  citations: string[];
};

// One cover-flow tile per related field. Swap `imageFile` for a more symbolic
// picture per category (drop the WebP into assets/inspiration/).
const fields: RelatedField[] = [
  {
    title: "Policy-Driven Foveation",
    imageFile: "segmentation.webp",
    citations: [
      "H. Xiao, J. Ackermann, B. Deng, and G. Wetzstein. Policy-based foveated imaging and perception. arXiv (2026).",
      "M. Björkman and D. Kragic. Active 3D scene exploration with foveated vision. ICRA (2002).",
    ],
  },
  {
    title: "Dynamic Optical Foveation",
    imageFile: "gigapixel.webp",
    citations: [
      "S. Mao, Y. N. Mishra, and W. Heidrich. Fovea stacking: imaging with dynamic localized aberration correction. ACM Trans. Graph. (2025).",
      "D. J. Brady, M. E. Gehm, R. A. Stack, et al. Multiscale gigapixel photography. Nature (2012).",
    ],
  },
  {
    title: "Vergence Stereo Systems",
    imageFile: "kismet.webp",
    citations: [
      "D. Coombs and C. Brown. Real-time binocular smooth pursuit. Int. J. Comput. Vis. (1993).",
      "R. Chi. Convergent active stereo. Master's thesis, York University (2025).",
      "C. Breazeal. Emotion and sociable humanoid robots. Int. J. Hum.-Comput. Stud. (2003).",
      "G. Metta, G. Sandini, D. Vernon, et al. The iCub humanoid robot. PerMIS (2008).",
    ],
  },
];

const items = computed<CoverFlowItem[]>(() =>
  fields.flatMap((field) => {
    const src = assetsByName[field.imageFile];
    if (!src) {
      console.warn(
        `[04-related-work] Missing related work image: ${field.imageFile}`,
      );
      return [];
    }
    return [{ src, caption: field.title, key: field.imageFile }];
  }),
);

// One stage per field; the cover flow steps through them and the footer follows.
const stage = useStage(fields.length, { preview: 1 });

const activeIndex = computed(() =>
  Math.min(Math.max(stage.value - 1, 0), fields.length - 1),
);
</script>

<template>
  <section class="slide">
    <div class="cover-flow-region">
      <CoverFlow
        :items="items"
        :active-index="activeIndex"
        :aspect-ratio="2 / 1"
        class="related-cover-flow"
      />
    </div>

    <footer
      class="citation-footer"
      aria-label="Citations for highlighted field"
    >
      <div
        v-for="(field, index) in fields"
        :key="field.title"
        class="citation-block"
        :class="{ show: stage === index + 1 }"
      >
        <p v-for="cite in field.citations" :key="cite" class="citation-line">
          {{ cite }}
        </p>
      </div>
    </footer>
  </section>
</template>

<style scoped>
section.slide {
  --footer-height: 110px;
  --footer-gap: 24px;
  position: absolute;
  top: 100px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: visible;
}

.cover-flow-region {
  position: absolute;
  inset: 0 0 calc(var(--footer-height) + var(--footer-gap));
  overflow: visible;
  height: 260px;
}

.related-cover-flow {
  inset: 0;
  z-index: 2;
  overflow: visible;
}

.related-cover-flow :deep(.cover-flow-caption) {
  color: var(--fc-fg);
  letter-spacing: 0.03em;
  font-size: 1em;
}

.citation-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: var(--footer-height);
  border-top: 1px solid color-mix(in srgb, currentColor 16%, transparent);
}

/* All fields' citation blocks are stacked in the reserved footer; only the one
   matching the current stage fades in (opacity), the rest stay hidden. */
.citation-block {
  position: absolute;
  inset: 0;
  padding: 0.7rem 1.4rem 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.citation-block.show {
  opacity: 1;
}

.citation-line {
  margin: 0;
  /* Set explicitly — `layout: none` slides don't inherit `.slidev-layout`'s font. */
  font-family: "Times New Roman", Times, serif;
  font-size: 0.8rem;
  line-height: 1.4;
  color: color-mix(in srgb, var(--fc-fg) 68%, transparent);
  padding-left: 2.5ch;
  text-indent: -2.5ch;
}
</style>
