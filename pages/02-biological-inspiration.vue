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
  // Class attached to this tile's <img>; its focus-zoom transform lives in this
  // slide's scoped CSS (the `.zoom-*` :deep rules below), so CoverFlow itself
  // brokers no transform CSS. Tune each transform there.
  imageClass: string;
};

// Choose which inspiration images appear in the cover flow, their order, and
// the label shown at the bottom of the slide.
const selectedImageNames: AnimalSlide[] = [
  {
    file: "jumping-spider.webp",
    label: "Jumping Spider (Salticidae)",
    imageClass: "zoom-spider",
  },
  {
    file: "gecko.webp",
    label: "Madagascar Day Gecko",
    imageClass: "zoom-gecko",
  },
  {
    file: "owl.webp",
    label: "Spotted Eagle-Owl",
    imageClass: "zoom-owl",
  },
];

const tiles = selectedImageNames.flatMap((animal) => {
  const src = assetsByName[animal.file];
  if (!src) {
    console.warn(
      `[02-biological-inspiration] Missing inspiration image: ${animal.file}`,
    );
    return [];
  }
  return [{ ...animal, src }];
});

const items = tiles.map<CoverFlowItem>(({ src, label, file, imageClass }) => ({
  src,
  caption: label,
  key: file,
  imageClass,
}));

// Stage 1 is a transient entrance: the first tile shows zoomed out (cover) while
// the slide animates in, then passes through to stage 2, which flips `.active`
// on and drives the first tile's (delayed) zoom-in. Stages 2..n+1 then step the
// cover flow across the tiles.
const stage = useStage(tiles.length + 1, { preview: 2 });

const containerActive = computed(() => stage.value >= 2);

const activeIndex = computed(() =>
  Math.min(Math.max(stage.value - 2, 0), Math.max(tiles.length - 1, 0)),
);

// Dynamic citation footer: the spider tile cites SpiderCam; every other stage
// cites the vision-science review. Both lines are always rendered and cross-fade
// by opacity (fixed node pool) as the centered tile changes.
const citations = [
  {
    key: "spidercam",
    html: "M. A. Ferreira, T. Li, J. Mamish, J. Hester, Y. Sangar, Q. Guo, and <strong>Emma Alexander</strong>. SpiderCam: Low-Power Snapshot Depth from Differential Defocus. CVPR (2026).",
  },
  {
    key: "review",
    html: "Y.-C. Hung, Q. Guo, and <strong>Emma Alexander</strong>. Bio-Inspired Computational Imaging: Components, Algorithms, and Systems. Annu. Rev. Vis. Sci. (2025).",
  },
  {
    key: "ramesh",
    html: "Kushagra Tiwary, Aaron Young, Zaid Tasneem, Tzofi Klinghoffer, Akshat Dave, Tomaso Poggio, Dan-Eric Nilsson, Brian Cheung, and <strong>Ramesh Raskar</strong>, “What if eye…? Computationally recreating vision evolution,” Science Advances (2025).",
  },
] as const;

const activeCitation = computed(() => {
  if (stage.value <= 2) return "spidercam";
  if (stage.value === 3) return "review";
  return "ramesh";
});
</script>

<template>
  <section class="slide" :class="{ active: containerActive }">
    <div class="cover-flow-region">
      <CoverFlow
        :items="items"
        :active-index="activeIndex"
        :aspect-ratio="3 / 2"
        class="inspiration-cover-flow"
      />
    </div>

    <footer class="citation-footer" aria-live="polite">
      <p
        v-for="c in citations"
        :key="c.key"
        class="citation-line"
        :class="{ show: activeCitation === c.key }"
        v-html="c.html"
      ></p>
    </footer>
  </section>
</template>

<style scoped>
section.slide {
  position: absolute;
  top: 140px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: visible;
}

/* Reserve the footer band (plus a gap for the tile caption) so neither the cover
   flow nor its caption overlaps the citation. */
.cover-flow-region {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 160px;
}
.inspiration-cover-flow {
  inset: 0;
  z-index: 2;
  overflow: visible;
}

.citation-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 80px;
  border-top: 1px solid color-mix(in srgb, currentColor 16%, transparent);
}

/* Matches slide 04's citation style: small, muted, hanging indent so wrapped
   lines align. Both lines share the footer and only the active one fades in
   (opacity is compositor-only). Font is set explicitly because these
   `layout: none` slides don't inherit `.slidev-layout`'s font. */
.citation-line {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0.7rem 1.4rem;
  font-family: "Times New Roman", Times, serif;
  font-size: 0.6em;
  line-height: 1.4;
  color: color-mix(in srgb, var(--fc-fg) 80%, transparent);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.citation-line :deep(strong) {
  text-decoration: underline;
}

.citation-line.show {
  opacity: 1;
}

.inspiration-cover-flow :deep(.cover-flow-caption) {
  color: var(--fc-fg);
  letter-spacing: 0.04em;
}

/*
 * Focus zoom (this slide only — CoverFlow brokers no transform CSS). Every tile
 * starts zoomed out to cover its frame; transform is GPU-composited so the zoom
 * stays cheap. Per-tile zoom targets are the `.zoom-*` rules below, matched via
 * the `imageClass` each item hands to CoverFlow's <img>.
 *
 * The base transform must mirror the target list — `scale() translate()`, same
 * order — so the transition interpolates scale and translate component-wise. A
 * bare `scale(1)` mismatches the two-function targets and forces CSS into matrix
 * interpolation, which slides scale and translate out of sync.
 */
.inspiration-cover-flow :deep(.image-frame img) {
  transform: scale(1) translate(0%, 0%);
  transform-origin: center center;
  transition: transform 0.8s var(--transition-curve); /* PLACEHOLDER duration */
  transition-delay: 0s; /* zoom out: immediate */
}

.slide.active
  .inspiration-cover-flow
  :deep(.cover-flow-card.focused .image-frame img) {
  transition-delay: 0.6s;
  transition-duration: 1.2s;
}

/* Per-tile zoom targets — PLACEHOLDER transforms, tune each to frame the eyes.
   `scale()` sets the zoom, `translate(x%, y%)` recenters onto the detail. */
.slide.active
  .inspiration-cover-flow
  :deep(.cover-flow-card.focused .zoom-spider) {
  transform: scale(4) translate(-1%, 12%);
}
.slide.active
  .inspiration-cover-flow
  :deep(.cover-flow-card.focused .zoom-gecko) {
  transform: scale(4) translate(0%, 22%);
}
.slide.active
  .inspiration-cover-flow
  :deep(.cover-flow-card.focused .zoom-owl) {
  transform: scale(2.8) translate(-3%, 30%);
}
</style>
