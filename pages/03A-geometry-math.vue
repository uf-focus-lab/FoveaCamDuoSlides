<script setup lang="ts">
import { computed } from "vue";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { faLightbulb } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { renderToString } from "katex";
import Annotation from "components/Annotation.vue";

const props = defineProps<{ stage: number }>();
const stage = computed(() => props.stage);

config.autoAddCss = false;

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
  stackedTop?: string;
  stackedLeft?: string;
  compactLeft?: string;
  compactTop?: string;
  callouts?: Callout[];
};

const callouts: Callout[] = [
  { left: "3em", top: "5em", position: "BR", label: "Depth", show: 1 },
  { left: "9.5em", top: "1.5em", position: "TR", label: "Baseline", show: 1 },
  { left: "7.4em", top: "1.5em", position: "TL", label: "Focal Length", show: 1 },
];

const primaryBlocks: MathBlock[] = [
  {
    key: "depth",
    intro: "Depth $Z$ from disparity $d$ (px):",
    introShowFrom: 1,
    introHideAt: 2,
    equation: "Z=\\frac{f \\cdot b}{d}",
    showFrom: 1,
    stackedTop: "0rem",
    compactLeft: "0rem",
    compactTop: "0rem",
    callouts,
  },
  {
    key: "derivative",
    intro: "Differentiate with respect to disparity:",
    introShowFrom: 2,
    introHideAt: 3,
    equation: "\\frac{\\delta Z}{\\delta d} = - \\frac{f \\cdot b}{d^2}",
    showFrom: 2,
    stackedTop: "calc(100% + -2em)",
    compactLeft: "7.7em",
    compactTop: "0rem",
  },
];

const secondaryBlocks: MathBlock[] = [
  {
    key: "resolution",
    intro: "Depth resolution $\\Delta Z$ per pixel step: $\\delta d = 1$",
    introShowFrom: 3,
    introHideAt: 4,
    equation: "|\\delta Z| ~=~ \\frac{f \\cdot b}{d^2}",
    showFrom: 3,
    stackedLeft: "0rem",
    stackedTop: "0rem",
  },
  {
    key: "substitute",
    intro: "Substitute $d = \\frac{f \\cdot b}{Z}$:",
    introShowFrom: 4,
    introHideAt: 5,
    equation: "|\\delta Z| ~=~ \\frac{Z ^ 2}{f \\cdot b}",
    showFrom: 4,
    compactLeft: "7.7em",
    compactTop: "0rem",
  },
];

const compacted = computed(() => stage.value >= 3);

const compactPrimary = computed(() =>
  primaryBlocks.map((block) => ({
    ...block,
    style: {
      left:
        block.key === "depth"
          ? "0rem"
          : compacted.value
            ? block.compactLeft ?? "0rem"
            : "0rem",
      top:
        block.key === "depth"
          ? "0rem"
          : compacted.value
            ? block.compactTop ?? "0rem"
            : block.stackedTop ?? "0rem",
    },
  })),
);

const resolutionBlock = computed(() => secondaryBlocks[0]);
const substituteBlock = computed(() => secondaryBlocks[1]);

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
</script>

<template>
  <section class="math">
    <div class="block-group primary-group" :class="{ compact: stage >= 3 }">
      <article
        v-for="block in compactPrimary"
        :key="block.key"
        class="math-block"
        :class="[
          `math-block-${block.key}`,
          { show: stage >= block.showFrom, compact: stage >= 3 },
        ]"
        :style="block.style"
      >
        <div
          class="block-intro reveal-disappear"
          :class="{ hide: stage >= block.introHideAt, show: stage >= block.introShowFrom }"
          v-html="renderInline(block.intro)"
        />

        <div class="equation-shell" :class="{ 'equation-shell-callouts': !!block.callouts?.length }">
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

          <div class="equation-html" v-html="renderDisplay(block.equation)" />
        </div>
      </article>
    </div>

    <div class="block-group secondary-group" :class="{ 'question-stage': stage >= 6 }">
      <article class="math-block math-block-secondary math-block-resolution" :class="{ show: stage >= resolutionBlock.showFrom }">
        <div class="block-intro-stack">
          <div
            class="block-intro reveal-disappear block-intro-overlay"
            :class="{ hide: stage >= resolutionBlock.introHideAt, show: stage >= resolutionBlock.introShowFrom }"
            v-html="renderInline(resolutionBlock.intro)"
          />

          <div
            class="block-intro reveal-disappear block-intro-overlay"
            :class="{ hide: stage < substituteBlock.introShowFrom || stage >= substituteBlock.introHideAt, show: stage >= substituteBlock.introShowFrom }"
            v-html="renderInline(substituteBlock.intro)"
          />
        </div>

        <div class="equation-html" v-html="renderDisplay(resolutionBlock.equation)" />
      </article>

      <article
        class="math-block math-block-secondary math-block-substitute"
        :class="{ show: stage >= substituteBlock.showFrom }"
        :style="{ left: substituteBlock.compactLeft ?? '0rem', top: substituteBlock.compactTop ?? '0rem' }"
      >
        <div class="equation-html" v-html="renderDisplay(substituteBlock.equation)" />
      </article>
    </div>

    <div class="question-wrap reveal" :class="{ show: stage >= 6 }">
      <div class="reveal-body">
        <div class="question">
          <FontAwesomeIcon :icon="faLightbulb" />
          How about increasing resolution?
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.math {
  position: absolute;
  top: calc(50% + 50px);
  left: 40px;
  font-size: 2rem;
  text-align: left;
  transform: translateY(-50%);
}

.math :deep(.katex-display) {
  margin: 0.35em 0;
}

.math :deep(.katex-display),
.math :deep(.katex-display > .katex) {
  text-align: left;
}

.math-callout {
  position: absolute;
  font-size: 0.62em;
  opacity: 0.95;
  color: color-mix(in srgb, var(--camera-center) 72%, white);
}

.var,
.math :deep(.mord),
.math :deep(.mord.mathnormal) {
  font-family: "KaTeX_Math", "Times New Roman", serif;
}

.reveal-disappear {
  display: block;
  max-height: 2.3em;
  margin-bottom: 0.45em;
  overflow: hidden;
  opacity: 1;
  transition:
    max-height var(--transition-duration) var(--transition-curve),
    margin-bottom var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve);
}

.reveal-disappear.hide {
  max-height: 0;
  margin-bottom: 0;
  opacity: 0;
}

.block-group {
  position: relative;
  width: max-content;
}

.primary-group {
  min-height: 7em;
  margin-top: 1em;
  transition:
    min-height var(--transition-duration) var(--transition-curve),
    margin-top var(--transition-duration) var(--transition-curve);
}

.secondary-group {
  min-height: 8.7em;
  margin-top: 0.45em;
  padding-right: 0;
  transform: translateY(0);
  transition:
    min-height var(--transition-duration) var(--transition-curve),
    padding-right var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.secondary-group.question-stage {
  transform: translateY(-1.6em);
}

.math-block {
  position: absolute;
  left: 0;
  top: 0;
  width: max-content;
  opacity: 0;
  transform: translateX(20px);
  transition:
    left var(--transition-duration) var(--transition-curve),
    top var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.math-block.show {
  opacity: 1;
  transform: translateX(0);
}

.math-block-resolution {
  left: 0;
  top: -4rem;
  padding-top: 2.2em;
  box-sizing: border-box;
}

.math-block-substitute {
  top: -4rem;
}

.equation-shell {
  display: inline-block;
}

.math-block-depth .equation-shell {
  position: relative;
  padding: 0.85em 1.45em 1.1em 1.45em;
}

.math-block-derivative .equation-shell {
  padding-top: 0;
  transition: padding-top var(--transition-duration) var(--transition-curve);
}

.math-block-derivative.compact .equation-shell {
  padding-top: 0.85em;
}

.primary-group.compact .math-block-derivative {
  transition-delay:
    var(--transition-duration),
    var(--transition-duration),
    0s,
    var(--transition-duration);
}

.primary-group.compact .math-block-derivative .equation-shell {
  transition-delay: var(--transition-duration);
}

.secondary-group .math-block-resolution {
  transition-delay:
    0s,
    0s,
    var(--transition-duration),
    var(--transition-duration);
}

.equation-shell-callouts .math-callouts {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.equation-html {
  width: max-content;
}

.primary-group.compact {
  min-height: 7em;
  margin-top: 1.35em;
}

.block-intro {
  white-space: nowrap;
}

.block-intro-stack {
  position: absolute;
  left: 0;
  top: 0;
  width: max-content;
  min-width: 100%;
  height: 3.2em;
}

.block-intro-overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: max-content;
  min-width: 100%;
}

.secondary-group .math-block {
  transform: translateY(0.4rem);
}

.secondary-group .math-block.show {
  transform: translateY(0);
}

.question-wrap {
  margin-top: -6.5em;
  min-height: 3.2em;
}

.reveal {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.5s ease,
    opacity 0.5s ease;
}

.reveal.show {
  grid-template-rows: 1fr;
  opacity: 1;
}

.reveal-body {
  min-height: 0;
  overflow: visible;
}

.question {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.35em 0.75em;
  box-sizing: border-box;
  border: 2px solid color-mix(in srgb, var(--yellow-1) 22%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--yellow-soft) 75%, transparent);
  color: var(--yellow-1);
  font-style: italic;
  font-weight: 600;
}

.question :deep(svg) {
  height: 1em;
  margin: 0;
}
</style>