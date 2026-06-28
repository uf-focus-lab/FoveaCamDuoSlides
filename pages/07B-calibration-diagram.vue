<script setup lang="ts">
import { computed, toRef } from "vue";
import CameraModel from "components/CameraModel";
import CameraRay from "components/CameraRay.vue";
import DimAnnotation from "components/DimAnnotation.vue";
import Marker from "components/Marker.vue";

const MARKER_Y = 150;
const CENTER_MARKER_ENTRY_DY = -90;
const CAMERA_Y = 650;
const D_ANNOTATION_OFFSET = 340;
const D_ANNOTATION_ENTRY_OFFSET = 470;
const MARKER_SWEEP = 150;
const RIG_PIVOT = { x: 600, y: 640 };

const props = defineProps<{ stage: number }>();
const stage = toRef(props, "stage");

const cameras = [
  {
    id: "left",
    label: "L",
    markerId: 1,
    color: "var(--camera-left)",
    x: 390,
    dy: 50,
  },
  {
    id: "center",
    label: "C",
    markerId: 0,
    color: "var(--camera-center)",
    x: 600,
    dy: 30,
  },
  {
    id: "right",
    label: "R",
    markerId: 2,
    color: "var(--camera-right)",
    x: 810,
    dy: 50,
  },
] as const;

type Camera = (typeof cameras)[number];
type Point = { x: number; y: number };

const markerOffset = computed(() => {
  if (stage.value === 3) return { x: -MARKER_SWEEP, y: 0 };
  if (stage.value === 4) return { x: MARKER_SWEEP, y: 0 };
  if (stage.value === 7) return { x: 0, y: -MARKER_SWEEP };
  if (stage.value === 8) return { x: 0, y: MARKER_SWEEP };
  return { x: 0, y: 0 };
});
const markerPlaneOffsetY = computed(() => {
  if (stage.value === 11) return -MARKER_SWEEP;
  if (stage.value === 12) return MARKER_SWEEP;
  return 0;
});
const markerPlaneY = computed(() => MARKER_Y + markerPlaneOffsetY.value);
const centerMarker = computed(() => ({
  x: 600 + markerOffset.value.x,
  y: markerPlaneY.value + markerOffset.value.y,
}));
const centerMarkerVisible = computed(() => stage.value >= 2);
const centerMarkerDisplay = computed(() => ({
  x: centerMarker.value.x,
  y: centerMarkerVisible.value
    ? centerMarker.value.y
    : centerMarker.value.y + CENTER_MARKER_ENTRY_DY,
}));
const depthAnnotationVisible = computed(() => stage.value >= 6);
const depthAnnotationOffset = computed(() =>
  depthAnnotationVisible.value ? D_ANNOTATION_OFFSET : D_ANNOTATION_ENTRY_OFFSET,
);
const sideMarkersVisible = computed(() => stage.value >= 10);
const leftSpacing = computed(() => ({
  a: sideMarkersVisible.value
    ? [390, markerPlaneY.value]
    : [600, markerPlaneY.value],
  b: [600, markerPlaneY.value],
}));
const rightSpacing = computed(() => ({
  a: [600, markerPlaneY.value],
  b: sideMarkersVisible.value
    ? [810, markerPlaneY.value]
    : [600, markerPlaneY.value],
}));
const rigAngle = computed(() => {
  if (stage.value === 14) return -8;
  if (stage.value === 15) return 8;
  return 0;
});
const rigStyle = computed(() => ({
  transform: `rotate(${rigAngle.value}deg)`,
}));

function rotatePoint(point: Point, angle: number, pivot: Point): Point {
  const theta = (angle * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  return {
    x: pivot.x + dx * cos - dy * sin,
    y: pivot.y + dx * sin + dy * cos,
  };
}

function angleToTarget(origin: Point, target: Point) {
  return (Math.atan2(target.x - origin.x, origin.y - target.y) * 180) / Math.PI;
}

function markerTarget(camera: Camera): Point {
  if (camera.id !== "center" && sideMarkersVisible.value) {
    return { x: camera.x, y: markerPlaneY.value };
  }
  return centerMarker.value;
}

function markerStyle(camera: Camera) {
  const target =
    camera.id === "center"
      ? centerMarker.value
      : sideMarkersVisible.value
        ? { x: camera.x, y: markerPlaneY.value }
        : centerMarker.value;
  const hiddenTarget =
    camera.id === "center" ? centerMarkerDisplay.value : target;
  const opacity =
    (camera.id === "center" && centerMarkerVisible.value) ||
    (camera.id !== "center" && sideMarkersVisible.value)
      ? 1
      : 0;
  const point = opacity ? target : hiddenTarget;

  return {
    color: camera.color,
    opacity,
    transform: `translate(${point.x}px, ${point.y}px)`,
  };
}

function cameraWorld(camera: Camera) {
  return rotatePoint({ x: camera.x, y: CAMERA_Y }, rigAngle.value, RIG_PIVOT);
}

function rayStyle(camera: Camera) {
  if (stage.value <= 1 || camera.id === "center") {
    return { transform: "rotate(0deg)" };
  }

  const target = markerTarget(camera);
  const angle = angleToTarget(cameraWorld(camera), target) - rigAngle.value;
  return { transform: `rotate(${angle}deg)` };
}

const centerCameraWorld = computed(() => cameraWorld(cameras[1]));
const centerLinkStyle = computed(() => ({
  opacity: centerMarkerVisible.value ? 0.66 : 0,
}));
const centerDepthStyle = computed(() => ({
  opacity: depthAnnotationVisible.value ? 1 : 0,
}));
</script>

<template>
  <svg
    class="calibration-setup-figure"
    viewBox="0 0 1200 760"
    overflow="visible"
    role="img"
    aria-label="Extrinsic calibration setup with three cameras, ArUco markers, and angular error geometry"
  >
    <g class="calibration-marker-plane">
      <line
        x1="320"
        :y1="MARKER_Y"
        x2="880"
        :y2="MARKER_Y"
        :style="{
          opacity: sideMarkersVisible ? 0.28 : 0,
          transform: `translateY(${markerPlaneOffsetY}px)`,
        }"
      />
    </g>

    <g class="calibration-dimensions">
      <DimAnnotation
        class="calibration-depth-dim"
        :a="[centerMarkerDisplay.x, centerMarkerDisplay.y]"
        :b="[centerCameraWorld.x, centerCameraWorld.y]"
        :dir="[0, -1]"
        :offset="depthAnnotationOffset"
        label="D"
        :label-gap="42"
        :style="centerDepthStyle"
      />
      <g
        class="calibration-spacing-dims"
        :style="{ opacity: sideMarkersVisible ? 1 : 0 }"
      >
        <DimAnnotation
          :a="leftSpacing.a"
          :b="leftSpacing.b"
          :dir="[1, 0]"
          :offset="-100"
          label="d"
          :label-gap="24"
        />
        <DimAnnotation
          :a="rightSpacing.a"
          :b="rightSpacing.b"
          :dir="[1, 0]"
          :offset="-100"
          label="d"
          :label-gap="24"
        />
      </g>
    </g>

    <DimAnnotation
      class="calibration-center-link"
      :a="[centerCameraWorld.x, centerCameraWorld.y]"
      :b="[centerMarkerDisplay.x, centerMarkerDisplay.y]"
      :style="centerLinkStyle"
    />

    <g class="calibration-rig" :style="rigStyle">
      <CameraModel
        v-for="camera in cameras"
        :key="camera.id"
        :transform="`translate(${camera.x}, ${CAMERA_Y})`"
        :fill="camera.color"
        :cube="68"
        :lens="camera.id === 'center' ? 96 : 150"
        :label="camera.label"
        :dy="camera.dy"
      >
        <g class="calibration-aimed-ray" :style="rayStyle(camera)">
          <CameraRay
            class="calibration-ray"
            :style="{ opacity: camera.id === 'center' ? 0.4 : 0.8 }"
            :fov="camera.id === 'center' ? 60 : 8"
            :h="1040"
            :boundaries="camera.id === 'center'"
            stroke="currentColor"
            stroke-width="1.5"
          />
        </g>
      </CameraModel>
      <line
        class="calibration-baseline"
        x1="390"
        y1="640"
        x2="810"
        y2="640"
      />
      <circle
        v-for="camera in cameras"
        :key="`mount-${camera.id}`"
        class="calibration-mount"
        :cx="camera.x"
        cy="640"
        r="8"
      />
    </g>

    <g class="calibration-sweep" :opacity="stage >= 14 ? 1 : 0">
      <path d="M486 676 A170 170 0 0 1 714 676" />
      <path d="M712 676 l-18 -7 l5 19" />
    </g>

    <g class="calibration-markers">
      <g
        v-for="camera in cameras"
        :key="`marker-${camera.id}`"
        class="calibration-marker"
        :style="markerStyle(camera)"
      >
        <Marker :id="camera.markerId" :size="84" />
      </g>
    </g>
  </svg>
</template>

<style scoped lang="scss">
.calibration-setup-figure {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  color: currentColor;
}

.calibration-marker-plane line,
.calibration-baseline {
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.calibration-marker-plane line {
  stroke-dasharray: 8 10;
  transform-box: view-box;
  transform-origin: 0 0;
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.calibration-dimensions {
  color: currentColor;
  opacity: 0.72;
  --dim-weight: 2.4;
  --dim-font: 32px;
}

.calibration-spacing-dims {
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.calibration-depth-dim {
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.calibration-center-link {
  --dim-weight: 2.6;
  --dim-dash: 8 10;
  --dim-linecap: round;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.calibration-marker {
  transform-box: view-box;
  transform-origin: 0 0;
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.calibration-rig {
  transform-box: view-box;
  transform-origin: 600px 640px;
  transition: transform var(--transition-duration) var(--transition-curve);
}

.calibration-aimed-ray {
  transform-box: view-box;
  transform-origin: 0 0;
  transition: transform var(--transition-duration) var(--transition-curve);
}

.calibration-platform {
  fill: color-mix(in srgb, currentColor 10%, var(--bg));
  stroke: currentColor;
  stroke-width: 2;
  opacity: 0.86;
}

.calibration-baseline {
  stroke-width: 4;
  opacity: 0.58;
}

.calibration-mount {
  fill: currentColor;
  stroke: var(--bg);
  stroke-width: 3;
}

.calibration-sweep {
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.calibration-sweep path {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.calibration-sweep path:first-child {
  opacity: 0.72;
}
</style>
