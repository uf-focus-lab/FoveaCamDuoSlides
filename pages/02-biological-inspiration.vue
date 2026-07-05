<script setup lang="ts">
import { computed, ref, watch } from "vue";
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

const slides = selectedImageNames.flatMap(({ file }) => {
  const src = assetsByName[file];
  if (!src) {
    console.warn(`[02-biological-inspiration] Missing inspiration image: ${file}`);
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

const activeLabel = computed(
  () => selectedImageNames[activeIndex.value]?.label ?? "",
);

const labelDirection = ref<1 | -1>(1);

watch(activeIndex, (next, previous) => {
  if (next === previous) return;
  labelDirection.value = next > previous ? 1 : -1;
});

const labelTransitionName = computed(() =>
  labelDirection.value > 0 ? "animal-label-forward" : "animal-label-backward",
);
</script>

<template>
  <section class="slide">
    <CoverFlow
      :items="slides"
      :active-index="activeIndex"
      class="inspiration-cover-flow"
    />
    <Transition :name="labelTransitionName" mode="out-in">
      <p v-if="activeLabel" :key="activeLabel" class="animal-label">
        {{ activeLabel }}
      </p>
    </Transition>
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

.animal-label {
  position: absolute;
  left: 50%;
  bottom: -2.5rem;
  transform: translate3d(-50%, 0, 0);
  margin: 0;
  padding: 0.28rem 0.8rem;
  color: var(--fc-fg);
  font-size: 2rem;
  letter-spacing: 0.04em;
  z-index: 3;
  pointer-events: none;
  white-space: nowrap;
  --transition-duration: 0.25s;
}

.animal-label-forward-enter-active,
.animal-label-forward-leave-active,
.animal-label-backward-enter-active,
.animal-label-backward-leave-active {
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.animal-label-forward-enter-from {
  opacity: 0;
  transform: translate3d(calc(-50% + 1.4rem), 0.25rem, 0);
}

.animal-label-forward-enter-to,
.animal-label-forward-leave-from {
  opacity: 1;
  transform: translate3d(-50%, 0, 0);
}

.animal-label-forward-leave-to {
  opacity: 0;
  transform: translate3d(calc(-50% - 1.4rem), -0.15rem, 0);
}

.animal-label-backward-enter-from {
  opacity: 0;
  transform: translate3d(calc(-50% - 1.4rem), 0.25rem, 0);
}

.animal-label-backward-enter-to,
.animal-label-backward-leave-from {
  opacity: 1;
  transform: translate3d(-50%, 0, 0);
}

.animal-label-backward-leave-to {
  opacity: 0;
  transform: translate3d(calc(-50% + 1.4rem), -0.15rem, 0);
}
</style>
