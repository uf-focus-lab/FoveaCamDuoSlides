<script setup lang="ts">
import CameraView from "components/CameraView.vue";

type Point2d = { x: number; y: number };
type Homography = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

const props = withDefaults(
  defineProps<{
    points: Point2d[];
    h: Homography;
    label: string;
    color?: string;
    fill?: string;
    muted?: boolean;
    distorted?: boolean;
    offset?: Point2d;
    frame?: { width: number; height: number };
  }>(),
  {
    color: undefined,
    fill: undefined,
    muted: false,
    distorted: false,
    offset: () => ({ x: 0, y: 0 }),
    frame: () => ({ width: 1440, height: 1080 }),
  },
);

</script>

<template>
  <CameraView v-bind="props" v-slot="slotProps">
    <slot v-bind="slotProps" />
  </CameraView>
</template>
