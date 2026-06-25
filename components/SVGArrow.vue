<script setup lang="ts">
import { computed } from "vue";

type Point = [x: number, y: number];

const props = withDefaults(
  defineProps<{
    /** Tail of the arrow, in the overlay's SVG user units. */
    start: Point;
    /** Tip of the arrow — the end the head points at. */
    end: Point;
    /** Length of each arrowhead wing. */
    size?: number;
    /** Stroke width of the shaft and head. */
    width?: number;
    /** Stroke color. */
    color?: string;
    /** Half-angle of the arrowhead, in degrees. */
    angle?: number;
    /** Toggle that drives the enter/leave transition. */
    visible?: boolean;
    /** Total enter/leave duration, in milliseconds. */
    duration?: number;
  }>(),
  {
    size: 6,
    width: 4,
    color: "currentColor",
    angle: 30,
    visible: true,
    duration: 700,
  },
);

/**
 * Pure geometry: the shaft and head path data for a given draw state, where
 * `headFrac` / `tailFrac` are fractions of the tip and shaft tail along the
 * start -> end segment.
 */
function paths(headFrac: number, tailFrac: number) {
  const [x1, y1] = props.start;
  const [x2, y2] = props.end;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  // Forward / backward unit vectors along the segment.
  const fx = dx / len;
  const fy = dy / len;
  const bx = -fx;
  const by = -fy;

  const a = (props.angle * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);

  // Distances along the segment for the tip, shaft tail, and head base.
  const tipDist = headFrac * len;
  const tailDist = tailFrac * len;
  const baseDist = tipDist - props.size * cos;

  const tipX = x1 + fx * tipDist;
  const tipY = y1 + fy * tipDist;
  // Rotate the backward unit vector by ±angle, scale to `size`, for the wings.
  const wx1 = tipX + props.size * (bx * cos - by * sin);
  const wy1 = tipY + props.size * (bx * sin + by * cos);
  const wx2 = tipX + props.size * (bx * cos + by * sin);
  const wy2 = tipY + props.size * (-bx * sin + by * cos);

  // Shaft runs from its tail up to the head's base — but only while the base
  // sits ahead of the tail, otherwise it has fully retracted into the head.
  const shaft =
    baseDist > tailDist
      ? `M${x1 + fx * tailDist},${y1 + fy * tailDist} L${x1 + fx * baseDist},${y1 + fy * baseDist}`
      : "";

  return {
    shaft,
    head: `M${tipX},${tipY} L${wx1},${wy1} L${wx2},${wy2} Z`,
  };
}

// Resting (fully drawn) arrow used by the reactive render while idle.
const resting = computed(() => paths(1, 0));

// --- Transition (JS hooks) -------------------------------------------------
//
// The leave animation must mutate the DOM element directly: a leaving element
// is no longer part of the component's current render tree, so reactive
// bindings can't reach it. We drive enter the same way for symmetry.

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

let raf = 0;

function draw(g: SVGGElement, headFrac: number, tailFrac: number, opacity: number) {
  const { shaft, head } = paths(headFrac, tailFrac);
  g.style.opacity = `${opacity}`;
  g.querySelector<SVGPathElement>(".shaft")?.setAttribute("d", shaft);
  g.querySelector<SVGPathElement>(".head")?.setAttribute("d", head);
}

function run(onFrame: (t: number) => void, done: () => void) {
  cancelAnimationFrame(raf);
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min((now - start) / props.duration, 1);
    onFrame(t);
    if (t < 1) raf = requestAnimationFrame(tick);
    else done();
  };
  raf = requestAnimationFrame(tick);
}

// Enter: head fades in at the start point over the first 20%, then travels to
// the end over the rest while the shaft grows behind it.
function onEnter(el: Element, done: () => void) {
  const g = el as SVGGElement;
  draw(g, 0, 0, 0); // set the initial frame synchronously to avoid a flash
  run((t) => {
    draw(
      g,
      t < 0.2 ? 0 : easeInOut((t - 0.2) / 0.8),
      0,
      t < 0.2 ? t / 0.2 : 1,
    );
  }, () => {
    g.style.opacity = ""; // hand opacity back to the resting render
    done();
  });
}

// Leave: arrow holds at the end while the shaft shortens into the head over
// the first 80%, then the whole arrow fades out over the last 20%.
function onLeave(el: Element, done: () => void) {
  const g = el as SVGGElement;
  run((t) => {
    draw(
      g,
      1,
      t < 0.8 ? easeInOut(t / 0.8) : 1,
      t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2,
    );
  }, done);
}

function onCancelled() {
  cancelAnimationFrame(raf);
}
</script>

<template>
  <Transition
    :css="false"
    @enter="onEnter"
    @leave="onLeave"
    @enter-cancelled="onCancelled"
    @leave-cancelled="onCancelled"
  >
    <g v-if="visible" :stroke="color">
      <path class="shaft" :d="resting.shaft" fill="none" :stroke-width="width" />
      <path class="head" :d="resting.head" :fill="color" :stroke-width="width" />
    </g>
  </Transition>
</template>
