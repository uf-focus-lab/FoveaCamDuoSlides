<script setup lang="ts">
import { useIsSlideActive } from "@slidev/client";
import { useStage } from "stores/stage";
import Simulation from "../crypsis-simulation/lib/simulation";
import Dialog from "../crypsis-simulation/components/dialog";
import CrypsisEquations from "./07A-crypsis-equations.vue";
import CrypsisSimulationFrame from "./07B-crypsis-simulation-frame.vue";
import CrypsisControls from "./07D-crypsis-controls.vue";

const isActive = useIsSlideActive();
const stage = useStage(4, { preview: -1 });

// One simulation, shared by the world canvas (right) and the controls (left).
// Registering it as a dialog provider populates the <Dialogs> list in the
// controls overlay; Dialog.provide auto-revokes on unmount (onScopeDispose).
const sim = new Simulation("mission");
Dialog.provide(sim);
</script>

<template>
  <section class="crypsis-slide" :data-active="isActive">
    <CrypsisEquations :stage="stage" />
    <CrypsisSimulationFrame :sim="sim" :stage="stage" />
    <CrypsisControls />
  </section>
</template>

<style scoped>
.crypsis-slide {
  width: 100%;
  height: calc(100% - 5.6rem);
  margin-top: 1.2rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0;
  align-items: stretch;
}
</style>
