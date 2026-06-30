<script setup lang="ts">
import { computed, useId } from "vue";

// `number[]` (not a tuple) so template array literals assign without friction.
type Pt = number[];

// A linear dimension between anchors `a` and `b`: an arrowed line with optional
// witness bars at the arrowheads, running parallel to `dir`, shifted `offset` units
// perpendicular from the a–b midpoint. Any anchor whose arrowhead no longer
// sits on it gets a dashed helper line. Arrow + label use `currentColor` unless
// `fill` overrides; `--dim-weight` / `--dim-font` (CSS vars) tune the sizes.
const props = withDefaults(
  defineProps<{
    a: Pt;
    b: Pt;
    dir?: Pt; // line direction; defaults to a − b
    offset?: number; // signed perpendicular shift of the line
    label?: string;
    fill?: string; // colour override for arrow + label
    labelGap?: number; // label distance beyond the line
    showBar?: boolean; // whether arrowheads include the witness bar
  }>(),
  { offset: 0, labelGap: 36, showBar: true },
);

const id = `dim-arrow-${useId()}`;
const barlessInset = 5;
const r = (x: number) => Math.round(x * 100) / 100;
const seg = (p: Pt, q: Pt) => `M${r(p[0])},${r(p[1])} L${r(q[0])},${r(q[1])}`;
const far = (p: Pt, q: Pt) => Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.5;
const insetSeg = (p: Pt, q: Pt, inset: number) => {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const len = Math.hypot(dx, dy);
  const d = Math.min(inset, len / 2);
  if (!Number.isFinite(len) || len <= 0.5 || d <= 0) return seg(p, q);
  const ux = dx / len;
  const uy = dy / len;
  return seg([p[0] + ux * d, p[1] + uy * d], [q[0] - ux * d, q[1] - uy * d]);
};

const g = computed(() => {
  const { a, b, offset } = props;
  const dir = props.dir ?? [a[0] - b[0], a[1] - b[1]];
  const len = Math.hypot(dir[0], dir[1]) || 1;
  const u: Pt = [dir[0] / len, dir[1] / len];
  const perp: Pt = [-u[1], u[0]];
  const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const o: Pt = [mid[0] + offset * perp[0], mid[1] + offset * perp[1]];
  // Foot of `p` on the (offset) dimension line.
  const onLine = (p: Pt): Pt => {
    const t = (p[0] - o[0]) * u[0] + (p[1] - o[1]) * u[1];
    return [o[0] + t * u[0], o[1] + t * u[1]];
  };
  const a2 = onLine(a);
  const b2 = onLine(b);
  const side = offset < 0 ? -1 : 1; // push the label to the far side of the line
  return {
    line: seg(a2, b2),
    visibleLine: props.showBar ? seg(a2, b2) : insetSeg(a2, b2, barlessInset),
    helperA: far(a, a2) ? seg(a, a2) : null,
    helperB: far(b, b2) ? seg(b, b2) : null,
    lx: (a2[0] + b2[0]) / 2 + side * props.labelGap * perp[0],
    ly: (a2[1] + b2[1]) / 2 + side * props.labelGap * perp[1],
  };
});
</script>

<template>
  <g class="dim-annotation" :style="fill ? { color: fill } : undefined">
    <defs>
      <marker
        :id="id"
        viewBox="0 0 4 6"
        refX="3.5"
        refY="3"
        markerWidth="6.4"
        markerHeight="9.6"
        orient="auto-start-reverse"
        overflow="visible"
      >
        <polygon points="0.3,1.2 3.5,3 0.3,4.8" fill="currentColor" />
        <line
          v-if="showBar"
          x1="3.5"
          y1="0"
          x2="3.5"
          y2="6"
          stroke="currentColor"
          stroke-width="0.5"
        />
      </marker>
    </defs>

    <path
      v-if="g.helperA"
      class="guide"
      :d="g.helperA"
      :style="{ d: `path('${g.helperA}')` }"
    />
    <path
      v-if="g.helperB"
      class="guide"
      :d="g.helperB"
      :style="{ d: `path('${g.helperB}')` }"
    />
    <path
      class="bar"
      :d="g.visibleLine"
      :style="{ d: `path('${g.visibleLine}')` }"
      :marker-start="showBar ? `url(#${id})` : undefined"
      :marker-end="showBar ? `url(#${id})` : undefined"
    />
    <path
      v-if="!showBar"
      class="marker-carrier"
      :d="g.line"
      :style="{ d: `path('${g.line}')` }"
      :marker-start="`url(#${id})`"
      :marker-end="`url(#${id})`"
    />
    <text
      v-if="label"
      class="label"
      :style="{ transform: `translate(${g.lx}px, ${g.ly}px)` }"
    >
      {{ label }}
    </text>
  </g>
</template>

<style scoped>
.bar {
  fill: none;
  stroke: currentColor;
  stroke-width: var(--dim-weight, 4);
  stroke-dasharray: var(--dim-dash, none);
  stroke-linecap: var(--dim-linecap, butt);
  transition: d var(--transition-duration) var(--transition-curve);
}
.marker-carrier {
  fill: none;
  stroke: currentColor;
  stroke-opacity: 0;
  stroke-width: var(--dim-weight, 4);
  transition: d var(--transition-duration) var(--transition-curve);
}
.guide {
  fill: none;
  stroke: color-mix(in srgb, currentColor 30%, transparent);
  stroke-width: 2;
  stroke-dasharray: 4 8;
  transition: d var(--transition-duration) var(--transition-curve);
}
.label {
  fill: currentColor;
  font:
    italic 700 var(--dim-font, 46px) / 1 "Times New Roman",
    serif;
  text-anchor: middle;
  dominant-baseline: middle;
  transition: transform var(--transition-duration) var(--transition-curve);
}
</style>
