<script setup lang="ts">
import RegressionChart from "components/RegressionChart.vue";
import { regressionPanels } from "assets/calibration/extrinsic/regression-data";

// `stacked` lays the two error halves out as two rows (for a narrow column)
// instead of side by side; used when embedded in the reprojection-error slide.
defineProps<{ stacked?: boolean }>();
</script>

<template>
  <div class="extrinsic-regression" :class="{ stacked }">
    <div class="charts">
      <div class="half">
        <h3 class="half-title">Voltage Reprojection Error</h3>
        <div class="half-charts">
          <RegressionChart
            :panel="regressionPanels[0]"
            variant="volt"
            :y-axis="true"
          />
          <RegressionChart
            :panel="regressionPanels[1]"
            variant="volt"
            :y-axis="false"
          />
        </div>
      </div>
      <div class="divider" />
      <div class="half">
        <h3 class="half-title">Angular Reprojection Error</h3>
        <div class="half-charts">
          <RegressionChart
            :panel="regressionPanels[2]"
            variant="angle"
            :y-axis="true"
          />
          <RegressionChart
            :panel="regressionPanels[3]"
            variant="angle"
            :y-axis="false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.extrinsic-regression {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  height: calc(100% - 78px);
  color: var(--fc-fg);
}
.charts {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
}
.half {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
/* Figure title, styled like the metadata caption on slide 6
   (pages/06-preview-foveal-tracking.vue). */
.half-title {
  margin: 0;
  text-align: center;
  font-family: "Times New Roman", Times, serif;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-variant-numeric: lining-nums tabular-nums;
  color: color-mix(in srgb, currentColor 88%, transparent);
}
.half-charts {
  display: flex;
  gap: 0.5rem;
}
.half-charts > * {
  flex: 1 1 0;
  min-width: 0;
}
.charts .divider {
  flex: 0 0 2px;
  align-self: stretch;
  /* Gradient instead of a dashed border so the dash/gap lengths are controllable. */
  background: repeating-linear-gradient(
    to bottom,
    currentColor 0 8px,
    transparent 8px 16px
  );
  opacity: 0.45;
  margin: 0 0.5rem;
}

/* Stacked (narrow-column) layout: the two halves become two rows. */
.extrinsic-regression.stacked {
  height: 100%;
}

.extrinsic-regression.stacked .charts {
  flex-direction: column;
}

.extrinsic-regression.stacked .charts .divider {
  /* Now a horizontal rule between the two rows. */
  background: repeating-linear-gradient(
    to right,
    currentColor 0 8px,
    transparent 8px 16px
  );
  margin: 0.5rem 0;
}
</style>
