<script setup lang="ts">
import { useIsSlideActive } from "@slidev/client";
import { computed, ref, watch } from "vue";
import { renderToString } from "katex";
import { useStage } from "stores/stage";

const isActive = useIsSlideActive();
const runId = ref(0);
const stage = useStage(4, { preview: -1 });

const eq7 = "D_i \\triangleq \\|A-T_i\\|_2 < D_{\\max}";
const eq8 = "D_{\\max} \\triangleq \\frac{S_t}{2\\tan(\\theta_T / 2)} \\approx \\frac{S_t}{\\theta_T}";
const feasibleRegion = "\\{ A \\mid D_{\\min} < \\|A-T_i\\|_2 < D_{\\max} \\}";
const eq12 =
  "\\frac{dP_{\\mathrm{succ}}}{dD_{\\max}} = \\frac{2\\pi D_{\\max}}{|\\Omega|}(1-p)^{\\mathcal{A}_{\\mathrm{blk}}(D_{\\max})} \\ge 0";

function renderDisplay(expr: string) {
  return renderToString(expr, {
    displayMode: true,
    throwOnError: false,
  });
}

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
      <!-- <p class="kicker reveal-block" :class="{ show: stage >= 1 }">Definition</p> -->
      <!-- <p class="definition reveal-block" :class="{ show: stage >= 1 }">
        Crypsis is the ability of an organism to see without being detected.
      </p> -->

      <section class="equation-panel" aria-label="Crypsis equations from paper">
        <p class="equation-explainer reveal-block" :class="{ show: stage >= 2 }">
          We define a feasible observation region using the target position, the observer position, a maximum distance for resolving the target, and a minimum distance for remaining unseen.
        </p>

        <div class="reveal-block" :class="{ show: stage >= 2 }">
          <p class="equation-label">Eq. (7)</p>
          <div class="equation-line" v-html="renderDisplay(eq7)" />
        </div>

        <div class="reveal-block" :class="{ show: stage >= 2 }">
          <p class="equation-label">Eq. (8)</p>
          <div class="equation-line" v-html="renderDisplay(eq8)" />
        </div>

        <!-- <div class="reveal-block" :class="{ show: stage >= 3 }">
          <p class="equation-label">Feasible Region</p>
          <div class="equation-line" v-html="renderDisplay(feasibleRegion)" />
        </div>

        <p class="equation-explainer reveal-block" :class="{ show: stage >= 3 }">
          These equations say there is a band where observation is possible: close enough to resolve the target, but far enough away to avoid being seen.
        </p>

        <p class="equation-explainer reveal-block" :class="{ show: stage >= 4 }">
          We further derive this in terms of probability under obstacle uncertainty. More details are in the paper.
        </p>
      -->
        <div class="reveal-block" :class="{ show: stage >= 4 }">
          <p class="equation-label">Eq. (12)</p>
          <div class="equation-line" v-html="renderDisplay(eq12)" />
        </div>

        <!-- <p class="equation-explainer reveal-block" :class="{ show: stage >= 4 }">
          Eq. (12) shows that increasing the maximum observable distance strictly improves the probability of successful observation.
        </p> -->
        <!--
        <p class="equation-closing reveal-block" :class="{ show: stage >= 4 }">
          We go into these derivations in detail in the paper.
        </p> -->
      </section>
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: stretch;
}

.info-panel {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  background: color-mix(in srgb, #101b2a 86%, black);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
  padding: 1.15rem 1.2rem;
  color: #ecf4ff;
}

.reveal-block {
  opacity: 0;
  transform: translateX(20px);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.reveal-block.show {
  opacity: 1;
  transform: translateX(0);
}

.kicker {
  margin: 0;
  font-size: 0.9rem;
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
  font-size: 1.55rem;
  line-height: 1.25;
  color: color-mix(in srgb, #ecf4ff 92%, #9fb2ca);
}

.equation-panel {
  margin-top: 0.35rem;
  padding: 0.95rem 1rem;
  border-radius: 0.55rem;
  border: 1px solid rgb(236 244 255 / 0.2);
  background: rgb(10 20 32 / 0.5);
}

.equation-label {
  margin: 0.55rem 0 0.25rem;
  font-size: 0.88rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgb(236 244 255 / 0.72);
}

.equation-line {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.35;
  color: #f3f8ff;
  font-family: "Times New Roman", serif;
}

.equation-line :deep(.katex-display) {
  margin: 0.2rem 0 0.35rem;
}

.equation-line :deep(.katex-display),
.equation-line :deep(.katex-display > .katex) {
  text-align: left;
}

.equation-explainer {
  margin: 0.75rem 0 0.45rem;
  font-size: 1rem;
  line-height: 1.4;
  color: #d9e7f7;
}

.equation-closing {
  margin: 0.7rem 0 0;
  font-size: 0.96rem;
  line-height: 1.4;
  color: #cfe1f6;
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
