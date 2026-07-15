<script setup lang="ts">
import { computed } from "vue";
import { useStage } from "stores/stage";

const stage = useStage(4);

const assetUrls = import.meta.glob<string>(
  "../assets/alg_example/**/*.webp",
  { eager: true, query: "?url", import: "default" },
);

const asset = (name: string) => assetUrls[`../assets/${name}`] ?? "";

const wideSrc = asset("alg_example/wide.webp");
const foveaLeftSrc = asset("alg_example/fovea-left.webp");
const foveaRightSrc = asset("alg_example/fovea-right.webp");
const outputA = asset("alg_example/prior.webp");
const outputB = asset("alg_example/disparity.webp");

const roi = {
  left: 76,
  top: 82,
  width: 15,
  height: 15,
};

const zoomScaleX = 100 / roi.width;
const zoomScaleY = 100 / roi.height;
const zoomScale = Math.min(zoomScaleX, zoomScaleY);

const walkthroughStyle = {
  "--roi-left": `${roi.left}%`,
  "--roi-top": `${roi.top}%`,
  "--roi-width": `${roi.width}%`,
  "--roi-height": `${roi.height}%`,
  "--zoom-scale": `${zoomScale}`,
  "--zoom-x": `${-(roi.left / roi.width) * 100}%`,
  "--zoom-y": `${-(roi.top / roi.height) * 100}%`,
};

const showRoi = computed(() => stage.value >= 2);
const showZoom = computed(() => stage.value >= 3);
const showOutputs = computed(() => stage.value >= 4);
const labelOutputs = computed(() => stage.value >= 4);
</script>

<template>
  <div
    class="walkthrough"
    :style="walkthroughStyle"
    :class="{
      'is-roi': showRoi,
      'is-zoom': showZoom,
      'is-outputs': showOutputs,
    }"
    aria-label="Example walkthrough from wide image to model outputs"
  >
    <div class="wide-preview">
      <div class="wide-label">Wide Angle</div>
      <section class="wide-panel">
        <img :src="wideSrc" alt="Wide-angle camera frame" class="wide-image" />
        <div class="roi-box" aria-hidden="true"></div>
      </section>
    </div>
    <div class="roi-label" aria-hidden="true">ROI</div>

    <section class="fovea-panel" aria-hidden="true">
      <div class="fovea-preview">
        <div class="fovea-label">Fovea</div>
        <div class="fovea-grid">
          <figure class="fovea-card">
            <img :src="foveaLeftSrc" alt="Left fovea detail crop" class="fovea-image" />
          </figure>
          <figure class="fovea-card">
            <img :src="foveaRightSrc" alt="Right fovea detail crop" class="fovea-image" />
          </figure>
        </div>
      </div>
    </section>

    <section class="fovea-panel" aria-hidden="true">
      <div class="fovea-preview">
        <div class="fovea-label">Outputs</div>
        <div class="fovea-grid">
          <figure class="fovea-card">
            <img :src="outputA" alt="Disparity output" class="fovea-image" />
            <div class="output-label" v-if="labelOutputs">Monocular</div>
          <!-- <figcaption>Prior</figcaption> -->
          </figure>
          <figure class="fovea-card">
            <img :src="outputB" alt="Depth fusion output" class="fovea-image" />
            <div class="output-label" v-if="labelOutputs">Ours</div>
            <!-- <figcaption>Ours</figcaption> -->
          </figure>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.walkthrough {
  --panel-radius: 14px;
  --panel-shadow: 0 16px 28px rgb(7 20 36 / 0.2);
  --paper: #f7f4ee;
  --ink: #162030;
  --accent: #dd6b20;
  --stack-tile-height: 12rem;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
  width: 100%;
  min-height: 24rem;
  color: var(--ink);
  padding: 0.15rem 0.25rem 0.85rem;
}

.wide-panel {
  position: relative;
  border-radius: var(--panel-radius);
  background: var(--paper);
  overflow: hidden;
}

.wide-preview {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
  align-self: center;
}

.wide-label {
  align-self: center;
  z-index: 1;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: #f0f6ff;
}

.wide-panel {
  aspect-ratio: 4 / 3;
  transform: translateX(0) scale(1);
  transition: transform var(--transition-duration) var(--transition-curve);
}

.wide-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform-origin: 0 0;
  transform: translate(0, 0) scale(1);
  transition:
    transform var(--transition-duration) var(--transition-curve),
    filter var(--transition-duration) var(--transition-curve);
}

.roi-box {
  position: absolute;
  left: var(--roi-left);
  top: var(--roi-top);
  width: var(--roi-width);
  height: var(--roi-height);
  border: 3px solid var(--accent);
  /* border-radius: 0.5rem; */
  box-shadow: 0 0 0 999px rgb(0 0 0 / 0.38);
  opacity: 0;
  transform: scale(0.85);
  transition:
    left var(--transition-duration) var(--transition-curve),
    top var(--transition-duration) var(--transition-curve),
    width var(--transition-duration) var(--transition-curve),
    height var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve),
    box-shadow var(--transition-duration) var(--transition-curve),
    border-radius var(--transition-duration) var(--transition-curve);
}

.roi-label {
  position: absolute;
  left: 40%;
  top: 72%;
  transform: translateX(-50%) translateY(0.5rem);
  padding: 0.2rem 0.65rem;
  border-radius: 5px;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
  background: color-mix(in srgb, var(--accent) 84%, white);
  color: #fff;
  opacity: 0;
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.fovea-panel {
  position: relative;
  min-width: 0;
  opacity: 0;
  transform: translateX(1.25rem) scale(0.92);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
  transition-delay: 0ms;
}

.fovea-preview {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
  align-items: stretch;
}

.fovea-label {
  align-self: center;
  z-index: 1;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: #f0f6ff;
  /* background: rgb(9 20 36 / 0.78); */
  /* border: 1px solid rgb(240 246 255 / 0.35); */
  /* border-radius: 999px; */
  /* padding: 0.12rem 0.42rem; */
}

.fovea-image {
  width: 100%;
  height: var(--stack-tile-height);
  object-fit: cover;
  display: block;
}

.fovea-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-auto-rows: auto;
  gap: 0.55rem;
  padding: 0;
}

.fovea-card {
  position: relative;
  margin: 0;
  border: 0;
  border-radius: 0;
  overflow: visible;
  background: transparent;
}

.output-label {
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  z-index: 2;
  font-size: 1rem;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  color: #f0f6ff;
  background: rgb(9 20 36 / 0.78);
  border: 1px solid rgb(240 246 255 / 0.35);
  border-radius: 999px;
  padding: 0.18rem 0.42rem;
  pointer-events: none;
}

.flow {
  display: block;
  align-self: start;
  opacity: 0;
  transform: translateX(0.75rem);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.outputs {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: repeat(2, minmax(0, auto));
  gap: 0.55rem;
  width: 100%;
  opacity: 0;
  transform: translateY(0.8rem);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.output-card {
  margin: 0;
  border: 1px solid rgb(255 255 255 / 0.35);
  border-radius: 0.35rem;
  overflow: hidden;
  background: #02060d;
}

.output-card img {
  width: 70%;
  height: var(--stack-tile-height);
  object-fit: fill;
  display: block;
}

.output-card figcaption {
  position: absolute;
  left: 0.4rem;
  top: 0.35rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.12rem 0.42rem;
  color: #f0f6ff;
  background: rgb(9 20 36 / 0.78);
  border: 1px solid rgb(240 246 255 / 0.35);
  border-radius: 999px;
}

.walkthrough.is-roi .roi-box,
.walkthrough.is-roi .roi-label {
  opacity: 1;
  transform: scale(1);
}

.walkthrough.is-roi .roi-label {
  transform: translateX(-50%) translateY(0);
}

.walkthrough.is-zoom .wide-panel {
  transform: translateX(-0.2rem) scale(0.96);
}

.walkthrough.is-zoom .wide-image {
  transform: translate(var(--zoom-x), var(--zoom-y)) scale(var(--zoom-scale));
}
.walkthrough .wide-image {
  filter: saturate(1.05) contrast(1.03);
}

.walkthrough.is-zoom .roi-box {
  opacity: 0.15;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  box-shadow: 0 0 0 999px rgb(0 0 0 / 0.08);
}

.walkthrough.is-zoom .roi-label {
  opacity: 0;
}

.walkthrough.is-zoom .fovea-panel {
  opacity: 1;
  transform: translateX(0) scale(1);
  transition-delay: 260ms;
}

.walkthrough.is-outputs .outputs {
  opacity: 1;
  transform: translateY(0);
}

.walkthrough.is-outputs .flow {
  opacity: 1;
  transform: translateX(0);
}
</style>
