<script setup lang="ts">
import { useId } from "vue";
import { useStage } from "stores/stage";
import DriftTranslational from "pages/11A-drift-translational.vue";
import DriftRotational from "pages/11B-drift-rotational.vue";

// Stage plan:
//   1  Left full width — foveas aligned on their origin frames.
//   2  Translational drift animates in.
//   3  Tri-marker board fades + rises into view at each origin.
//   4  Foveas snap back onto their markers.
//   5  Field incremental calibration statement fades in.
//   6  Right column enters; rotational drift structural-support diagram.
//   7  Right cross-fades to the axes demo: synchronized FoV scan, aligned.
//   8  Frame origins overlap without rotation.
//   9  Opposite warp rotation → the scan misaligns.
const stage = useStage(9, { preview: 8 });
const splitMaskId = `drift-split-mask-${useId()}`;
</script>

<template>
  <div class="drift" :data-stage="stage">
    <div class="drift-col drift-col-left">
      <DriftTranslational :stage="stage" />
      <svg
        class="split-line"
        :class="{ 'is-in': stage >= 6 }"
        viewBox="0 0 4 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <mask :id="splitMaskId" maskUnits="userSpaceOnUse">
            <line
              class="split-line-mask"
              x1="2"
              y1="0"
              x2="2"
              y2="100"
              pathLength="1"
            />
          </mask>
        </defs>
        <line
          class="split-line-stroke"
          x1="2"
          y1="0"
          x2="2"
          y2="100"
          :mask="`url(#${splitMaskId})`"
        />
      </svg>
    </div>
    <div class="drift-col drift-col-right" :class="{ 'is-in': stage >= 6 }">
      <div class="drift-col-inner">
        <DriftRotational :stage="stage" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.drift {
  height: 100%;
  display: flex;
  gap: 2rem;
  color: var(--fc-fg);
}

.drift-col {
  min-width: 0;
  display: flex;
}

.drift-col-left {
  position: relative;
  flex: 1 1 0;
}

.split-line {
  position: absolute;
  top: 0;
  right: calc(-1rem - 2px);
  bottom: 0;
  width: 4px;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.split-line-stroke {
  stroke: color-mix(in srgb, var(--fc-fg) 54%, transparent);
  stroke-width: 2;
  stroke-linecap: round;
}

.split-line-mask {
  stroke: white;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset var(--transition-duration) var(--transition-curve);
}

.split-line.is-in .split-line-mask {
  stroke-dashoffset: 0;
}

// Starts collapsed (grow 0, basis 0) so the left column spans the full width;
// growing to 1 animates the split to 50/50 as the right column enters.
.drift-col-right {
  flex: 0 1 0;
  overflow: hidden;
  transition: flex-grow var(--transition-duration) var(--transition-curve);
}

.drift-col-right.is-in {
  flex-grow: 1;
}

.drift-col-inner {
  width: 100%;
  opacity: 0;
  transform: translateX(48px);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.drift-col-right.is-in .drift-col-inner {
  opacity: 1;
  transform: none;
}
</style>
