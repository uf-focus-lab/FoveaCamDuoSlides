<script setup lang="ts">
import { nextTick, ref, onMounted, onBeforeUnmount, watch } from "vue";
import FigureSvg from "assets/convergent-stereo/figure.svg";
import { advanceActiveStage, useStage } from "stores/stage";

type AnimationState = {
  currentStep: number;
  maxStep: number;
  arrowHeads: WeakMap<SVGGeometryElement, SVGPolygonElement>;
  trackedArrows: Set<SVGGeometryElement>;
  animationLoopId?: number;
};

const canvasRef = ref<HTMLDivElement>();
const stage = useStage(10, { presist: true });
const state = ref<AnimationState>({
  currentStep: -1,
  maxStep: 0,
  arrowHeads: new WeakMap(),
  trackedArrows: new Set(),
});

const props = defineProps<{
  autoplay?: boolean;
  delay?: number;
}>();

const stageReady = ref(false);

function getArrowLength(path: SVGGeometryElement): number {
  const stored = Number(path.dataset.len);
  return Number.isFinite(stored) && stored > 0 ? stored : path.getTotalLength();
}

function ensureArrowHead(
  path: SVGGeometryElement,
  arrowHeads: WeakMap<SVGGeometryElement, SVGPolygonElement>,
  trackedArrows: Set<SVGGeometryElement>
): SVGPolygonElement {
  const existing = arrowHeads.get(path);
  const parent = path.parentElement;
  if (!parent) {
    throw new Error("Arrow path has no parent element.");
  }

  if (existing) {
    if (
      existing.parentElement !== parent ||
      existing.previousSibling !== path
    ) {
      parent.insertBefore(existing, path.nextSibling);
    }
    trackedArrows.add(path);
    return existing;
  }

  const svg = path.ownerSVGElement;
  if (!svg) {
    throw new Error("Arrow path is not attached to an SVG element.");
  }

  const head = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  head.setAttribute("points", "10,0 0,-5 0,5");
  head.style.pointerEvents = "none";
  head.style.stroke = "none";
  head.style.fill = window.getComputedStyle(path).stroke;
  head.style.display = "none";
  head.style.transition = "none";
  head.style.transitionDelay = "0s";
  parent.insertBefore(head, path.nextSibling);
  arrowHeads.set(path, head);
  trackedArrows.add(path);
  return head;
}

function renderArrowHeadAtLength(
  path: SVGGeometryElement,
  visibleLength: number,
  arrowHeads: WeakMap<SVGGeometryElement, SVGPolygonElement>
): void {
  const totalLength = getArrowLength(path);
  const length = Math.max(0, Math.min(visibleLength, totalLength));
  const head = ensureArrowHead(path, arrowHeads, state.value.trackedArrows);

  if (length <= 0.1) {
    head.style.display = "none";
    return;
  }

  const epsilon = Math.min(2, totalLength * 0.01);
  const beforeLength = Math.max(0, length - epsilon);
  const pointOnPath = path.getPointAtLength(length);
  const prevOnPath = path.getPointAtLength(beforeLength);

  let point = pointOnPath;
  let prev = prevOnPath;
  const pathCtm = path.getCTM();
  const parentGraphic =
    path.parentElement instanceof SVGGraphicsElement
      ? path.parentElement
      : null;
  const parentCtm = parentGraphic?.getCTM() ?? null;

  if (pathCtm && parentCtm) {
    try {
      const toParent = parentCtm.inverse();
      point = pointOnPath.matrixTransform(pathCtm).matrixTransform(toParent);
      prev = prevOnPath.matrixTransform(pathCtm).matrixTransform(toParent);
    } catch {
      point = pointOnPath;
      prev = prevOnPath;
    }
  }

  const angle =
    (Math.atan2(point.y - prev.y, point.x - prev.x) * 180) / Math.PI;

  head.style.fill = window.getComputedStyle(path).stroke;
  head.style.display = "";
  head.setAttribute(
    "transform",
    `translate(${point.x} ${point.y}) rotate(${angle})`
  );
}

function updateArrowHeads(): void {
  state.value.trackedArrows.forEach((path) => {
    if (!path.isConnected) {
      state.value.trackedArrows.delete(path);
      return;
    }

    const head = state.value.arrowHeads.get(path);
    if (!head || !head.isConnected) {
      state.value.trackedArrows.delete(path);
      return;
    }

    const totalLength = getArrowLength(path);
    const dashOffset = Number.parseFloat(
      window.getComputedStyle(path).strokeDashoffset
    );
    const visibleLength = Number.isFinite(dashOffset)
      ? Math.max(0, Math.min(totalLength, totalLength - dashOffset))
      : 0;

    renderArrowHeadAtLength(path, visibleLength, state.value.arrowHeads);
  });
}

async function startArrowAnimation(): Promise<void> {
  while (canvasRef.value?.isConnected) {
    updateArrowHeads();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve())
    );
  }
}

function showUpTo(step: number): void {
  if (!canvasRef.value) return;

  canvasRef.value
    .querySelectorAll<HTMLElement>("[data-step]")
    .forEach((el) => {
      const wasShown = el.classList.contains("show");
      const stepValue = Number(el.dataset.step);
      const show = Number.isFinite(stepValue) && stepValue <= step;
      el.classList.toggle("show", show);

      if (show === wasShown) {
        return;
      }

      el.querySelectorAll<SVGGeometryElement>(".arrow").forEach((path) => {
        if (show) {
          path.style.markerEnd = "none";
          path.style.strokeDashoffset = "0";
        } else {
          ensureArrowHead(path, state.value.arrowHeads, state.value.trackedArrows)
            .style.display = "none";
          path.style.markerEnd = "none";
          path.style.strokeDashoffset = path.dataset.len ?? "0";
        }
      });
    });
}

async function waitForTransitionEnd(element: Element): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const animations = element
    .getAnimations({ subtree: true })
    .filter((animation) => {
      const timing = animation.effect?.getComputedTiming();
      if (!timing) {
        return false;
      }

      const activeDuration = Number(timing.activeDuration);
      const endTime = Number(timing.endTime);
      return activeDuration > 0 || endTime > 0;
    });

  if (animations.length === 0) {
    return;
  }

  await Promise.allSettled(
    animations.map((animation) =>
      animation.finished.then(
        () => undefined,
        () => undefined
      )
    )
  );
}

async function waitForStageAnimation(step: number): Promise<void> {
  if (!canvasRef.value) {
    return;
  }

  const stepElements = Array.from(
    canvasRef.value.querySelectorAll<HTMLElement>(`[data-step="${step}"]`),
  );
  await Promise.all(stepElements.map((stepElement) => waitForTransitionEnd(stepElement)));
}

async function playAll(): Promise<void> {
  const delay = props.delay ?? 400;

  if (stage.value === 0) {
    return;
  }

  while (stage.value < 10) {
    const advanced = advanceActiveStage();
    if (!advanced) {
      break;
    }

    await waitForStageAnimation(stage.value - 1);

    if (stage.value < 10 && delay > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delay);
      });
    }
  }
}

async function initializeFigure(): Promise<void> {
  await nextTick();
  if (!canvasRef.value) return;

  const svg = canvasRef.value.querySelector<SVGSVGElement>("svg");
  if (svg) {
    // Remove the inline background-color style that causes black background
    svg.style.backgroundColor = "transparent";
    svg.style.width = "100%";
    svg.style.height = "auto";

    svg.querySelectorAll<SVGImageElement>("image").forEach((image) => {
      image.setAttribute("preserveAspectRatio", "xMidYMid slice");
    });

    svg.querySelectorAll<SVGElement>(".box .outline, .box .edge").forEach((element) => {
      if (element.closest(".camera-left, .camera-right")) return;
      element.setAttribute("stroke", "rgba(0, 0, 0, 0.28)");
    });

    svg.querySelectorAll<SVGElement>(".animate.line-draw").forEach((el) => {
      el.setAttribute("pathLength", "1");
    });
  }

  state.value.maxStep = 0;
  canvasRef.value
    .querySelectorAll<HTMLElement>("[data-step]")
    .forEach((el) => {
      const value = Number(el.dataset.step);
      if (Number.isFinite(value)) {
        state.value.maxStep = Math.max(state.value.maxStep, value);
      }
    });

  canvasRef.value
    .querySelectorAll<SVGGeometryElement>(".arrow")
    .forEach((path) => {
      const length = path.getTotalLength();
      path.dataset.len = String(length);
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);
      path.style.markerEnd = "none";
      ensureArrowHead(path, state.value.arrowHeads, state.value.trackedArrows);
    });

  stageReady.value = true;
  showUpTo(stage.value > 0 ? stage.value - 1 : -1);
}

watch(
  stage,
  (nextStage) => {
    if (!stageReady.value) {
      return;
    }

    showUpTo(nextStage > 0 ? nextStage - 1 : -1);
  },
  { immediate: true },
);

onMounted(async () => {
  await initializeFigure();
  state.value.animationLoopId = requestAnimationFrame(async () => {
    await startArrowAnimation();
  });

  if (props.autoplay) {
    await playAll();
  }
});

onBeforeUnmount(() => {
  if (state.value.animationLoopId) {
    cancelAnimationFrame(state.value.animationLoopId);
  }
});
</script>

<style scoped lang="css">
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: transparent;
}

#canvas {
  width: 100%;
  max-width: 1200px;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

:deep(#canvas svg) {
  width: 100%;
  height: auto;
  background-color: transparent !important;
  background: transparent !important;
}

:deep(svg image) {
  display: block;
}

.info {
  color: #aaa;
  font-size: 0.9rem;
}

.controls {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(6px);
}

button {
  padding: 5px 12px;
  border: 1px solid #666;
  background: rgba(255, 255, 255, 0.05);
  color: #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #888;
  color: #fff;
}

/* Animation styles for data-step elements */
:deep([data-step]) {
  opacity: 0;
  transition: opacity var(--transition-duration) var(--transition-curve);
}

:deep([data-step].show) {
  opacity: 1;
}

/* Arrow animation */
:deep(.arrow) {
  transition: stroke-dashoffset var(--transition-duration) var(--transition-curve);
}
</style>

<template>
  <div class="container">
    <div id="canvas" ref="canvasRef">
      <FigureSvg />
    </div>
  </div>
</template>
