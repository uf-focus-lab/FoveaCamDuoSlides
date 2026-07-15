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
  Object.entries(assetUrls).map(([path, src]) => [
    path.split("/").pop() ?? path,
    src,
  ]),
) as Record<string, string>;

const stereoImage = computed(() => inspirationImages["hawk.webp"] ?? "");
const foveaImage = computed(() => inspirationImages["fovea.webp"] ?? "");

const stage = useStage(3, { preview: 2 });

const showStereo = computed(() => stage.value >= 1);
const showFovea = computed(() => stage.value >= 2);
const showTakeaway = computed(() => stage.value >= 3);
</script>

<template>
  <section class="duo-layout" :data-stage="stage">
    <div class="duo">
      <article class="tile" :class="{ show: showStereo }">
        <span class="media">
          <img
            v-if="stereoImage"
            :src="stereoImage"
            alt="Hawk with forward-facing eyes"
          />
        </span>
        <p class="tag">Stereo Vision</p>
        <h3>
          Multiple eyes allow <strong>perception of depth</strong> through
          triangulation of objects in the world
        </h3>
      </article>

      <div class="divider" />

      <article class="tile" :class="{ show: showFovea }">
        <span class="media">
          <img
            v-if="foveaImage"
            :src="foveaImage"
            alt="Fovea and photoreceptor density diagram"
          />
        </span>
        <p class="tag">Foveation</p>
        <h3>
          Concentrated photoreceptors provide <strong>rich details</strong> in
          regions of interest
        </h3>
      </article>
    </div>

    <div class="takeaway" :class="{ show: showTakeaway }">
      <span class="takeaway-pill">
        Stereo and foveation provide many capabilities.
      </span>
    </div>
  </section>
</template>

<style scoped>
.duo-layout {
  height: calc(100% - 5.4rem);
  margin-top: 1rem;
  display: grid;
  grid-template-rows: 1fr auto;
  row-gap: 0.6rem;
  padding-bottom: 1.4rem;
}

.duo {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  /* Top-align so the discs and tags share a line even when the headlines
     wrap differently; the group itself is centered in its row. */
  align-items: start;
  align-self: center;
  column-gap: 1.5rem;
}

.divider {
  align-self: center;
  width: 1px;
  height: 68%;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--divider) 22%,
    var(--divider) 78%,
    transparent
  );
}

.tile {
  display: grid;
  justify-items: center;
  gap: 0.9rem;
  padding: 1.2rem 1.4rem;
  text-align: center;
  opacity: 0;
  transform: translateY(40px);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.tile.show {
  opacity: 1;
  transform: translateY(0);
}

.media {
  display: block;
  width: 10rem;
  height: 10rem;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--divider);
  background: color-mix(in srgb, currentColor 6%, transparent);
}

.media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tag {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-3);
}

.tile h3 {
  margin: 0;
  max-width: 18em;
  font-size: 1.65rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--text-1);
  text-wrap: balance;
}

.tile h3 strong {
  font-weight: 700;
  color: var(--blue-2);
}

.takeaway {
  justify-self: center;
  opacity: 0;
  transform: translateY(40px);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.takeaway.show {
  opacity: 1;
  transform: translateY(0);
}

.takeaway-pill {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  padding: 0.35em 0.9em;
  border: 2px solid color-mix(in srgb, var(--blue-1) 22%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--blue-soft) 75%, transparent);
  color: var(--blue-1);
  font-size: 1.5rem;
  font-style: italic;
  font-weight: 600;
}
</style>
