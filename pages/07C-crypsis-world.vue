<script setup lang="ts">
// Minimal shim over the CrypsisSimulation submodule: just the world canvas and
// the controls, without the standalone app shell (header, dialogs, popups). The
// pieces are imported by RELATIVE path — bare `lib/`/`src/` specifiers only
// resolve for importers inside the submodule (see scripts/crypsis-simulation.ts),
// so a deck file must spell out the path.
import { ref } from "vue";
import Simulation from "../crypsis-simulation/lib/simulation";
import SimulationPanel from "../crypsis-simulation/src/simulation.panel.vue";
import SimulationDialog from "../crypsis-simulation/src/simulation.dialog.vue";

// `Simulation` fetches its map from `dataUrl('mission.svg')` → `/data/mission.svg`,
// served from the deck's public/data symlink into the submodule.
const sim = new Simulation("mission");

// Controls start collapsed behind the fold button (top-left, invisible until
// hovered); toggling reveals the standoff/range controls overlay.
const controlsOpen = ref(false);
</script>

<template>
  <div class="crypsis-world">
    <div class="world-canvas">
      <SimulationPanel :d="sim" />
    </div>

    <div class="controls" :class="{ open: controlsOpen }">
      <button
        class="fold-toggle"
        type="button"
        :aria-expanded="controlsOpen"
        :title="controlsOpen ? 'Hide controls' : 'Show controls'"
        @click="controlsOpen = !controlsOpen"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M9 5l7 7-7 7"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <div v-show="controlsOpen" class="controls-body invisible-scrollbar">
        <SimulationDialog :d="sim" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.crypsis-world {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.world-canvas {
  position: absolute;
  inset: 0;
}

/* Controls overlay anchored top-left. The wrapper ignores pointer events so the
   world canvas stays interactive; only the button and the open panel capture. */
.controls {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  pointer-events: none;
}

/* Fold/unfold button: invisible until hovered (or while the panel is open). */
.fold-toggle {
  pointer-events: auto;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin: 0.45rem;
  padding: 0;
  border: none;
  border-radius: 0.45rem;
  background: color-mix(in srgb, var(--fc-bg, #0a1420) 72%, transparent);
  color: var(--color, var(--fc-fg, #fff));
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.2s ease,
    background-color 0.2s ease;
}
.fold-toggle:hover,
.fold-toggle:focus-visible,
.controls.open .fold-toggle {
  opacity: 1;
}

.fold-toggle svg {
  transition: transform 0.2s ease;
}
.controls.open .fold-toggle svg {
  transform: rotate(90deg);
}

.controls-body {
  pointer-events: auto;
  margin: 0 0.45rem 0.45rem;
  max-height: calc(100% - 3rem);
  overflow: auto;
  padding: 0.6rem 0.8rem;
  border-radius: 0.6rem;
  border: 1px solid color-mix(in srgb, var(--color, #fff) 14%, transparent);
  background: color-mix(in srgb, var(--fc-bg, #0a1420) 90%, black);
  box-shadow: 0 10px 34px rgb(0 0 0 / 0.4);
}
</style>
