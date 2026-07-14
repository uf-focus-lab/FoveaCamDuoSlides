<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from "vue";

type CssLength = number | string;
type ObjectFit = "contain" | "cover" | "fill" | "none" | "scale-down";
type Model = number | { k: number; b: number };

// A cover-flow tile is either an image URL (rendered as <img>) or a component
// descriptor (rendered as <component :is>) so slides can mix media and rich
// Vue tiles in the same flow. Objects may carry a caption that rides along with
// the tile (same matrix3d transform) and fades in only while centered.
type CoverFlowImageItem = {
  src: string;
  caption?: string;
  key?: string | number;
};
type CoverFlowComponentItem = {
  component: Component;
  props?: Record<string, unknown>;
  caption?: string;
  key?: string | number;
};
export type CoverFlowItem =
  | string
  | CoverFlowImageItem
  | CoverFlowComponentItem;

interface CoverFlowProps {
  items: CoverFlowItem[];
  activeIndex?: number;
  aspectRatio?: Model;
  translateXRatio?: Model;
  depthStepRatio?: Model;
  sideRotation?: number;
  maxVisibleOffset?: number;
  minScale?: number;
  scaleStep?: Model;
  fadeRatio?: Model;
  perspective?: CssLength;
  perspectiveRatio?: Model;
  minPerspective?: number;
  perspectiveOrigin?: string;
  transitionDuration?: string;
  transitionCurve?: string;
  padding?: string;
  objectFit?: ObjectFit;
  objectPosition?: string;
  borderRadius?: string;
  border?: string;
  backgroundColor?: string;
  boxShadow?: string;
  activeBoxShadow?: string;
}

const props = withDefaults(defineProps<CoverFlowProps>(), {
  activeIndex: 0,
  aspectRatio: 1,
  translateXRatio: () => ({ k: 0.2, b: 0.6 }),
  depthStepRatio: 0,
  sideRotation: 75,
  maxVisibleOffset: Infinity,
  minScale: 0.5,
  scaleStep: () => ({ k: 0.05, b: 0.1 }),
  fadeRatio: () => ({ k: 0.1, b: 0.4 }),
  perspectiveRatio: 2,
  minPerspective: 420,
  perspectiveOrigin: "center",
  transitionDuration: "0.42s",
  transitionCurve: "cubic-bezier(0.2, 0.65, 0.2, 1)",
  padding: "0",
  objectFit: "cover",
  objectPosition: "50% 50%",
  borderRadius: "1em",
  border: "none",
  backgroundColor: "var(--bg)",
  boxShadow: "0 22px 48px var(--bg)",
  activeBoxShadow: "0 28px 64px var(--bg)",
});

const stageRef = ref<HTMLElement | null>(null);
const stageSize = ref({ width: 0, height: 0 });
let resizeObserver: ResizeObserver | undefined;

const safeAspectRatio = computed(() =>
  Math.max(0.05, modelValue(props.aspectRatio)),
);

const centerSize = computed(() => {
  const { width, height } = stageSize.value;

  if (!width || !height) {
    return { width: 0, height: 0 };
  }

  const fitWidth = Math.min(width, height * safeAspectRatio.value);

  return {
    width: fitWidth,
    height: fitWidth / safeAspectRatio.value,
  };
});

const perspective = computed(() => {
  if (props.perspective !== undefined) {
    return cssLength(props.perspective);
  }

  return `${Math.max(
    props.minPerspective,
    ratioPixels(props.perspectiveRatio, centerSize.value.width),
  )}px`;
});

const coverFlowStyle = computed<Record<string, string>>(() => ({
  perspective: perspective.value,
  perspectiveOrigin: props.perspectiveOrigin,
  padding: props.padding,
  "--transition-duration": props.transitionDuration,
  "--transition-curve": props.transitionCurve,
  "--cover-flow-radius": props.borderRadius,
  "--cover-flow-border": props.border,
  "--cover-flow-background": props.backgroundColor,
  "--cover-flow-shadow": props.boxShadow,
  "--cover-flow-active-shadow": props.activeBoxShadow,
}));

function measureStage() {
  const rect = stageRef.value?.getBoundingClientRect();

  if (!rect) {
    return;
  }

  stageSize.value = {
    width: rect.width,
    height: rect.height,
  };
}

onMounted(() => {
  if (!stageRef.value) {
    return;
  }

  resizeObserver = new ResizeObserver(([entry]) => {
    stageSize.value = {
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    };
  });
  resizeObserver.observe(stageRef.value);
  measureStage();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

function offsetFromActive(index: number) {
  return index - props.activeIndex;
}

function cssLength(value: CssLength) {
  return typeof value === "number" ? `${value}px` : value;
}

// A numeric model is shorthand for V = kN with b = 0.
// For object models, b is a non-center bias: V = kN + b when N !== 0.
function modelValue(model: Model, n = 1) {
  return typeof model === "number"
    ? model * n
    : model.k * n + (n === 0 ? 0 : model.b);
}

function ratioPixels(model: Model, base: number, n = 1) {
  return modelValue(model, n) * base;
}

function clampedModelValue(model: Model, n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, modelValue(model, n)));
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function matrixValue(value: number) {
  return Math.abs(value) < 0.00001 ? "0" : value.toFixed(5);
}

function coverflowMatrix3d(
  translateX: number,
  translateZ: number,
  rotateY: number,
  scale: number,
) {
  const yaw = toRadians(rotateY);
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);

  const values = [
    cy * scale,
    0,
    -sy * scale,
    0,
    0,
    scale,
    0,
    0,
    sy * scale,
    0,
    cy * scale,
    0,
    translateX,
    0,
    translateZ,
    1,
  ];

  return `matrix3d(${values.map(matrixValue).join(", ")})`;
}

function cardStyle(index: number) {
  const offset = offsetFromActive(index);
  const absOffset = Math.abs(offset);
  const limitedOffset = Math.min(absOffset, props.maxVisibleOffset);
  const direction = Math.sign(offset);
  const baseWidth = centerSize.value.width;
  const translateX =
    direction * ratioPixels(props.translateXRatio, baseWidth, absOffset);
  const translateZ = -ratioPixels(props.depthStepRatio, baseWidth, absOffset);
  const rotateY =
    direction === 0
      ? 0
      : direction < 0
        ? props.sideRotation
        : -props.sideRotation;
  const scale = Math.max(
    props.minScale,
    1 - modelValue(props.scaleStep, limitedOffset),
  );
  const fade = clampedModelValue(props.fadeRatio, limitedOffset, 0, 1);

  return {
    width: `${centerSize.value.width}px`,
    height: `${centerSize.value.height}px`,
    "--cover-flow-fade": String(fade),
    transform: `translate(-50%, -50%) ${coverflowMatrix3d(
      translateX,
      translateZ,
      rotateY,
      scale,
    )}`,
    zIndex: String(100 - absOffset),
  };
}

function imageAlt(src: string, index: number) {
  const filename = decodeURIComponent(
    src.split(/[/?#]/).filter(Boolean).at(-1) ?? "",
  );
  const basename = filename.replace(/\.[^.]+$/, "");

  return basename || `Cover flow image ${index + 1}`;
}

type NormalizedItem = {
  kind: "image" | "component";
  src?: string;
  component?: Component;
  componentProps?: Record<string, unknown>;
  caption?: string;
  key: string | number;
};

const normalizedItems = computed<NormalizedItem[]>(() =>
  props.items.map((item, index) => {
    if (typeof item === "string") {
      return { kind: "image", src: item, key: `${item}-${index}` };
    }

    if ("component" in item) {
      return {
        kind: "component",
        component: item.component,
        componentProps: item.props,
        caption: item.caption,
        key: item.key ?? index,
      };
    }

    return {
      kind: "image",
      src: item.src,
      caption: item.caption,
      key: item.key ?? `${item.src}-${index}`,
    };
  }),
);
</script>

<template>
  <div class="cover-flow" :style="coverFlowStyle">
    <div ref="stageRef" class="cover-flow-stage">
      <article
        v-for="(item, index) in normalizedItems"
        :key="item.key"
        class="cover-flow-card"
        :class="{ active: index === activeIndex }"
        :style="cardStyle(index)"
      >
        <div class="image-frame">
          <img
            v-if="item.kind === 'image'"
            :src="item.src"
            :alt="imageAlt(item.src ?? '', index)"
            :style="{
              objectFit: props.objectFit,
              objectPosition: props.objectPosition,
            }"
            draggable="false"
          />
          <component
            :is="item.component"
            v-else
            class="cover-flow-card-component"
            v-bind="item.componentProps ?? {}"
          />
          <div class="fade-overlay" />
        </div>
        <figcaption v-if="item.caption" class="cover-flow-caption">
          {{ item.caption }}
        </figcaption>
      </article>
    </div>
  </div>
</template>

<style scoped>
.cover-flow {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: stretch;
  justify-content: stretch;
  transform-style: preserve-3d;
}

.cover-flow-stage {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  transform-style: preserve-3d;
}

.cover-flow-card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center center;
  transition: transform var(--transition-duration) var(--transition-curve);
}

/*
 * Shadows live on pseudo-elements and cross-fade via opacity (a compositor-only
 * property) instead of animating box-shadow, whose blur is re-rasterized every
 * frame. The base shadow stays lit; the larger active shadow fades in over it.
 * z-index:-1 tucks both behind the frame within the card's stacking context.
 */
.cover-flow-card::before,
.cover-flow-card::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: var(--cover-flow-radius);
  pointer-events: none;
}

.cover-flow-card::before {
  box-shadow: var(--cover-flow-shadow);
}

.cover-flow-card::after {
  box-shadow: var(--cover-flow-active-shadow);
  opacity: 0;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.cover-flow-card.active::after {
  opacity: 1;
}

.image-frame {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: var(--cover-flow-border);
  border-radius: var(--cover-flow-radius);
  background: var(--cover-flow-background);
}

.image-frame img {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
}

.cover-flow-card-component {
  display: block;
  width: 100%;
  height: 100%;
}

.fade-overlay {
  position: absolute;
  inset: 0;
  background: var(--cover-flow-background);
  opacity: var(--cover-flow-fade);
  pointer-events: none;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

/*
 * The caption is a child of the card, so it inherits the same matrix3d
 * transform and rides along with its tile. Its own opacity fades from 0 on the
 * side stages to 1 only when the tile is centered.
 */
.cover-flow-caption {
  position: absolute;
  left: 50%;
  top: calc(100% + 0.2em);
  transform: translateX(-50%);
  margin: 0;
  font-size: 0.8em;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

.cover-flow-card.active .cover-flow-caption {
  opacity: 1;
}
</style>
