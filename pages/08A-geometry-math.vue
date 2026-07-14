<script setup lang="ts">
import { computed } from "vue";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { faLightbulb } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import Annotation from "components/Annotation.vue";
import Katex from "components/Katex.vue";
import { renderInline } from "components/katex-context";

const props = defineProps<{ stage: number }>();
const stage = computed(() => props.stage);

config.autoAddCss = false;

const calloutStyle = {
  color: "color-mix(in srgb, var(--camera-center) 70%, black)",
  fontSize: "1.2rem",
};
</script>

<template>
  <section class="math">
    <!-- Depth -->
    <div
      class="intro"
      :class="{ show: stage >= 1, hide: stage >= 3 }"
      :style="{ left: '0', top: '1.2em' }"
      v-html="renderInline('Depth $Z$ from disparity $d$ (px):')"
    />
    <Katex
      class="equation"
      :class="{ show: stage >= 1 }"
      :style="{
        left: stage < 4 ? '4em' : '0',
        top: stage < 4 ? '6em' : '1.2em',
      }"
      tex="Z = \frac{f \cdot b}{d}"
      display
    >
      <Annotation :show="stage === 2" at="Z" position="B" :style="calloutStyle"
        >Depth</Annotation
      >
      <Annotation :show="stage === 2" at="b" position="TR" :style="calloutStyle"
        >Baseline</Annotation
      >
      <Annotation :show="stage === 2" at="f" position="TL" :style="calloutStyle"
        >Focal Length</Annotation
      >
    </Katex>

    <!-- Derivative -->
    <div
      class="intro"
      :class="{ show: stage >= 4, hide: stage >= 5 }"
      :style="{ left: '0', top: '4.8em' }"
      v-html="renderInline('Differentiate with respect to disparity:')"
    />
    <Katex
      class="equation"
      :class="{ show: stage >= 4 }"
      :style="{
        left: stage < 6 ? '4em' : '6em',
        top: stage < 6 ? '8.4em' : '1.2em',
      }"
      tex="\frac{\delta Z}{\delta d} = - \frac{f \cdot b}{d^2}"
      display
    />

    <!-- Resolution (substitution is a callout attached to d) -->
    <div
      class="intro"
      :class="{ show: stage >= 6, hide: stage >= 9 }"
      :style="{ left: '0', top: '4.8em' }"
      v-html="
        renderInline(
          'Depth resolution $\\Delta Z$ per $\\Delta d = 1~\\text{px}$',
        )
      "
    />
    <Katex
      class="equation"
      :class="{ show: stage >= 6 }"
      :style="{
        left: 0,
        top: stage < 10 ? '8.4em' : '6.2em',
      }"
      tex="|\Delta Z| ~=~ \frac{f \cdot b}{d^2}"
      display
    >
      <Annotation :show="stage === 8" at="d" position="B" html :style="calloutStyle">
        <Katex tex="d = \frac{f \cdot b}{Z}" />
      </Annotation>
    </Katex>

    <!-- Substitute -->
    <Katex
      class="equation"
      :class="{ show: stage >= 8 }"
      :style="{
        left: '7.7em',
        top: stage < 10 ? '8.4em' : '6.2em',
      }"
      tex="=~ \frac{Z ^ 2}{f \cdot b}"
      display
    />

    <!-- Question -->
    <div
      class="question"
      :class="{ show: stage >= 10 }"
      :style="{ left: '0', top: '10.4em' }"
    >
      <span class="question-pill">
        <FontAwesomeIcon :icon="faLightbulb" />
        How about increasing resolution?
      </span>
    </div>
  </section>
</template>

<style scoped lang="scss">
.math {
  position: absolute;
  top: calc(50% + 45px);
  left: 40px;
  height: 14em;
  width: max-content;
  font-size: 1.8rem;
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

.var,
.math :deep(.mord),
.math :deep(.mord.mathnormal) {
  font-family: "KaTeX_Math", "Times New Roman", serif;
}

/* Every equation is an absolutely-positioned direct child of the section;
   movement + reveal both animate on top/left/opacity. */
.equation {
  position: absolute;
  width: max-content;
  opacity: 0;
  /* Anchored on the mid-left of its bbox (top = vertical center); the 40px is
     the enter-from-below offset. */
  transform: translateY(calc(-50% + 40px));
  transition:
    top var(--transition-duration) var(--transition-curve),
    left var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.equation.show {
  opacity: 1;
  transform: translateY(-50%);
}

/* Intro line, positioned directly above its equation. It enters fading in from
   below (40px) and exits fading out to the left (40px). */
.intro {
  position: absolute;
  display: block;
  white-space: nowrap;
  opacity: 0;
  /* Mid-left anchored (top = vertical center); 40px is the enter-from-below offset. */
  transform: translate(0, calc(-50% + 40px));
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.intro.show {
  opacity: 1;
  transform: translate(0, -50%);
}

.intro.hide {
  opacity: 0;
  transform: translate(-40px, -50%);
}

.question {
  position: absolute;
  opacity: 0;
  transform: translateY(calc(-50% + 40px));
  transition:
    top var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.question.show {
  opacity: 1;
  transform: translateY(-50%);
}

.question-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  white-space: nowrap;
  padding: 0.35em 0.75em;
  box-sizing: border-box;
  border: 2px solid color-mix(in srgb, var(--blue-1) 22%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--blue-soft) 75%, transparent);
  color: var(--blue-1);
  font-size: 1.6rem;
  font-style: italic;
  font-weight: 600;
}

.question-pill :deep(svg) {
  height: 1em;
  margin: 0;
}
</style>
