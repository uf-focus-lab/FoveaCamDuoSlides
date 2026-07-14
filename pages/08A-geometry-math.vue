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
  color: "color-mix(in srgb, var(--camera-center) 72%, white)",
  fontSize: "1.2rem",
};
</script>

<template>
  <section class="math">
    <!-- Depth -->
    <article class="block" :class="{ show: stage >= 1 }" :style="{ left: '0', top: '1.4em' }">
      <div
        class="intro"
        :class="{ hide: stage >= 2 }"
        v-html="renderInline('Depth $Z$ from disparity $d$ (px):')"
      />
      <Katex class="equation" tex="Z=\frac{f \cdot b}{d}" display>
        <Annotation :show="stage >= 1" at="Z" position="B" :style="calloutStyle">Depth</Annotation>
        <Annotation :show="stage >= 1" at="b" position="TR" :style="calloutStyle">Baseline</Annotation>
        <Annotation :show="stage >= 1" at="f" position="TL" :style="calloutStyle">Focal Length</Annotation>
      </Katex>
    </article>

    <!-- Derivative -->
    <article
      class="block block-deriv"
      :class="{ show: stage >= 2 }"
      :style="{ left: stage >= 3 ? '7.7em' : '0', top: stage >= 3 ? '1.4em' : '4.6em' }"
    >
      <div
        class="intro"
        :class="{ hide: stage >= 3 }"
        v-html="renderInline('Differentiate with respect to disparity:')"
      />
      <Katex class="equation" tex="\frac{\delta Z}{\delta d} = - \frac{f \cdot b}{d^2}" display />
    </article>

    <!-- Resolution -->
    <article
      class="block"
      :class="{ show: stage >= 3 }"
      :style="{ left: '0', top: stage >= 6 ? '2.6em' : '4.2em' }"
    >
      <div class="intro-stack">
        <div
          class="intro"
          :class="{ hide: stage >= 4 }"
          v-html="renderInline('Depth resolution $\\Delta Z$ per pixel step: $\\delta d = 1$')"
        />
        <div
          class="intro"
          :class="{ hide: stage < 4 || stage >= 5 }"
          v-html="renderInline('Substitute $d = \\frac{f \\cdot b}{Z}$:')"
        />
      </div>
      <Katex class="equation" tex="|\delta Z| ~=~ \frac{f \cdot b}{d^2}" display />
    </article>

    <!-- Substitute -->
    <article
      class="block"
      :class="{ show: stage >= 4 }"
      :style="{ left: '7.7em', top: stage >= 6 ? '5.8em' : '7.4em' }"
    >
      <Katex class="equation" tex="|\delta Z| ~=~ \frac{Z ^ 2}{f \cdot b}" display />
    </article>

    <!-- Question -->
    <div class="question" :class="{ show: stage >= 6 }" :style="{ left: '0', top: '8.8em' }">
      <FontAwesomeIcon :icon="faLightbulb" />
      How about increasing resolution?
    </div>
  </section>
</template>

<style scoped lang="scss">
.math {
  position: absolute;
  top: calc(50% + 50px);
  left: 40px;
  height: 12em;
  width: max-content;
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

.var,
.math :deep(.mord),
.math :deep(.mord.mathnormal) {
  font-family: "KaTeX_Math", "Times New Roman", serif;
}

// Absolutely-positioned equation block; movement + reveal both animate on
// top/left/opacity so no wrapper reflow is needed.
.block {
  position: absolute;
  width: max-content;
  opacity: 0;
  transition:
    top var(--transition-duration) var(--transition-curve),
    left var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve);
}

.block.show {
  opacity: 1;
}

.equation {
  width: max-content;
}

// Align the derivative fraction with the depth fraction once side by side.
.block-deriv .equation {
  padding-top: 0.85em;
}

// Collapsing intro line above an equation.
.intro {
  display: block;
  max-height: 2.3em;
  margin-bottom: 0.45em;
  overflow: hidden;
  white-space: nowrap;
  opacity: 1;
  transition:
    max-height var(--transition-duration) var(--transition-curve),
    margin-bottom var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve);
}

.intro.hide {
  max-height: 0;
  margin-bottom: 0;
  opacity: 0;
}

// Two intros that swap in place above the resolution equation.
.intro-stack {
  position: relative;
  height: 3.2em;
}

.intro-stack .intro {
  position: absolute;
  top: 0;
  left: 0;
}

.question {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.35em 0.75em;
  box-sizing: border-box;
  border: 2px solid color-mix(in srgb, var(--blue-1) 22%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--blue-soft) 75%, transparent);
  color: var(--blue-1);
  font-size: 1.6rem;
  font-style: italic;
  font-weight: 600;
  opacity: 0;
  transition:
    top var(--transition-duration) var(--transition-curve),
    opacity var(--transition-duration) var(--transition-curve);
}

.question.show {
  opacity: 1;
}

.question :deep(svg) {
  height: 1em;
  margin: 0;
}
</style>
