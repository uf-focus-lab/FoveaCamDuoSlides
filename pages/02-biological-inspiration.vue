<script setup lang="ts">
import { useNav } from "@slidev/client";
import { computed } from "vue";
import { useStage } from "stores/stage";

interface InspirationSlide {
  src: string;
  title: string;
  subtitle: string;
  objectPosition: string;
}

const assetUrls = import.meta.glob(
  "../assets/inspiration/*.{png,jpg,jpeg,webp,avif}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const discoveredImages = Object.entries(assetUrls)
  .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
  .map(([path, src]) => {
    const filename = path.split("/").pop() ?? "Inspiration";
    const basename = filename.replace(/\.[^.]+$/, "");
    const title = basename
      .split(/[-_]+/)
      .map((segment) =>
        segment.length ? segment[0].toUpperCase() + segment.slice(1) : segment,
      )
      .join(" ");

    return {
      src,
      title,
      subtitle: "Replace with the species or visual trait you want to call out.",
      objectPosition: "50% 50%",
    } satisfies InspirationSlide;
  });

const templateSlots = [
  {
    title: "Predator gaze",
    subtitle: "Use this slot for a species with strong binocular fixation.",
    objectPosition: "50% 22%",
  },
  {
    title: "Foveal targeting",
    subtitle: "Swap in an eye crop or hunting pose that emphasizes acuity.",
    objectPosition: "62% 34%",
  },
  {
    title: "Central fixation",
    subtitle: "The centered card is the current focus of the slideshow.",
    objectPosition: "50% 50%",
  },
  {
    title: "Convergent pursuit",
    subtitle: "Use this slot for another example of depth-guided tracking.",
    objectPosition: "38% 42%",
  },
  {
    title: "Peripheral context",
    subtitle: "Wide-scene awareness can be contrasted against foveal detail here.",
    objectPosition: "50% 68%",
  },
];

const COVERFLOW_STEP_PX = 330;
const DEPTH_STEP_PX = 260;
const SIDE_ROTATION_DEG = 54;
const MAX_VISIBLE_OFFSET = 3;

const slides = computed<InspirationSlide[]>(() => {
  if (!discoveredImages.length) {
    return [];
  }

  return discoveredImages.map((image, index) => ({
    ...image,
    objectPosition: templateSlots[index]?.objectPosition ?? image.objectPosition,
  }));
});

const { next, prev } = useNav();

const stage = useStage(Math.max(slides.value.length, 1), {
  presist: false,
  preview: 3,
  onAfterLast: () => next(),
  onBeforeFirst: () => prev(),
});

const activeIndex = computed(() => {
  const length = slides.value.length;

  if (!length) {
    return 0;
  }

  return Math.min(stage.value - 1, length - 1);
});

function offsetFromActive(index: number) {
  return index - activeIndex.value;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function matrixValue(value: number) {
  return Math.abs(value) < 0.00001 ? "0" : value.toFixed(5);
}

function coverflowMatrix3d(
  translateX: number,
  translateZ: number,
  rotateY: number,
  scale: number,
) {
  const yaw = toRadians(rotateY);
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);

  const values = [
    cy * scale,
    0,
    -sy * scale,
    0,
    0,
    scale,
    0,
    0,
    sy * scale,
    0,
    cy * scale,
    0,
    translateX,
    0,
    translateZ,
    1,
  ];

  return `matrix3d(${values.map(matrixValue).join(", ")})`;
}

function cardStyle(index: number) {
  const offset = offsetFromActive(index);
  const absOffset = Math.abs(offset);
  const limitedOffset = Math.min(absOffset, MAX_VISIBLE_OFFSET);
  const direction = Math.sign(offset);
  const translateX = offset * COVERFLOW_STEP_PX;
  const translateZ = absOffset === 0 ? 0 : -absOffset * DEPTH_STEP_PX;
  const rotateY =
    direction === 0 ? 0 : direction < 0 ? SIDE_ROTATION_DEG : -SIDE_ROTATION_DEG;
  const scale = Math.max(0.48, 1 - limitedOffset * 0.2);
  const opacity = Math.max(0.1, 1 - limitedOffset * 0.26);
  const blur = Math.max(0, limitedOffset - 0.5) * 1.2;

  return {
    transform: `translate(-50%, -50%) ${coverflowMatrix3d(
      translateX,
      translateZ,
      rotateY,
      scale,
    )}`,
    opacity,
    filter: `saturate(${1 - limitedOffset * 0.18}) brightness(${1 - limitedOffset * 0.08}) blur(${blur}px)`,
    zIndex: String(100 - absOffset),
  };
}
</script>

<template>
  <section class="inspiration-slide">
    <header class="hero-copy">

    </header>

    <div class="carousel-shell">
      <div class="carousel-stage">
        <article
          v-for="(slide, index) in slides"
          :key="`${slide.src}-${index}`"
          class="inspiration-card"
          :class="{ active: index === activeIndex }"
          :style="cardStyle(index)"
        >
          <div class="image-frame">
            <img
              :src="slide.src"
              :alt="slide.title"
              :style="{ objectPosition: slide.objectPosition }"
            />
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.inspiration-slide {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 3rem 3.5rem 2rem;
}

.hero-copy,
.carousel-shell {
  position: relative;
  z-index: 1;
}

.hero-copy {
  position: absolute;
  top: 3rem;
  left: 3.5rem;
  max-width: 40rem;
}

.hero-copy h1 {
  margin: 0;
  max-width: 14ch;
}

.hero-copy p {
  margin: 0.85rem 0 0;
  max-width: 34rem;
  color: var(--fc-muted);
  line-height: 1.55;
}

.carousel-shell {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rem 3.5rem 4.5rem;
  perspective: 850px;
  perspective-origin: center;
  z-index: 2;
  --transition-duration: 0.42s;
  --transition-curve: cubic-bezier(0.2, 0.65, 0.2, 1);
}

.carousel-stage {
  position: relative;
  width: min(100%, 64rem);
  height: min(46vh, 26rem);
  transform-style: preserve-3d;
}

.inspiration-card {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(21rem, 26vw);
  transform-origin: center center;
  transition:
    transform var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve),
    filter var(--transition-duration) var(--transition-curve),
    box-shadow var(--transition-duration) var(--transition-curve);
}

.image-frame {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 1.7rem;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 22px 48px rgba(15, 23, 42, 0.14);
}

.active .image-frame {
  box-shadow: 0 28px 64px rgba(15, 23, 42, 0.2);
}

.image-frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 1100px) {
  .inspiration-slide {
    padding-inline: 2.4rem;
  }

  .hero-copy {
    left: 2.4rem;
  }

  .hero-copy h1 {
    max-width: 15ch;
  }

  .carousel-shell {
    padding-inline: 2.4rem;
  }

  .carousel-stage {
    width: min(100%, 56rem);
    height: min(42vh, 23rem);
  }

  .inspiration-card {
    width: min(17rem, 34vw);
  }
}

@media (max-width: 800px) {
  .inspiration-slide {
    padding: 2.2rem 1.6rem 1.4rem;
  }

  .hero-copy {
    top: 2.2rem;
    left: 1.6rem;
    max-width: none;
  }

  .hero-copy p {
    max-width: none;
  }

  .carousel-stage {
    width: min(100%, 44rem);
    height: min(36vh, 18rem);
  }

  .inspiration-card {
    width: min(13rem, 42vw);
  }

  .inspiration-card {
    width: min(16rem, 52vw);
  }
}
</style>
