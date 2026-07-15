<script setup lang="ts">
// World canvas only. The controls live separately (pages/07D) so they can sit on
// the opposite half of the slide. Submodule files are imported by RELATIVE path
// (bare `lib/`/`src/` only resolve for importers inside the submodule).
import type Simulation from "../crypsis-simulation/lib/simulation";
import SimulationPanel from "../crypsis-simulation/src/simulation.panel.vue";

defineProps<{ sim: Simulation }>();
</script>

<template>
  <div class="crypsis-world">
    <SimulationPanel :d="sim" />
  </div>
</template>

<style scoped>
.crypsis-world {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
</style>
