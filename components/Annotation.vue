<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

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
const svgStyle = computed(() => ({
  ...anchorStyle.value,
  "--label-x": `${round(labelGeometry.value.x)}px`,
  "--label-y": `${round(labelGeometry.value.y)}px`,
  "--label-hidden-x": `${round(labelGeometry.value.x + labelGeometry.value.enterX)}px`,
  "--label-hidden-y": `${round(labelGeometry.value.y + labelGeometry.value.enterY)}px`,
}));
const anchorStyle = computed(() => {
  if (props.pin) return {};

  const { side } = parsedPosition.value;
  switch (side) {
    case "T":
      return { bottom: "100%", right: "50%" };
    case "B":
      return { top: "100%", right: "50%" };
    case "L":
      return { top: "50%", right: "100%" };
    case "R":
      return { top: "50%", left: "100%" };
  }
});

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

onMounted(() => {
  void nextTick(updateFontPx);
  if (root.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(updateFontPx);
    resizeObserver.observe(root.value);
  }
  window.addEventListener("resize", updateFontPx);
});

watch(
  () => [props.offset, props.position],
  () => void nextTick(updateFontPx),
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("resize", updateFontPx);
});
</script>

<template>
  <svg
    ref="root"
    class="annotation"
    :class="{ show }"
    :style="svgStyle"
    width="1"
    height="1"
    viewBox="0 0 1 1"
    overflow="visible"
    aria-hidden="true"
  >
    <path
      class="guide"
      :d="route.path"
      pathLength="1"
    />
    <text
      class="label"
      x="0"
      y="0"
      :text-anchor="(props.textAnchor ?? labelGeometry.anchor) as any"
      :dominant-baseline="(props.baseline ?? labelGeometry.baseline) as any"
    >
      <slot>{{ props.label }}</slot>
    </text>
  </svg>
</template>

<style scoped>
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

.show .guide {
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

.show .label {
  opacity: 1;
  transform: translate(var(--label-x), var(--label-y));
}
</style>
