<script setup lang="ts">
import { computed } from "vue";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { faBinoculars, faBrain } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { useStage } from "stores/stage";

// Stage 1 is transient and holds the tiles hidden for a rendered frame, so
// the auto-advance to 2 plays their enter transition (a slide mounting
// directly at the shown state would skip it); a click then locks focus at 3.
const stage = useStage(3, { preview: 3 }).transient([1]);

const showTiles = computed(() => stage.value >= 2);
const focusFirst = computed(() => stage.value >= 3);

config.autoAddCss = false;
</script>

<template>
  <section class="challenges" :data-stage="stage">
    <article class="tile from-left" :class="{ show: showTiles }">
      <span class="glyph"><FontAwesomeIcon :icon="faBinoculars" rotation="180" /></span>
      <p class="tag">Hardware</p>
      <h3>
        Building a <strong>stereo</strong> camera system capable of
        <strong>realtime</strong> <strong>foveated</strong> sensing
      </h3>
      <!-- Autofocus reticle: the slide "foveates" on our contribution. -->
      <div class="reticle" :class="{ show: focusFirst }" aria-hidden="true">
        <i /><i /><i /><i />
        <span class="reticle-label">Our Work</span>
      </div>
    </article>

    <div class="divider" />

    <article
      class="tile from-right"
      :class="{ show: showTiles, periphery: focusFirst }"
    >
      <span class="glyph"><FontAwesomeIcon :icon="faBrain" /></span>
      <p class="tag">Intelligence</p>
      <h3>
        Deciding how to distribute foveal pixels to the
        <strong>most valuable targets</strong> in <strong>realtime</strong>
      </h3>
    </article>
  </section>
</template>

<style scoped>
.challenges {
  height: calc(100% - 5.4rem);
  margin-top: 1rem;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  column-gap: 1.5rem;
}

.divider {
  width: 1px;
  height: 68%;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--divider) 22%,
    var(--divider) 78%,
    transparent
  );
}

.tile {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0.9rem;
  padding: 2.2rem 1.4rem;
  text-align: center;
  opacity: 0;
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve),
    filter var(--transition-duration) var(--transition-curve);
}

.tile.from-left {
  transform: translateX(-40px);
}

.tile.from-right {
  transform: translateX(40px);
}

.tile.show {
  opacity: 1;
  transform: translateX(0);
}

/* Once the reticle locks on, the other challenge falls out of the fovea. */
.tile.show.periphery {
  opacity: 0.4;
  filter: blur(2px) saturate(0.6);
}

.glyph {
  display: grid;
  place-items: center;
  width: 4.6rem;
  height: 4.6rem;
  border-radius: 50%;
  background: var(--blue-soft);
  color: var(--blue-2);
  font-size: 2.1rem;
}

.tag {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-3);
}

.tile h3 {
  margin: 0;
  max-width: 15em;
  font-size: 1.65rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--text-1);
  text-wrap: balance;
}

.tile h3 strong {
  font-weight: 700;
  color: var(--blue-2);
}

/* Four viewfinder corner brackets, like a camera's composition frame.
   Princeton orange (Pantone 158) — the closest thing to "Princeton red". */
.reticle {
  --reticle-color: #e77500;
  position: absolute;
  inset: 0.4rem 0;
  opacity: 0;
  transform: scale(1.08);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
  pointer-events: none;
}

.reticle.show {
  opacity: 1;
  transform: scale(1);
}

.reticle i {
  position: absolute;
  width: 1.3rem;
  height: 1.3rem;
  border: 3px solid var(--reticle-color);
}

.reticle i:nth-child(1) {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: 0.45rem;
}

.reticle i:nth-child(2) {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 0.45rem;
}

.reticle i:nth-child(3) {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 0.45rem;
}

.reticle i:nth-child(4) {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: 0.45rem;
}

.reticle-label {
  position: absolute;
  top: -0.7em;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--reticle-color);
}
</style>
