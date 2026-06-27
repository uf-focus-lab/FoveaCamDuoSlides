<script setup lang="ts">
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { faLightbulb } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

defineProps<{ stage: number }>();

config.autoAddCss = false; // CSS imported above; avoid runtime injection / flash
</script>

<style scoped lang="scss">
section.math {
  font-size: 1.5rem;
  text-align: left;
  position: absolute;
  top: calc(50% + 20px);
  left: 40px;
  transform: translateY(-50%);
  transition: all 0.5s ease-in-out;
}

section.math :deep(.katex-display) {
  margin: 0.35em 0;
}

/* KaTeX centers display math on the inner `.katex` too, so override both. */
section.math :deep(.katex-display),
section.math :deep(.katex-display > .katex) {
  text-align: left;
}

.eq {
  position: relative;
}

.eq .arrows {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

/* Animated reveal: the grid track eases 0fr -> 1fr so siblings reflow, while
   the content fades in via opacity. Overflow stays visible so tall equations
   aren't clipped; the opacity keeps the overflowing collapsed content hidden. */
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

/* Same-row reveal: the comma fades in; the derivative fades while sliding in
   20px from the right. Both keep their layout slot, so the base eq stays put. */
.eqrow {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  gap: 0.4em;
}

.sep,
.deriv {
  opacity: 0;
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

.deriv {
  transform: translateX(20px);
}

.sep.show {
  opacity: 1;
}

.deriv.show {
  opacity: 1;
  transform: translateX(0);
}

/* Concluding open question: lightbulb + amber so it reads apart from the math. */
.question {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  margin-top: 0.8em;
  padding: 0.4em 0.8em;
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

<section class="math">

Depth $Z$ from disparity $d$ (px):

<div class="eqrow">

$$Z=\frac{f \cdot b}{d}$$

<div class="sep" :class="{ show: stage >= 2 }">

$$,$$

</div>

<div class="deriv" :class="{ show: stage >= 2 }">

$$\frac{\delta Z}{\delta d} = - \frac{f \cdot b}{d^2}$$

</div>

</div>

<div class="reveal" :class="{ show: stage >= 3 }">
<div class="reveal-body">

Depth <b><i>resolution</i></b> $\Delta Z$ per pixel step:

$$
|\Delta Z| ~=~ \frac{f \cdot b}{d^2} ~=~ \frac{Z ^ 2}{f \cdot b}
$$

</div>
</div>

<div class="reveal" :class="{ show: stage >= 4 }">
  <div class="reveal-body">
    <div class="question">
      <FontAwesomeIcon :icon="faLightbulb" />
      How about increasing resolution?
    </div>
  </div>
</div>

</section>
