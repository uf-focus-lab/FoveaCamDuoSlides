<script setup lang="ts">
import { computed } from "vue";
import setupPhoto from "assets/calibration/extrinsic/setup.webp";

const props = defineProps<{ stage: number }>();
const setupPhotoVisible = computed(() => props.stage >= 17);
const mapVisible = computed(() => props.stage >= 1 && props.stage < 17);
</script>

<template>
  <div class="calibration-controls">
    <div class="voltage-angle-map" :class="{ 'is-in': mapVisible }">
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
    <img
      class="calibration-setup-photo"
      :class="{ 'is-visible': setupPhotoVisible }"
      :src="setupPhoto"
      alt="Extrinsic calibration rig with three cameras mounted on a turntable"
    />
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

.va-node,
.va-arrow {
  opacity: 0;
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

/* Out state: upper drops in from above, lower rises from below, arrow grows
   from its center. The .is-in class (driven by stage 1–16) restores them. */
.va-upper {
  transform: translateY(-2.5rem);
}

.va-lower {
  transform: translateY(2.5rem);
}

.va-arrow {
  transform: scale(0);
}

.voltage-angle-map.is-in .va-upper,
.voltage-angle-map.is-in .va-lower {
  opacity: 1;
  transform: translateY(0);
}

.voltage-angle-map.is-in .va-arrow {
  opacity: 1;
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

.calibration-setup-photo {
  grid-area: 1 / 1;
  width: min(100%, 420px);
  aspect-ratio: 1.05;
  object-fit: cover;
  object-position: 50% 50%;
  outline: 2px solid #06a;
  border-radius: 32px;
  box-shadow: 0 18px 48px color-mix(in srgb, currentColor 18%, transparent);
  opacity: 0;
  transform: scale(0.96);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

/* Hold the photo back by one beat so the map finishes leaving before it
   enters. The delay lives only on the entering (.is-visible) transition, so
   reversing back to the map fades the photo out immediately. */
.calibration-setup-photo.is-visible {
  opacity: 1;
  transform: scale(1);
  transition-delay: var(--transition-duration);
}
</style>
