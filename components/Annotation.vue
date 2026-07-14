<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  watch,
} from "vue";
import { katexEmbedClass } from "./katex-context";

defineOptions({ inheritAttrs: false });

type Position =
  | "T"
  | "TL"
  | "TR"
  | "B"
  | "BL"
  | "BR"
  | "L"
  | "LT"
  | "LB"
  | "R"
  | "RT"
  | "RB";
type Length = number | string;
type Offset = Length | [Length, Length];
type Point = [Length, Length];

const props = withDefaults(
  defineProps<{
    show?: boolean;
    position?: Position;
    offset?: Offset;
    align?: "left" | "right";
    /** Teleport onto the KaTeX glyph with this textContent (needs a <Katex> ancestor). */
    at?: string;
    /** Which occurrence of `at` to use when a glyph repeats (default 0). */
    atNth?: number;
    /** Gap between the anchor point and the annotated element's bbox edge. */
    spacing?: Length;
    /** Render the label as HTML (in a <foreignObject>) so it can hold KaTeX etc. */
    html?: boolean;
    label?: string;
    pin?: boolean;
    guideTo?: Point;
    labelAt?: Point;
    textAnchor?: "start" | "middle" | "end";
    baseline?:
      | "auto"
      | "middle"
      | "hanging"
      | "text-after-edge"
      | "central"
      | "alphabetic";
  }>(),
  {
    show: true,
    position: "B",
    offset: undefined,
    align: undefined,
    at: undefined,
    atNth: 0,
    spacing: 0,
    html: false,
    label: "",
    pin: false,
    guideTo: undefined,
    labelAt: undefined,
    textAnchor: undefined,
    baseline: undefined,
  },
);

const root = ref<SVGSVGElement | null>(null);
const fontPx = ref(16);
let resizeObserver: ResizeObserver | undefined;

const attrs = useAttrs();
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});

// When `at` is set, a hidden locator renders in place inside the host <Katex>.
// We find the matching glyph, then teleport the guide into the <Katex> wrapper
// (a stable positioned box) and anchor it at the glyph's measured offset — an
// inline glyph is too fragile to serve as the positioning context directly.
const anchor = ref<HTMLElement | null>(null);
const target = ref<HTMLElement | null>(null);
const anchorPoint = ref<{ left: string; top: string } | null>(null);
let hostObserver: ResizeObserver | undefined;

function measure(host: HTMLElement, glyph: HTMLElement) {
  const hr = host.getBoundingClientRect();
  const gr = glyph.getBoundingClientRect();
  const side = props.position.toUpperCase()[0];
  const s = lengthToPx(props.spacing);
  let x = gr.left - hr.left + gr.width / 2;
  let y = gr.top - hr.top + gr.height / 2;
  if (side === "T") y = gr.top - hr.top - s;
  else if (side === "B") y = gr.top - hr.top + gr.height + s;
  else if (side === "L") x = gr.left - hr.left - s;
  else if (side === "R") x = gr.left - hr.left + gr.width + s;
  anchorPoint.value = { left: `${round(x)}px`, top: `${round(y)}px` };
}

function locate() {
  hostObserver?.disconnect();
  target.value = null;
  anchorPoint.value = null;
  const host = props.at
    ? anchor.value?.closest<HTMLElement>(`.${katexEmbedClass}`)
    : null;
  if (!host) return;
  let glyph: HTMLElement | undefined;
  let i = 0;
  for (const span of host.querySelectorAll<HTMLElement>("span")) {
    if (span.childElementCount === 0 && span.textContent === props.at) {
      if (i++ === props.atNth) {
        glyph = span;
        break;
      }
    }
  }
  if (!glyph) return;
  // host must be a positioning context; only force it when it's static so an
  // already-absolute host (e.g. an equation positioned by its slide) is kept.
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  target.value = host;
  measure(host, glyph);
  if (typeof ResizeObserver !== "undefined") {
    hostObserver = new ResizeObserver(() => measure(host, glyph!));
    hostObserver.observe(host);
  }
}
watch(
  [anchor, () => props.at, () => props.atNth, () => props.position],
  () => void nextTick(locate),
  { immediate: true },
);

const parsedPosition = computed(() => {
  const raw = props.position.toUpperCase() as Position;
  return {
    side: raw[0] as "T" | "B" | "L" | "R",
    align: raw[1] as "L" | "R" | "T" | "B" | undefined,
  };
});
const manualGuideTo = computed(() =>
  props.guideTo
    ? { x: lengthToPx(props.guideTo[0]), y: lengthToPx(props.guideTo[1]) }
    : undefined,
);
const manualLabelAt = computed(() =>
  props.labelAt
    ? { x: lengthToPx(props.labelAt[0]), y: lengthToPx(props.labelAt[1]) }
    : undefined,
);
const route = computed(() => {
  if (manualGuideTo.value) {
    const end = manualGuideTo.value;
    return {
      elbow: { x: end.x, y: end.y },
      end,
      path: `M0,0 L${round(end.x)},${round(end.y)}`,
    };
  }

  const [primary, secondary] = offsetPx.value;
  const { side, align } = parsedPosition.value;
  const elbow = { x: 0, y: 0 };
  const end = { x: 0, y: 0 };

  switch (side) {
    case "T":
      elbow.y = -primary;
      end.y = -primary;
      if (align === "L") end.x = -secondary;
      if (align === "R") end.x = secondary;
      break;
    case "B":
      elbow.y = primary;
      end.y = primary;
      if (align === "L") end.x = -secondary;
      if (align === "R") end.x = secondary;
      break;
    case "L":
      elbow.x = -primary;
      end.x = -primary;
      if (align === "T") end.y = -secondary;
      if (align === "B") end.y = secondary;
      break;
    case "R":
      elbow.x = primary;
      end.x = primary;
      if (align === "T") end.y = -secondary;
      if (align === "B") end.y = secondary;
      break;
  }

  const path =
    align === undefined
      ? `M0,0 L${round(end.x)},${round(end.y)}`
      : `M0,0 L${round(elbow.x)},${round(elbow.y)} L${round(end.x)},${round(end.y)}`;
  return { elbow, end, path };
});
const offsetPx = computed(() => {
  const hasElbow = parsedPosition.value.align !== undefined;
  if (props.offset === undefined) return [fontPx.value, fontPx.value] as const;
  const offset = Array.isArray(props.offset)
    ? props.offset
    : [props.offset, hasElbow ? props.offset : 0];
  return [lengthToPx(offset[0]), lengthToPx(offset[1])] as const;
});
const labelGeometry = computed(() => {
  if (manualLabelAt.value) {
    return {
      x: manualLabelAt.value.x,
      y: manualLabelAt.value.y,
      anchor: props.textAnchor ?? "start",
      baseline: props.baseline ?? "middle",
      enterX: fontPx.value * 0.35,
      enterY: 0,
    };
  }

  const { side, align } = parsedPosition.value;
  const gap = fontPx.value * 0.35;
  const end = route.value.end;
  const text = {
    x: end.x,
    y: end.y,
    anchor: "middle",
    baseline: "middle",
    enterX: 0,
    enterY: 0,
  };

  if (side === "T" || side === "B") {
    if (align === "L" || align === "R") {
      text.x += align === "L" ? -gap : gap;
      text.anchor = align === "L" ? "end" : "start";
      text.enterX = align === "L" ? -fontPx.value * 0.45 : fontPx.value * 0.45;
    } else if (props.align) {
      // Straight vertical callout whose line meets the center of the first
      // (left-aligned) or last (right-aligned) letter of the label.
      const charHalf = fontPx.value * 0.3;
      text.y += side === "T" ? -gap : gap;
      text.baseline = side === "T" ? "text-after-edge" : "hanging";
      text.enterY = side === "T" ? -fontPx.value * 0.45 : fontPx.value * 0.45;
      text.anchor = props.align === "left" ? "start" : "end";
      text.x += props.align === "left" ? -charHalf : charHalf;
    } else {
      text.y += side === "T" ? -gap : gap;
      text.baseline = side === "T" ? "text-after-edge" : "hanging";
      text.enterY = side === "T" ? -fontPx.value * 0.45 : fontPx.value * 0.45;
    }
  } else {
    if (align === "T" || align === "B") {
      text.y += align === "T" ? -gap : gap;
      text.baseline = align === "T" ? "text-after-edge" : "hanging";
      text.enterY = align === "T" ? -fontPx.value * 0.45 : fontPx.value * 0.45;
    } else {
      text.x += side === "L" ? -gap : gap;
      text.anchor = side === "L" ? "end" : "start";
      text.enterX = side === "L" ? -fontPx.value * 0.45 : fontPx.value * 0.45;
    }
  }

  return text;
});
const svgStyle = computed(() => {
  const g = labelGeometry.value;
  const anchor = props.textAnchor ?? g.anchor;
  const baseline = props.baseline ?? g.baseline;
  return {
    ...(anchorPoint.value ?? anchorStyle.value),
    "--label-x": `${round(g.x)}px`,
    "--label-y": `${round(g.y)}px`,
    "--label-hidden-x": `${round(g.x + g.enterX)}px`,
    "--label-hidden-y": `${round(g.y + g.enterY)}px`,
    // How an HTML label aligns itself to the anchor point (SVG text does this
    // via text-anchor/baseline; a <div> needs a translate percentage).
    "--label-anchor-x":
      anchor === "middle" ? "-50%" : anchor === "end" ? "-100%" : "0%",
    "--label-anchor-y":
      baseline === "middle" || baseline === "central"
        ? "-50%"
        : baseline === "text-after-edge" || baseline === "alphabetic"
          ? "-100%"
          : "0%",
  };
});
const anchorStyle = computed(() => {
  if (props.pin) return {};

  const { side } = parsedPosition.value;
  const edge = props.spacing ? `calc(100% + ${cssLength(props.spacing)})` : "100%";
  switch (side) {
    case "T":
      return { bottom: edge, right: "50%" };
    case "B":
      return { top: edge, right: "50%" };
    case "L":
      return { top: "50%", right: edge };
    case "R":
      return { top: "50%", left: edge };
  }
});

function cssLength(value: Length) {
  return typeof value === "number" ? `${value}px` : value;
}

function lengthToPx(value: Length) {
  if (typeof value === "number") return value;

  const match = value.trim().match(/^(-?(?:\d+\.?\d*|\.\d+))(px|em|rem)?$/i);
  if (!match) return Number.parseFloat(value) || 0;

  const amount = Number.parseFloat(match[1]!);
  switch ((match[2] ?? "px").toLowerCase()) {
    case "em":
      return amount * fontPx.value;
    case "rem":
      return amount * rootRemPx();
    case "px":
      return amount;
    default:
      return amount;
  }
}

function rootRemPx() {
  if (typeof document === "undefined") return fontPx.value;
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

function updateFontPx() {
  if (!root.value) return;
  fontPx.value = Number.parseFloat(getComputedStyle(root.value).fontSize) || 16;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

// Re-measure whenever the <svg> (re)mounts — it may teleport into a glyph well
// after the component itself has mounted.
watch(
  root,
  (el) => {
    resizeObserver?.disconnect();
    if (!el) return;
    void nextTick(updateFontPx);
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateFontPx);
      resizeObserver.observe(el);
    }
  },
  { immediate: true },
);

onMounted(() => window.addEventListener("resize", updateFontPx));

watch(
  () => [props.offset, props.position],
  () => void nextTick(updateFontPx),
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  hostObserver?.disconnect();
  window.removeEventListener("resize", updateFontPx);
});
</script>

<template>
  <!-- `at`: an in-place, hidden locator used to find the host <Katex>. -->
  <span v-if="at" ref="anchor" class="annotation-anchor" aria-hidden="true" />

  <!-- Default: render in place so the parent's scoped styles/attrs apply. -->
  <svg
    v-if="!at"
    ref="root"
    v-bind="forwardedAttrs"
    class="annotation"
    :class="[attrs.class, { show }]"
    :style="[attrs.style, svgStyle]"
    width="1"
    height="1"
    viewBox="0 0 1 1"
    overflow="visible"
    aria-hidden="true"
  >
    <path class="guide" :d="route.path" pathLength="1" />
    <foreignObject v-if="html" class="label-fo" x="0" y="0" width="1" height="1">
      <div class="label-html"><slot>{{ props.label }}</slot></div>
    </foreignObject>
    <text
      v-else
      class="label"
      x="0"
      y="0"
      :text-anchor="(props.textAnchor ?? labelGeometry.anchor) as any"
      :dominant-baseline="(props.baseline ?? labelGeometry.baseline) as any"
    >
      <slot>{{ props.label }}</slot>
    </text>
  </svg>

  <!-- `at`: teleport onto the resolved KaTeX glyph so the guide anchors to it. -->
  <Teleport v-else-if="target" :to="target">
    <svg
      ref="root"
      v-bind="forwardedAttrs"
      class="annotation"
      :class="[attrs.class, { show }]"
      :style="[attrs.style, svgStyle]"
      width="1"
      height="1"
      viewBox="0 0 1 1"
      overflow="visible"
      aria-hidden="true"
    >
      <path class="guide" :d="route.path" pathLength="1" />
      <foreignObject v-if="html" class="label-fo" x="0" y="0" width="1" height="1">
        <div class="label-html"><slot>{{ props.label }}</slot></div>
      </foreignObject>
      <text
        v-else
        class="label"
        x="0"
        y="0"
        :text-anchor="(props.textAnchor ?? labelGeometry.anchor) as any"
        :dominant-baseline="(props.baseline ?? labelGeometry.baseline) as any"
      >
        <slot>{{ props.label }}</slot>
      </text>
    </svg>
  </Teleport>
</template>

<style scoped>
.annotation-anchor {
  display: none;
}

.annotation {
  position: absolute;
  overflow: visible;
  color: currentColor;
  font-size: 0.75em;
  pointer-events: none;
}

.guide {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  vector-effect: non-scaling-stroke;
  transition:
    d var(--transition-duration) var(--transition-curve),
    stroke-dashoffset var(--transition-duration) var(--transition-curve);
  transition-delay: var(--annotation-delay, 0ms);
}

/* Anchor to the annotation's own root: scoped CSS only tags the last selector,
   so a bare `.show` would also match an ancestor (e.g. a `.block.show` the
   annotation is teleported into) and leak its reveal state. */
.annotation.show .guide {
  stroke-dashoffset: 0;
}

.label {
  fill: currentColor;
  font: inherit;
  opacity: 0;
  transform: translate(var(--label-hidden-x), var(--label-hidden-y));
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
  transition-delay: var(--annotation-delay, 0ms);
}

.annotation.show .label {
  opacity: 1;
  transform: translate(var(--label-x), var(--label-y));
}

/* HTML label (foreignObject): positioned like the SVG text label, but a <div>
   aligns to the anchor point via an extra translate percentage. */
.label-fo {
  overflow: visible;
}

.label-html {
  position: absolute;
  top: 0;
  left: 0;
  width: max-content;
  color: currentColor;
  opacity: 0;
  transform: translate(
    calc(var(--label-hidden-x) + var(--label-anchor-x)),
    calc(var(--label-hidden-y) + var(--label-anchor-y))
  );
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
  transition-delay: var(--annotation-delay, 0ms);
}

.annotation.show .label-html {
  opacity: 1;
  transform: translate(
    calc(var(--label-x) + var(--label-anchor-x)),
    calc(var(--label-y) + var(--label-anchor-y))
  );
}
</style>
