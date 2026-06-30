<script setup lang="ts">
import { computed, useId } from "vue";

type Point = { x: number; y: number };
type Line = { a: Point; b: Point };

const props = withDefaults(
  defineProps<{
    lines: Line[];
    active?: boolean;
    draw?: boolean;
    origin?: "start" | "center";
  }>(),
  {
    active: true,
    draw: true,
    origin: "start",
  },
);

const clipPrefix = `grid-lines-${useId().replace(/[^a-zA-Z0-9_-]/g, "-")}`;
const CLIP_PAD = 8;
const clips = computed(() =>
  props.lines.map((line, i) => {
    const dx = line.b.x - line.a.x;
    const dy = line.b.y - line.a.y;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const origin =
      props.origin === "center"
        ? "center center"
        : horizontal
          ? `${dx >= 0 ? "left" : "right"} center`
          : `center ${dy >= 0 ? "top" : "bottom"}`;

    if (horizontal) {
      return {
        id: `${clipPrefix}-${i}`,
        axis: "clip-x",
        origin,
        x: Math.min(line.a.x, line.b.x),
        y: line.a.y - CLIP_PAD,
        width: Math.max(Math.abs(dx), 0.001),
        height: CLIP_PAD * 2,
      };
    }

    return {
      id: `${clipPrefix}-${i}`,
      axis: "clip-y",
      origin,
      x: line.a.x - CLIP_PAD,
      y: Math.min(line.a.y, line.b.y),
      width: CLIP_PAD * 2,
      height: Math.max(Math.abs(dy), 0.001),
    };
  }),
);
</script>

<template>
  <g
    class="grid-lines"
    :class="{ active, draw }"
  >
    <defs v-if="draw">
      <clipPath
        v-for="clip in clips"
        :id="clip.id"
        :key="clip.id"
        clipPathUnits="userSpaceOnUse"
      >
        <rect
          class="draw-clip"
          :class="clip.axis"
          :x="clip.x"
          :y="clip.y"
          :width="clip.width"
          :height="clip.height"
          :style="{ transformOrigin: clip.origin }"
        />
      </clipPath>
    </defs>
    <line
      v-for="(line, i) in lines"
      :key="i"
      class="grid-line"
      :x1="line.a.x"
      :y1="line.a.y"
      :x2="line.b.x"
      :y2="line.b.y"
      :clip-path="props.draw ? `url(#${clipPrefix}-${i})` : undefined"
    />
  </g>
</template>

<style scoped>
.grid-line {
  stroke: color-mix(in srgb, currentColor 62%, var(--fc-bg));
  stroke-width: 0.9;
  stroke-dasharray: 4 4;
  opacity: 0;
  transition:
    x1 var(--transition-duration) var(--transition-curve),
    y1 var(--transition-duration) var(--transition-curve),
    x2 var(--transition-duration) var(--transition-curve),
    y2 var(--transition-duration) var(--transition-curve);
}

.draw .grid-line {
  opacity: 1;
}

.active:not(.draw) .grid-line {
  opacity: 1;
}

.draw-clip {
  transform-box: fill-box;
  fill: white;
  transition: transform var(--transition-duration) var(--transition-curve);
}

.clip-x {
  transform: scaleX(0);
}

.clip-y {
  transform: scaleY(0);
}

.active .draw-clip {
  transform: scale(1);
}
</style>
