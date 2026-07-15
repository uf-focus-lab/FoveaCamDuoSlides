<script setup lang="ts">
import LipReadingPreview from "components/LipReadingPreview.vue";
// Bounding-box tracks recovered from the fovea crop positions on the wide
// ("center") video timeline; regenerate from the 0002-{left,right}.csv
// tracking exports if the source clips change.
import roiTracks from "assets/liptracking/roi-tracks.json";

// The cropped-bbox clips lag the wide ("center") video by a constant amount
// (FFT template matching: left 1 frame, right 9 frames), so shift their clip
// windows back to keep the stage-4 crossfade from the frozen wide frame (t=22)
// seamless.
const clipWindows = {
  zoomLeft: { start: 22 - 0.033 },
  zoomRight: { start: 22 - 0.3 },
};
</script>

<template>
  <div class="lip-reading-slide">
    <LipReadingPreview :roi-tracks="roiTracks" :clip-windows="clipWindows" />
  </div>
</template>

<style scoped>
.lip-reading-slide {
  width: 100%;
  height: 100%;
  padding-top: 4px;
}
</style>
