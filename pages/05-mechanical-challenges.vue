<script setup lang="ts">
import { computed } from "vue";
import { useStage } from "stores/stage";

const stage = useStage(3, { preview: 3 });

const showFirst = computed(() => stage.value >= 1);
const showSecond = computed(() => stage.value >= 2);
const highlightFirst = computed(() => stage.value >= 3);
</script>

<template>
  <section class="mechanical-challenges" :data-stage="stage">
    <p class="kicker">Two Core Challenges</p>
    <!-- <h2 class="title"></h2> -->

    <div class="challenge-grid">
      <article class="challenge-card" :class="{ show: showFirst, primary: highlightFirst }">
        <p class="challenge-index">Challenge 1</p>
        <h3>Build a system capable of foveation</h3>
        <!-- <p class="challenge-copy">
          Realize controllable foveated sensing hardware that can reliably execute the desired gaze behavior.
        </p> -->
      </article>

      <article class="challenge-card" :class="{ show: showSecond }">
        <p class="challenge-index">Challenge 2</p>
        <h3>Know where to place the foveation</h3>
        <!-- <p class="challenge-copy">
          Decide where the system should attend so high-resolution sensing is used where it matters most.
        </p> -->
      </article>
    </div>
  </section>
</template>

<style scoped>
.mechanical-challenges {
  height: calc(100% - 5.4rem);
  margin-top: 1.35rem;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 0.45rem;
  align-content: start;
}

.kicker {
  margin: 0;
  font-size: 1.15rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: color-mix(in srgb, currentColor 68%, white 32%);
}

.title {
  margin: 0;
  font-size: 2rem;
  line-height: 1.12;
}

.challenge-grid {
  margin-top: 0.45rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.35rem;
  align-items: stretch;
}

.challenge-card {
  position: relative;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 1.15rem;
  padding: 1.4rem 1.35rem;
  background: color-mix(in srgb, var(--fc-bg) 95%, #0b1220 5%);
  display: grid;
  align-content: center;
  gap: 0.85rem;
  min-height: 16.5rem;
  opacity: 0;
  transform: translate3d(0, 0.7rem, 0);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve),
    border-color var(--transition-duration) var(--transition-curve),
    box-shadow var(--transition-duration) var(--transition-curve);
}

.challenge-card.show {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.challenge-card.primary {
  border-color: color-mix(in srgb, var(--camera-right) 62%, white 12%);
  background: color-mix(in srgb, var(--camera-right) 14%, var(--fc-bg) 86%);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--camera-right) 45%, transparent),
    0 0 0 2px color-mix(in srgb, var(--camera-right) 26%, transparent);
}

.challenge-card.primary::after {
  content: "Our Work";
  position: absolute;
  top: -0.6rem;
  right: 0.85rem;
  padding: 0.18rem 0.58rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--camera-right) 52%, white 14%);
  background: color-mix(in srgb, var(--camera-right) 22%, var(--fc-bg) 78%);
  color: color-mix(in srgb, var(--camera-right) 78%, white 22%);
  font-weight: 700;
  font-size: 0.74rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.challenge-index {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: color-mix(in srgb, currentColor 58%, white 42%);
}

.challenge-card h3 {
  margin: 0;
  font-size: 2rem;
  line-height: 1.14;
}

.challenge-copy {
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.3;
  color: color-mix(in srgb, currentColor 82%, white 18%);
}

</style>
