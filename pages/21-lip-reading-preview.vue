<script setup lang="ts">
import LipReadingPreview from "components/LipReadingPreview.vue";
// Bounding-box tracks recovered from the fovea crop positions on the wide
// ("center") video timeline; regenerate from the 0002-{left,right}.csv
// tracking exports if the source clips change.
import roiTracks from "assets/liptracking/roi-tracks.json";
</script>

<template>
  <div class="lip-reading-slide">
    <LipReadingPreview :roi-tracks="roiTracks" />
  </div>
</template>

<style scoped>
.lip-reading-slide {
  width: 100%;
  height: 100%;
  padding-top: 0.35rem;
}
</style>
