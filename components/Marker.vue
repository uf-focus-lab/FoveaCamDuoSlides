<script setup lang="ts">
import { computed } from "vue";
import { Polygon, Vec2 } from "geometry-core";

type DictionaryName = "4X4_50" | "4x4_50";
type MarkerRow = readonly string[];
type MarkerPattern = readonly MarkerRow[];

const MARKERS_4X4_50: MarkerPattern = [
  ["1011", "0101", "0011", "0010"],
  ["0000", "1111", "1001", "1010"],
  ["0011", "0011", "0010", "1101"],
  ["1001", "1001", "0100", "0110"],
  ["0101", "0100", "1001", "1110"],
  ["0111", "1001", "1100", "1101"],
  ["1001", "1110", "0010", "1110"],
  ["1100", "0100", "1111", "0010"],
  ["1111", "1110", "1101", "1010"],
  ["1100", "1111", "0101", "0110"],
  ["1111", "1001", "1001", "0001"],
  ["0001", "0001", "1010", "0111"],
  ["0000", "1110", "1011", "0111"],
  ["0010", "1010", "0000", "1111"],
  ["0010", "0100", "1011", "0001"],
  ["0010", "0110", "0011", "1110"],
  ["0100", "0110", "0110", "0101"],
  ["0110", "0110", "0000", "0000"],
  ["0110", "1100", "0101", "1110"],
  ["0111", "0110", "1010", "1111"],
  ["1000", "0110", "1000", "1011"],
  ["1011", "0000", "0010", "1011"],
  ["1100", "1100", "1101", "0101"],
  ["1101", "1101", "1000", "0010"],
  ["1111", "1110", "0100", "0111"],
  ["1001", "0100", "0111", "0001"],
  ["1010", "1100", "1110", "0100"],
  ["1010", "0101", "0101", "0100"],
  ["0010", "0001", "0010", "0011"],
  ["0011", "0100", "0110", "1111"],
  ["0100", "0100", "0001", "0101"],
  ["0101", "0111", "1011", "0010"],
  ["1001", "1110", "1100", "1111"],
  ["1111", "0000", "1100", "1011"],
  ["0000", "1000", "1010", "1110"],
  ["0000", "1001", "0010", "1001"],
  ["0001", "1000", "0111", "0101"],
  ["0000", "0100", "1111", "1111"],
  ["0000", "1101", "1111", "0110"],
  ["0001", "1100", "0101", "1010"],
  ["0001", "0111", "0001", "1000"],
  ["0010", "1010", "0010", "1000"],
  ["0011", "0010", "1000", "1100"],
  ["0011", "1000", "1011", "0010"],
  ["0010", "0100", "1110", "1000"],
  ["0010", "1110", "1110", "1011"],
  ["0010", "1101", "0011", "1111"],
  ["0100", "1011", "0110", "0100"],
  ["0101", "0000", "0010", "1110"],
  ["0101", "0000", "0001", "0011"],
] as const;

const props = defineProps<{
  id: number;
  cx?: number;
  cy?: number;
  size?: number;
  outline?: number;
  dictionary?: DictionaryName;
}>();

const pattern = computed(() => {
  if (props.dictionary && props.dictionary.toUpperCase() !== "4X4_50") {
    throw new RangeError("Marker.vue only supports the 4X4_50 dictionary.");
  }

  const rows = MARKERS_4X4_50[props.id];
  if (!rows) {
    throw new RangeError(
      `4X4_50 marker id must be in [0, 49], got ${props.id}.`,
    );
  }

  return rows;
});

const size = computed(() => props.size ?? 60);
const gridSize = computed(() => size.value / (pattern.value.length + 2));
const outline = computed(() => props.outline ?? gridSize.value);
const radius = computed(() => gridSize.value);
const whitePaths = computed(() => {
  const d = gridSize.value;
  const origin = new Vec2([d - size.value / 2, d - size.value / 2]);
  const cells = pattern.value.map((row: MarkerRow) =>
    Array.from(row, (cell) => cell === "1"),
  );
  return Polygon.fromCells(cells).map((poly) =>
    poly.scale(d).translate(origin),
  );
});

function translate(x: number, y: number) {
  return `translate(${x} ${y})`;
}
</script>

<template>
  <g :transform="translate(cx ?? 0, cy ?? 0)">
    <rect
      v-if="outline"
      :x="-(size / 2) - outline"
      :y="-(size / 2) - outline"
      :width="size + 2 * outline"
      :height="size + 2 * outline"
      :rx="radius"
      fill="white"
    />
    <rect
      :x="-(size / 2)"
      :y="-(size / 2)"
      :width="size"
      :height="size"
      fill="black"
    />
    <path
      v-for="(poly, i) in whitePaths"
      :key="i"
      :d="poly.d(3)"
      fill="white"
    />
  </g>
</template>
