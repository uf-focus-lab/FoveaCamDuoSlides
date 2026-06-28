<script setup lang="ts">
import { useStage } from "stores/stage";
import CalibrationControls from "pages/07A-calibration-controls.vue";
import CalibrationDiagram from "pages/07B-calibration-diagram.vue";

const stage = useStage(17, { preview: 13 });
stage.transient([3, 4, 6, 7, 8, 11, 12, 14, 15]);
</script>

<template>
  <div class="calibration-setup" :data-stage="stage">
    <CalibrationControls :stage="stage" />
    <CalibrationDiagram :stage="stage" />
  </div>
</template>

<style scoped lang="scss">
.calibration-setup {
  height: calc(100% - 78px);
  display: grid;
  grid-template-columns: 4fr 6fr;
  gap: 2rem;
  color: var(--fc-fg);
}
</style>
