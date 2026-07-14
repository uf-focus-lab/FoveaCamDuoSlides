<script setup lang="ts">
import RegressionChart from "components/RegressionChart.vue";
import { regressionPanels } from "assets/calibration/extrinsic/regression-data";
</script>

<template>
  <div class="extrinsic-regression">
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
    <div class="legend">
      <span class="item">
        <svg class="marker" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="13" class="ring" />
        </svg>
        Measurement (Ground Truth)
      </span>
      <span class="item">
        <svg class="marker" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="9" class="dot-volt" />
        </svg>
        Voltage Reprojection
      </span>
      <span class="item">
        <svg class="marker" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="9" class="dot-angle" />
        </svg>
        Angle Reprojection
      </span>
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
.legend {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  font-size: 1rem;
}
.legend .item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.legend .marker {
  width: 1.1em;
  height: 1.1em;
}
.legend .ring {
  fill: none;
  stroke: currentColor;
  stroke-width: 4;
}
.legend .dot-volt {
  fill: var(--blue-2);
}
.legend .dot-angle {
  fill: var(--red-2);
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
.half-title {
  margin: 0;
  text-align: center;
  font-size: 1.2rem;
  font-weight: 600;
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
</style>
