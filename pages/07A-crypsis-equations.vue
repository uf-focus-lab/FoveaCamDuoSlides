<script setup lang="ts">
import Annotation from "components/Annotation.vue";
import Katex from "components/Katex.vue";
import { renderInline } from "components/katex-context";

defineProps<{
  stage: number;
}>();

const eq7 = "D_i \\triangleq \\|A-T_i\\|_2 < D_{\\max}";
const eq8 = "D_{\\max} \\triangleq \\frac{S_t}{2\\tan(\\theta_T / 2)} \\approx \\frac{S_t}{\\theta_T}";
const feasibleRegion = "\\{ A \\mid D_{\\min} < \\|A-T_i\\|_2 < D_{\\max} \\}";
const eq12 =
  "\\frac{dP_{\\mathrm{succ}}}{dD_{\\max}} = \\frac{2\\pi D_{\\max}}{|\\Omega|}(1-p)^{\\mathcal{A}_{\\mathrm{blk}}(D_{\\max})} \\ge 0";

const calloutStyle = {
  color: "rgb(255, 172, 172)",
  fontSize: "0.85rem",
};
</script>

<template>
  <aside class="info-panel" aria-label="Crypsis definition and examples">
    <section class="equation-panel" aria-label="Crypsis equations from paper">
      <article class="math-block" :class="{ show: stage >= 1 }">
        <div
          class="equation-explainer reveal-disappear"
          :class="{ hide: stage >= 2, show: stage >= 1 }"
          v-html="renderInline('To observe target $i$, observer $A$ must be close enough to resolve it.')"
        />
        <Katex class="equation-line equation-eq7" :tex="eq7" display>
          <Annotation :show="stage === 1" at="A" position="TL" :style="calloutStyle">Observer</Annotation>
          <Annotation :show="stage === 1" at="T" position="TR" :style="calloutStyle">Target</Annotation>
          <Annotation :show="stage === 1" at="−" position="B" :style="calloutStyle">Range</Annotation>
          <Annotation :show="stage === 1" at="D" :at-nth="1" position="R" :style="calloutStyle">Resolvable limit</Annotation>
        </Katex>
      </article>

      <article class="math-block" :class="{ show: stage >= 2 }">
        <div
          class="equation-explainer reveal-disappear"
          :class="{ hide: stage >= 3, show: stage >= 2 }"
          v-html="renderInline('This range limit is set by target size $S_t$ and angular resolution $\\theta_T$.')"
        />
        <Katex class="equation-line" :tex="eq8" display />
      </article>

      <article class="math-block" :class="{ show: stage >= 3 }">
        <div
          class="equation-explainer reveal-disappear"
          :class="{ hide: stage >= 4, show: stage >= 3 }"
          v-html="renderInline('Crypsis is feasible only in this band: far enough to stay unseen, close enough to still see.')"
        />
        <Katex class="equation-line" :tex="feasibleRegion" display />
      </article>

      <article class="math-block" :class="{ show: stage >= 4 }">
        <div
          class="equation-explainer reveal-disappear"
          :class="{ hide: stage >= 5, show: stage >= 4 }"
          v-html="renderInline('As $D_{\\max}$ increases, the feasible crypsis region expands and success becomes more likely.')"
        />
        <Katex class="equation-line" :tex="eq12" display />
      </article>
    </section>
  </aside>
</template>

<style scoped>
.info-panel {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  border: none;
  padding: 0;
  padding-right: 1rem;
}

.equation-panel {
  margin-top: 0.1rem;
  padding: 0;
}

.math-block {
  opacity: 0;
  transform: translateX(20px);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.math-block + .math-block {
  margin-top: 0.9rem;
}

.math-block.show {
  opacity: 1;
  transform: translateX(0);
}

.reveal-disappear {
  display: block;
  max-height: 0;
  margin: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    max-height var(--transition-duration) var(--transition-curve),
    margin var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
  transform: translateX(-40px);
}

.reveal-disappear.show {
  max-height: 3.2em;
  margin: 0.25rem 0 0.25rem;
  opacity: 1;
  transform: translateX(0);
}

.reveal-disappear.hide {
  max-height: 0;
  margin: 0;
  opacity: 0;
  transform: translateX(-40px);
}

/* Extra headroom for eq7's "Observer"/"Target" callouts, which point upward. */
.equation-line.equation-eq7 {
  margin-top: 2.8em;
}

.equation-line {
  margin: 0;
  font-size: 1.18rem;
  line-height: 1.34;
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
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.36;
  color: #d9e7f7;
}
</style>
