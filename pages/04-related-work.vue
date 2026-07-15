<script setup lang="ts">
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

type RelatedWorkPanel = {
  title: string;
  imageFile?: string;
  text?: string;
};

// Each panel supports optional image and optional centered text.
const panels: RelatedWorkPanel[] = [
  {
    title: "Policy-Driven Foveation",
    imageFile: "segmentation.webp",
    text: "Policy-based foveated imaging and perception [1]\nActive 3D scene exploration with foveated vision [5]",
  },
  {
    title: "Dynamic Optical Foveation",
    imageFile: "gigapixel.webp",
    text: "Fovea stacking with localized aberration correction [2]\nMultiscale gigapixel imaging [6]",
  },
  {
    title: "Vergence Stereo Systems",
    imageFile: "kismet.webp",
    text: "Real-time binocular smooth pursuit [3]\nConvergent active stereo [4]\nHumanoid vergence platforms [7], [8]",
  },
];

const panelImageSrc = (panel: RelatedWorkPanel) => {
  if (!panel.imageFile) {
    return "";
  }
  const src = assetsByName[panel.imageFile];
  if (!src) {
    console.warn(
      `[02A-related-work] Missing related work image: ${panel.imageFile}`,
    );
    return "";
  }
  return src;
};

const citations = [
  "[1] H. Xiao, J. Ackermann, B. Deng, and G. Wetzstein, Policy-based foveated imaging and perception, 2026. arXiv:2606.02565.",
  "[2] S. Mao, Y. N. Mishra, and W. Heidrich, Fovea stacking: Imaging with dynamic localized aberration correction, ACM Trans. Graph., 44(6), 2025. doi:10.1145/3763278.",
  "[3] Coombs and Brown, Real-time binocular smooth pursuit, IJCV 1993. [4] Chi, Convergent active stereo, Master's thesis, York University 2025.",
  "[5] Bjorkman and Kragic, Active 3D scene exploration with foveated vision, ICRA 2002. [6] Brady et al., Multiscale gigapixel photography, Nature 2012.",
  "[7] Breazeal, Emotion and sociable humanoid robots, IJHCS 2003. [8] Metta et al., The iCub humanoid robot, PerMIS 2008.",
];

const citationParagraph = citations.join(" ");
</script>

<template>
  <section class="slide">
    <div class="panel-grid" role="list" aria-label="Related work categories">
      <article
        v-for="panel in panels"
        :key="panel.title"
        class="category-panel"
        role="listitem"
      >
        <h3 class="panel-title">{{ panel.title }}</h3>

        <img
          v-if="panelImageSrc(panel)"
          :src="panelImageSrc(panel)"
          :alt="`${panel.title} example`"
          class="panel-image"
        />

        <p v-if="panel.text" class="panel-text">{{ panel.text }}</p>
      </article>
    </div>

    <footer class="citation-footer" aria-label="Related work citations">
      <p class="citation-line">{{ citationParagraph }}</p>
    </footer>
  </section>
</template>

<style scoped>
section.slide {
  --footer-height: 100px;
  --footer-gap: 30px;
  position: absolute;
  top: 100px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: visible;
}

.panel-grid {
  position: absolute;
  inset: 0 2.2rem calc(var(--footer-height) + var(--footer-gap));
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.1rem;
}

.category-panel {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.95rem;
  border: 1px solid rgb(255 255 255 / 0.15);
  border-radius: 0.7rem;
  background: rgb(10 14 20 / 0.35);
  min-height: 0;
}

.panel-title {
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.2;
  letter-spacing: 0.01em;
  text-align: center;
}

.panel-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 0.45rem;
  border: 1px solid rgb(255 255 255 / 0.14);
  background: rgb(0 0 0 / 0.3);
}

.panel-text {
  margin: 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .9rem;
  line-height: 1.45;
  text-align: center;
  white-space: pre-line;
}

.citation-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: var(--footer-height);
  padding: 0.55rem 1.1rem 0.1rem;
  border-top: 1px solid rgb(255 255 255 / 0.14);
  color: rgb(178, 178, 178);
  font-size: 0.6rem;
  line-height: 1.35;
}

.citation-line {
  margin: 0.12rem 0;
}
</style>