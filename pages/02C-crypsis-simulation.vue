<script setup lang="ts">
import { useIsSlideActive } from "@slidev/client";
import { computed, ref, watch } from "vue";

const isActive = useIsSlideActive();
const runId = ref(0);

const assetUrls = import.meta.glob(
  "../assets/crypsis/*.{png,jpg,jpeg,webp,avif,gif}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const asset = (name: string) => assetUrls[`../assets/crypsis/${name}`] ?? "";
const crypsisImageA = asset("crypsis.webp");

watch(
  isActive,
  (active) => {
    if (active) runId.value += 1;
  },
  { immediate: true },
);

const frameSrc = computed(
  () => `./crypsis-simulation/index.html?kiosk=1&run=${runId.value}`,
);
</script>

<template>
  <section class="crypsis-slide" :data-active="isActive">
    <aside class="info-panel" aria-label="Crypsis definition and examples">
      <p class="kicker">Definition</p>
      <p class="definition">
        Crypsis is the ability of an organism to see without being detected. 
      </p>

      <div class="placeholder-grid" aria-hidden="true">
        <figure class="placeholder-card">
          <div class="placeholder-image">
            <img :src="crypsisImageA" alt="Crypsis Example A" />
          </div>
        </figure>
        <figure class="placeholder-card">
        </figure>
      </div>
    </aside>

    <div class="frame-shell">
      <iframe
        :key="runId"
        :src="frameSrc"
        title="Crypsis Simulation"
        class="crypsis-frame"
        loading="eager"
      />
    </div>
  </section>
</template>

<style scoped>
.crypsis-slide {
  width: 100%;
  height: calc(100% - 5.6rem);
  margin-top: 1.2rem;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.45fr);
  gap: 1rem;
  align-items: stretch;
}

.info-panel {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  background: color-mix(in srgb, #101b2a 86%, black);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
  padding: 1rem;
  color: #ecf4ff;
}

.kicker {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  opacity: 0.8;
}

.title {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.1;
}

.definition {
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.35;
  color: color-mix(in srgb, #ecf4ff 92%, #9fb2ca);
}

.placeholder-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.55rem;
  margin-top: 0.3rem;
}

.placeholder-card {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.placeholder-image {
  position: relative;
  height: 11rem;
  border-radius: 0.55rem;
  border: 1px dashed rgb(236 244 255 / 0.45);
  overflow: hidden;
}

.placeholder-image img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: bottom;
  display: block;
}

.placeholder-card figcaption {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgb(236 244 255 / 0.72);
}

.frame-shell {
  width: 100%;
  height: 100%;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
  background: #0a1420;
}

.crypsis-frame {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: #0a1420;
  --zoom: 2.5;
  --pan-x: 65%; /* 0% = left edge, 50% = center, 100% = right edge */
  --pan-y: 60%; /* 0% = top edge, 50% = center, 100% = bottom edge */
  transform: scale(var(--zoom));
  transform-origin: var(--pan-x) var(--pan-y);
  margin-bottom: calc((1 - 1 / var(--zoom)) * -100%);
}
</style>
