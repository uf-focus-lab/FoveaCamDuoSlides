<script setup lang="ts">
import { useIsSlideActive } from "@slidev/client";
import { computed, ref, watch } from "vue";
import { renderToString } from "katex";
import { useStage } from "stores/stage";
import Annotation from "components/Annotation.vue";

const isActive = useIsSlideActive();
const runId = ref(0);
const stage = useStage(4, { preview: -1 });
const frameEl = ref<HTMLIFrameElement | null>(null);

const eq7 = "D_i \\triangleq \\|A-T_i\\|_2 < D_{\\max}";
const eq8 = "D_{\\max} \\triangleq \\frac{S_t}{2\\tan(\\theta_T / 2)} \\approx \\frac{S_t}{\\theta_T}";
const feasibleRegion = "\\{ A \\mid D_{\\min} < \\|A-T_i\\|_2 < D_{\\max} \\}";
const eq12 =
  "\\frac{dP_{\\mathrm{succ}}}{dD_{\\max}} = \\frac{2\\pi D_{\\max}}{|\\Omega|}(1-p)^{\\mathcal{A}_{\\mathrm{blk}}(D_{\\max})} \\ge 0";

type AnnotationPosition =
  | "T"
  | "TL"
  | "TR"
  | "B"
  | "BL"
  | "BR"
  | "L"
  | "LT"
  | "LB"
  | "R"
  | "RT"
  | "RB";

type Callout = {
  left: string;
  top: string;
  position: AnnotationPosition;
  label: string;
  show: number;
};

type MathBlock = {
  key: string;
  intro: string;
  introShowFrom: number;
  introHideAt: number;
  equation: string;
  showFrom: number;
  callouts?: Callout[];
};

const eq7Callouts: Callout[] = [
  { left: "2.1em", top: "0.95em", position: "TR", label: "Observer", show: 1 },
  { left: "8.4em", top: "0.95em", position: "TR", label: "Target", show: 1 },
  { left: "5.4em", top: "3.25em", position: "BR", label: "Range", show: 1 },
  {
    left: "15.5em",
    top: "2.25em",
    position: "R",
    label: "Resolvable limit",
    show: 1,
  },
];

const mathBlocks: MathBlock[] = [
  {
    key: "eq7",
    intro:
      "To observe target $i$, observer $A$ must be close enough to resolve it.",
    introShowFrom: 1,
    introHideAt: 2,
    equation: eq7,
    showFrom: 1,
    callouts: eq7Callouts,
  },
  {
    key: "eq8",
    intro:
      "This range limit is set by target size $S_t$ and angular resolution $\\theta_T$.",
    introShowFrom: 2,
    introHideAt: 3,
    equation: eq8,
    showFrom: 2,
  },
  {
    key: "region",
    intro:
      "Crypsis is feasible only in this band: far enough to stay unseen, close enough to still see.",
    introShowFrom: 3,
    introHideAt: 4,
    equation: feasibleRegion,
    showFrom: 3,
  },
  {
    key: "eq12",
    intro:
      "As $D_{\\max}$ increases, the feasible crypsis region expands and success becomes more likely.",
    introShowFrom: 4,
    introHideAt: 5,
    equation: eq12,
    showFrom: 4,
  },
];

function renderInline(text: string) {
  return text.replace(/\$([^$]+)\$/g, (_, expr: string) =>
    renderToString(expr, { throwOnError: false }),
  );
}

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

function syncSimulationRegionGrowth() {
  const doc = frameEl.value?.contentDocument;
  if (!doc) return;

  const root = doc.getElementById("app");
  if (!root) return;

  const styleId = "slidev-feasible-growth-style";
  let styleNode = doc.getElementById(styleId) as HTMLStyleElement | null;

  if (!styleNode) {
    styleNode = doc.createElement("style");
    styleNode.id = styleId;
    styleNode.textContent = `
      svg.simulation-world .annotations.feasible-regions {
        clip-path: circle(6% at 50% 50%);
        transition: clip-path 900ms var(--transition-curve, ease-in-out);
      }
      #app.grow-feasible-region svg.simulation-world .annotations.feasible-regions {
        clip-path: circle(46% at 50% 50%);
      }
    `;
    doc.head.appendChild(styleNode);
  }

  root.classList.toggle("grow-feasible-region", stage.value >= 4);
}

watch(
  stage,
  () => {
    syncSimulationRegionGrowth();
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
      <section class="equation-panel" aria-label="Crypsis equations from paper">
        <article
          v-for="block in mathBlocks"
          :key="block.key"
          class="math-block"
          :class="{ show: stage >= block.showFrom }"
        >
          <div
            class="equation-explainer reveal-disappear"
            :class="{ hide: stage >= block.introHideAt, show: stage >= block.introShowFrom }"
            v-html="renderInline(block.intro)"
          />

          <div
            class="equation-shell"
            :class="{
              'equation-shell-callouts': !!block.callouts?.length,
              'equation-shell-eq7': block.key === 'eq7',
            }"
          >
            <div v-if="block.callouts?.length" class="math-callouts" aria-hidden="true">
              <Annotation
                v-for="(callout, index) in block.callouts"
                :key="`${callout.label}-${index}`"
                class="math-callout"
                :show="stage >= callout.show"
                :style="{ left: callout.left, top: callout.top }"
                :position="callout.position"
                offset="1.2em"
              >
                {{ callout.label }}
              </Annotation>
            </div>

            <div class="equation-line" v-html="renderDisplay(block.equation)" />
          </div>
        </article>
      </section>
    </aside>

    <div class="frame-shell">
      <iframe
        ref="frameEl"
        :key="runId"
        :src="frameSrc"
        title="Crypsis Simulation"
        class="crypsis-frame"
        loading="eager"
        @load="syncSimulationRegionGrowth"
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
  gap: 0.7rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  background: color-mix(in srgb, #101b2a 86%, black);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
  padding: 1.15rem 1.2rem;
  color: #ecf4ff;
}

.equation-panel {
  margin-top: 0.1rem;
  padding: 0;
  --eq7-gap: 0.7rem;
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
  transform: translateX(20px);
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
  transform: translateX(0);
}

.equation-shell {
  display: inline-block;
}

.equation-shell-eq7 {
  margin-top: var(--eq7-gap);
}

.equation-shell-callouts {
  position: relative;
  padding: 0.7em 0.9em 0.95em 0.9em;
}

.equation-shell-callouts .math-callouts {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.math-callout {
  position: absolute;
  font-size: 0.7em;
  opacity: 0.95;
  color: rgb(255, 172, 172);
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
