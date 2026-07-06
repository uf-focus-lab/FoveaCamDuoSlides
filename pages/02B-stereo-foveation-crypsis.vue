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
const triangulationImage = computed(() => inspirationImages["triangulation.webp"] ?? "");
const foveaImage = computed(() => inspirationImages["fovea.webp"] ?? "");
const fovea2Image = computed(() => inspirationImages["fovea_2.webp"] ?? "");
const kismetImage = computed(() => inspirationImages["kismet.webp"] ?? "");
const attentionImage = computed(() => inspirationImages["segmentation.webp"] ?? "");

const stage = useStage(4, { preview: 2 });

const showStereo = computed(() => stage.value >= 1 && stage.value < 3);
const showFovea = computed(() => stage.value >= 2);
const moveFoveaLeft = computed(() => stage.value >= 3);
const showTextBox = computed(() => stage.value >= 3);
const showOurWorkHighlight = computed(() => stage.value >= 4);

const stereoBullets = [
  "Multiple eyes allow triangulation of objects in the world.",
  "Triangulation gives animals a sense of depth and distance.",
];

const foveationBullets = [
  "Concentration of photoreceptors in eyes allow details in ROI.",
  "This allows animals to track objects of interest with high acuity.",
];

const noteSections = [
  {
    title: "Stereo",
    image: kismetImage.value,
    text: "Building a mechanical system capable of foveation.",
  },
  {
    title: "Foveation",
    image: attentionImage.value,
    text: "Knowing where to put the fovea.",
  },
];
</script>

<template>
  <section class="comparison-layout" :data-stage="stage">
    <article class="topic-card stereo-card" :class="{ show: showStereo }">
      <div class="topic-media-stack">
        <div class="topic-media">
          <img v-if="stereoImage" :src="stereoImage" alt="Stereo vision reference" />
        </div>
        <div class="topic-media topic-media-secondary">
          <img v-if="triangulationImage" :src="triangulationImage" alt="Triangulation reference" />
        </div>
      </div>

      <div class="topic-copy">
        <h2>Stereo Vision</h2>
        <ul>
          <li v-for="bullet in stereoBullets" :key="bullet">{{ bullet }}</li>
        </ul>
      </div>
    </article>

    <article
      class="topic-card fovea-card"
      :class="{
        show: showFovea,
        'move-left': moveFoveaLeft,
      }"
    >
      <div class="topic-media-stack">
        <div class="topic-media">
          <img v-if="foveaImage" :src="foveaImage" alt="Foveation reference" />
        </div>
        <div class="topic-media topic-media-secondary">
          <img v-if="fovea2Image" :src="fovea2Image" alt="Foveation reference" />
        </div>
      </div>

      <div class="topic-copy">
        <h2>Foveation</h2>
        <ul>
          <li v-for="bullet in foveationBullets" :key="bullet">{{ bullet }}</li>
        </ul>
      </div>
    </article>

    <aside class="text-box" :class="{ show: showTextBox }">
      <h4>Foveation Implementation Challenges</h4>
      <div class="note-sections">
        <section
          v-for="(note, index) in noteSections"
          :key="note.title"
          class="note-section"
          :class="{ 'our-work-highlight': showOurWorkHighlight && index === 0 }"
        >
          <span
            v-if="showOurWorkHighlight && index === 0"
            class="our-work-tag"
            aria-label="Our work"
          >
            Our work
          </span>
          <img
            v-if="note.image"
            :src="note.image"
            :alt="`${note.title} reference`"
            class="note-thumb"
          />
          <div class="note-copy">
            <!-- <h4>{{ note.title }}</h4> -->
            <p>{{ note.text }}</p>
          </div>
        </section>
      </div>
    </aside>
  </section>
</template>

<style scoped>
.comparison-layout {
  position: relative;
  height: calc(100% - 6.6rem);
  margin-top: 3rem;
}

.topic-card {
  position: absolute;
  top: 0;
  width: min(42rem, calc(50% - 1rem));
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 1.4rem;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  opacity: 0;
  transform: translate3d(0, 1rem, 0);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve),
    left var(--transition-duration) var(--transition-curve),
    right var(--transition-duration) var(--transition-curve);
}

.topic-card.show {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.stereo-card {
  left: 0;
  background: color-mix(in srgb, var(--fc-bg) 94%, var(--camera-left) 6%);
}

.fovea-card {
  right: 0;
  background: color-mix(in srgb, var(--fc-bg) 94%, var(--camera-center) 6%);
}

.fovea-card.move-left {
  transform: translate3d(calc(-100% - 2rem), 0, 0);
}

.topic-card,
.topic-copy,
.text-box {
  display: grid;
  padding: 0.9rem;
}

.topic-card {
  grid-template-columns: 8rem minmax(0, 1fr);
  gap: 0.9rem;
  align-items: start;
}

.topic-card,
.text-box {
  min-height: 19rem;
}

.topic-media-stack {
  display: grid;
  gap: 0.7rem;
  align-content: start;
  width: 8rem;
}

.topic-media {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 0.9rem;
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.topic-media-secondary {
  opacity: 0.82;
  transform: scale(0.98);
}

.topic-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.topic-copy {
  min-width: 0;
  gap: 0.65rem;
  align-content: start;
}

.topic-copy h2,
.text-box h3,
.note-copy h4 {
  margin: 0;
}

.topic-copy h2 {
  font-size: 2rem;
}

.topic-copy ul {
  margin: 0;
  padding-left: 1rem;
  display: grid;
  gap: 0.32rem;
  font-size: 1rem;
  line-height: 1.22;
}

.topic-copy li::marker {
  color: var(--camera-right);
}

.text-box {
  position: absolute;
  right: 0;
  top: 0;
  width: min(42rem, calc(50% - 1rem));
  border: 1px dashed color-mix(in srgb, currentColor 20%, transparent);
  border-radius: 1.4rem;
  background: color-mix(in srgb, var(--fc-bg) 97%, var(--camera-right) 3%);
  opacity: 0;
  transform: translate3d(0, 0.8rem, 0);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.text-box.show {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.note-sections {
  display: grid;
  gap: 0.85rem;
  align-content: start;
}

.note-section {
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr);
  gap: 0.8rem;
  align-items: start;
  position: relative;
}

.our-work-highlight {
  border-radius: 1rem;
}

.our-work-highlight::before,
.our-work-highlight::after {
  content: "";
  position: absolute;
  inset: -0.35rem;
  border-radius: 1rem;
  pointer-events: none;
}

.our-work-highlight::before {
  background:
    linear-gradient(var(--camera-right), var(--camera-right)) left top / 0% 2px no-repeat,
    linear-gradient(var(--camera-right), var(--camera-right)) right top / 2px 0% no-repeat,
    linear-gradient(var(--camera-right), var(--camera-right)) right bottom / 0% 2px no-repeat,
    linear-gradient(var(--camera-right), var(--camera-right)) left bottom / 2px 0% no-repeat;
  animation: note-box-trace 900ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.our-work-highlight::after {
  border: 2px solid color-mix(in srgb, var(--camera-right) 75%, white 25%);
  opacity: 0;
  animation: note-box-glow 350ms ease 900ms forwards;
}

.our-work-tag {
  position: absolute;
  right: .5rem;
  bottom: .5rem;
  padding: 0.24rem 0.66rem;
  border-radius: 999px;
  border: 0;
  background: color-mix(in srgb, var(--camera-right) 22%, var(--fc-bg) 78%);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--camera-right) 72%, black 28%);
  opacity: 0;
  transform: translateY(0.2rem) scale(0.96);
  /* box-shadow: 0 6px 14px color-mix(in srgb, var(--camera-right) 20%, transparent); */
  animation: our-work-tag-in 280ms ease 950ms forwards;
}

@keyframes note-box-trace {
  0% {
    background-size:
      0% 2px,
      2px 0%,
      0% 2px,
      2px 0%;
  }
  25% {
    background-size:
      100% 2px,
      2px 0%,
      0% 2px,
      2px 0%;
  }
  50% {
    background-size:
      100% 2px,
      2px 100%,
      0% 2px,
      2px 0%;
  }
  75% {
    background-size:
      100% 2px,
      2px 100%,
      100% 2px,
      2px 0%;
  }
  100% {
    background-size:
      100% 2px,
      2px 100%,
      100% 2px,
      2px 100%;
  }
}

@keyframes note-box-glow {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes our-work-tag-in {
  from {
    opacity: 0;
    transform: translateY(0.2rem) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.note-thumb {
  width: 6rem;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.8rem;
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.note-copy h4 {
  font-size: 2rem;
  margin-bottom: 0.25rem;
}

.note-copy p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.25;
}

.note-divider {
  margin: 0.15rem 0 0;
  border: 0;
  border-top: 1px solid color-mix(in srgb, currentColor 16%, transparent);
}

@media (max-width: 980px) {
  .comparison-layout {
    height: auto;
  }

  .topic-card,
  .text-box {
    position: relative;
    left: auto;
    right: auto;
    top: auto;
    width: 100%;
    min-height: 0;
  }

  .fovea-card.move-left {
    transform: none;
  }
}
</style>
