<script setup lang="ts">
import { useIsSlideActive } from "@slidev/client";
import { useStage } from "stores/stage";
import CrypsisEquations from "./07A-crypsis-equations.vue";
import CrypsisSimulationFrame from "./07B-crypsis-simulation-frame.vue";

const isActive = useIsSlideActive();
const stage = useStage(4, { preview: -1 });
</script>

<template>
  <section class="crypsis-slide" :data-active="isActive">
    <CrypsisEquations :stage="stage" />
    <CrypsisSimulationFrame :stage="stage" />
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
