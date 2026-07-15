<script setup lang="ts">
import RegressionChart from "components/RegressionChart.vue";
import { regressionPanels } from "assets/calibration/extrinsic/regression-data";
import RectificationFigure from "assets/calibration/rectification/rectification-figure.svg";
</script>

<template>
  <div class="reproj-slide">
    <!-- Left 1/3: reprojection-error regression, stacked into two rows. -->
    <aside class="reproj-charts" aria-label="Reprojection error regression">
      <div class="half">
        <h3 class="fig-title">Voltage Reprojection Error</h3>
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
        <h3 class="fig-title">Angular Reprojection Error</h3>
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
    </aside>

    <!-- Right 2/3: foveated-image rectification results (raw vs. rectified
         anaglyphs), from the website's distortion-calib figure. -->
    <section class="reproj-rectification" aria-label="Rectification results">
      <h3 class="fig-title">Foveated Image Rectification</h3>
      <RectificationFigure class="rectification-figure" />
    </section>
  </div>
</template>

<style scoped>
.reproj-slide {
  position: absolute;
  /* .slidev-layout is position:static, so this box is laid out against the
     unpadded .slidev-page. Match the global slide padding (styles/layout.css:
     40px sides, 32px bottom) so the left column lines up with the title. */
  top: 100px;
  left: 40px;
  right: 40px;
  bottom: 32px;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3.5rem;
}

/* Left column: the two error halves stacked as rows, centered vertically. */
.reproj-charts {
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.35rem;
  color: var(--fc-fg);
}

.half {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

/* Figure title, styled like the metadata caption on slide 6
   (pages/06-preview-foveal-tracking.vue). */
.fig-title {
  margin: 0;
  text-align: center;
  font-family: "Times New Roman", Times, serif;
  font-size: 0.5em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-variant-numeric: lining-nums tabular-nums;
  color: color-mix(in srgb, currentColor 88%, transparent);
}

.half-charts {
  display: flex;
  gap: 0.5rem;
  min-height: 0;
}

.half-charts > * {
  flex: 1 1 0;
  min-width: 0;
}

/* Horizontal dashed rule between the two rows. Gradient instead of a border so
   the dash/gap lengths stay controllable. */
.divider {
  flex: 0 0 2px;
  align-self: stretch;
  background: repeating-linear-gradient(
    to right,
    currentColor 0 8px,
    transparent 8px 16px
  );
  opacity: 0.45;
  margin: 0.15rem 0;
}

.reproj-rectification {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

.rectification-figure {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  min-height: 0;
}
</style>
