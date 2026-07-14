<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ stage: number }>();
const mapVisible = computed(() => props.stage >= 1);
</script>

<template>
  <div class="calibration-controls">
    <div class="voltage-angle-map">
      <div class="va-node va-upper">
        <span class="va-title">Control Voltage</span>
        <span class="va-sym"><i>v</i><sub>x</sub> / <i>v</i><sub>y</sub></span>
      </div>
      <div class="va-arrow" aria-hidden="true">⇕</div>
      <div class="va-node va-lower">
        <span class="va-title">Pointing Angle</span>
        <span class="va-sym"><i>a</i><sub>x</sub> / <i>a</i><sub>y</sub></span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.calibration-controls {
  position: relative;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--fc-fg);
}

.voltage-angle-map {
  grid-area: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.va-arrow {
  transform: scale(0);
}

.voltage-angle-map .va-upper,
.voltage-angle-map .va-lower {
  transform: translateY(0);
}

.voltage-angle-map .va-arrow {
  transform: scale(1);
}

.va-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  min-width: 13rem;
  padding: 0.6rem 1.6rem;
  border: 2px solid color-mix(in srgb, currentColor 55%, transparent);
  border-radius: 18px;
  background: color-mix(in srgb, currentColor 6%, transparent);
}

.va-title {
  font-size: 1.05rem;
  font-weight: 600;
  font-variant: small-caps;
  letter-spacing: 0.06em;
  opacity: 0.82;
}

.va-sym {
  font-family: "Times New Roman", Times, serif;
  font-size: 2.4rem;
  font-style: italic;
  letter-spacing: 0.02em;
}

.va-sym sub {
  font-size: 0.6em;
  font-style: italic;
}

.va-arrow {
  font-size: 3.4rem;
  line-height: 1;
  opacity: 0.7;
}
</style>
