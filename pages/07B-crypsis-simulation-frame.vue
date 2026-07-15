<script setup lang="ts">
// Right-half world canvas. The controls live separately (pages/07D) on the left
// half so they never obscure the simulation. See AGENTS.md → "Crypsis Simulation".
import type Simulation from "../crypsis-simulation/lib/simulation";
import CrypsisWorld from "./07C-crypsis-world.vue";

defineProps<{
  sim: Simulation;
  stage: number;
}>();
</script>

<template>
  <div class="frame-shell">
    <div class="crypsis-app" :class="{ 'grow-feasible-region': stage >= 4 }">
      <CrypsisWorld :sim="sim" />
    </div>
  </div>
</template>

<style scoped>
.frame-shell {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 50%;
  border: none;
  overflow: hidden;
  font-size: 0.5em;
}

.crypsis-app {
  --color: var(--fc-fg, #fff);
  position: absolute;
  inset: 0;
  overflow: hidden;
  color: var(--color);
  background: var(--fc-bg, #0a1420);
}

/* Stage-driven feasible-region reveal. The world canvas clips the feasible
   regions with an SVG circle centered on the entity bbox; growing its radius
   from 0 to `--feasible-reveal-r` (supplied by the canvas) reveals them radially
   from that center. Hidden (r:0) until the deck sets `.grow-feasible-region`. */
.crypsis-app :deep(circle.feasible-reveal) {
  r: 0;
  transition: r 900ms var(--transition-curve, ease-in-out);
}
.crypsis-app.grow-feasible-region :deep(circle.feasible-reveal) {
  r: var(--feasible-reveal-r, 0);
}
</style>
