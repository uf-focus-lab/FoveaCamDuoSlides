<script setup lang="ts">
import { computed, onMounted, ref, type CSSProperties } from "vue";
import { useStage } from "stores/stage";

interface GridItem {
  src?: string;
  alt?: string;
  title?: string;
  subtitle?: string;
}

interface ZoomBox {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

interface RowZoomOffset {
  x?: number;
  y?: number;
}

type CellZoomOffsets = RowZoomOffset[][];

type RevealMode = "stage" | "auto" | "all";
type RevealBy = "item" | "row" | "column";
type HighlightStartsOn = "odd" | "even";
type ZoomStartsOn = "odd" | "even";

const props = withDefaults(
  defineProps<{
    items?: GridItem[];
    columns?: number;
    rows?: number;
    gap?: string;
    tileAspectRatio?: string;
    tileRadius?: string;
    tileBorder?: string;
    tileBackground?: string;
    objectFit?: "cover" | "contain";
    label?: string;
    revealMode?: RevealMode;
    revealBy?: RevealBy;
    revealGridAtOnce?: boolean;
    staggerMs?: number;
    transitionMs?: number;
    startOffsetY?: string;
    startOffsetX?: string;
    showCaptions?: boolean;
    resetOnEnter?: boolean;
    highlightAlternateRows?: boolean;
    highlightStartsOn?: HighlightStartsOn;
    alternateColumnZoom?: boolean;
    zoomStartsOn?: ZoomStartsOn;
    zoomScale?: number;
    zoomFitBox?: boolean;
    zoomObjectFit?: "cover" | "contain";
    zoomBoxes?: ZoomBox[];
    zoomRowOffsets?: RowZoomOffset[];
    zoomCellOffsets?: CellZoomOffsets;
    zoomRevealAfterGrid?: boolean;
    showZoomBoxes?: boolean;
    zoomBoxBorder?: string;
    zoomBoxRows?: number[];
    showZoomRowFrames?: boolean;
    zoomRowFrameRows?: number[];
    zoomRowFrameBorder?: string;
    zoomRowFrameColors?: string[];
    showZoomColumnFrames?: boolean;
    zoomColumnFrameColumns?: number[];
    zoomColumnFrameBorder?: string;
    zoomColumnFrameColors?: string[];
    showOffsetDebug?: boolean;
    offsetDebugPrecision?: number;
    rowLabels?: string[];
    showRowLabels?: boolean;
    rowLabelBand?: string;
  }>(),
  {
    columns: 4,
    rows: undefined,
    gap: "0.8rem",
    tileAspectRatio: "4 / 3",
    tileRadius: "12px",
    tileBorder: "1px solid rgba(148, 163, 184, 0.45)",
    tileBackground: "#111827",
    objectFit: "contain",
    label: "Depth Results Grid",
    revealMode: "stage",
    revealBy: "row",
    revealGridAtOnce: false,
    staggerMs: 70,
    transitionMs: 520,
    startOffsetY: "18px",
    startOffsetX: "0px",
    showCaptions: false,
    resetOnEnter: true,
    highlightAlternateRows: false,
    highlightStartsOn: "even",
    alternateColumnZoom: false,
    zoomStartsOn: "odd",
    zoomScale: 2.2,
    zoomFitBox: true,
    zoomObjectFit: "cover",
    zoomBoxes: () => [],
    zoomRowOffsets: () => [],
    zoomCellOffsets: () => [],
    zoomRevealAfterGrid: false,
    showZoomBoxes: true,
    zoomBoxBorder: "2px solid #22d3ee",
    zoomBoxRows: undefined,
    showZoomRowFrames: false,
    zoomRowFrameRows: undefined,
    zoomRowFrameBorder: "3px solid currentColor",
    zoomRowFrameColors: () => [],
    showZoomColumnFrames: false,
    zoomColumnFrameColumns: undefined,
    zoomColumnFrameBorder: "3px solid currentColor",
    zoomColumnFrameColors: () => [],
    showOffsetDebug: false,
    offsetDebugPrecision: 1,
    rowLabels: () => [],
    showRowLabels: false,
    rowLabelBand: "2.2rem",
  }
);

const defaultZoomBox: ZoomBox = {
  x: 34,
  y: 30,
  width: 28,
  height: 28,
  color: "#22d3ee",
};

const totalSlots = computed(() => {
  if (props.rows) {
    return Math.max(1, props.rows * props.columns);
  }

  if (props.items && props.items.length > 0) {
    return props.items.length;
  }

  return props.columns * 3;
});

function makeDefaultItems(count: number): GridItem[] {
  return Array.from({ length: count }, (_, index) => ({
    title: `Tile ${index + 1}`,
    subtitle: "Replace with your sample",
  }));
}

const resolvedItems = computed(() => {
  const source =
    props.items && props.items.length > 0
      ? props.items
      : makeDefaultItems(totalSlots.value);

  if (source.length === totalSlots.value) {
    return source;
  }

  if (source.length > totalSlots.value) {
    return source.slice(0, totalSlots.value);
  }

  const padded = [...source];
  for (let i = source.length; i < totalSlots.value; i += 1) {
    padded.push({ title: `Tile ${i + 1}` });
  }
  return padded;
});

const totalRows = computed(() =>
  Math.max(1, props.rows ?? Math.ceil(resolvedItems.value.length / props.columns))
);

const baseMaxStage = computed(() => {
  if (props.revealBy === "column") return Math.max(1, props.columns);
  if (props.revealBy === "row") return totalRows.value;
  return resolvedItems.value.length;
});

const maxStage = computed(() => {
  if (
    props.revealMode === "stage"
    && props.revealGridAtOnce
    && props.zoomRevealAfterGrid
    && props.alternateColumnZoom
  ) {
    return 2;
  }

  if (props.revealMode === "stage" && props.revealGridAtOnce) {
    return 1;
  }

  if (
    props.revealMode === "stage"
    && props.alternateColumnZoom
    && props.zoomRevealAfterGrid
  ) {
    return baseMaxStage.value + 1;
  }

  return baseMaxStage.value;
});

const stage = useStage(maxStage.value, {
  presist: props.resetOnEnter ? false : "back",
});
const ready = ref(false);

onMounted(() => {
  if (props.revealMode === "auto") {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ready.value = true;
      });
    });
  }
});

function thresholdForIndex(index: number): number {
  if (props.revealBy === "item") return index + 1;
  if (props.revealBy === "row") return Math.floor(index / props.columns) + 1;
  return (index % props.columns) + 1;
}

function isVisible(index: number): boolean {
  if (props.revealMode === "all") return true;
  if (props.revealMode === "auto") return ready.value;

  if (props.revealGridAtOnce) {
    return stage.value >= 1;
  }

  return thresholdForIndex(index) <= Math.min(stage.value, baseMaxStage.value);
}

function tileStyle(index: number): CSSProperties {
  return {
    "--tile-delay": `${index * props.staggerMs}ms`,
  } as CSSProperties;
}

function rowIndex(index: number): number {
  return Math.floor(index / props.columns);
}

function columnIndex(index: number): number {
  return index % props.columns;
}

function rowStartIndex(index: number): number {
  return rowIndex(index) * props.columns;
}

function isSourceColumn(col: number): boolean {
  return props.zoomStartsOn === "odd" ? col % 2 === 0 : col % 2 === 1;
}

function isZoomColumn(col: number): boolean {
  return !isSourceColumn(col);
}

function sourceColumnFor(col: number): number {
  if (isSourceColumn(col)) {
    return col;
  }

  if (props.zoomStartsOn === "odd") {
    return Math.max(0, col - 1);
  }

  return Math.min(props.columns - 1, col + 1);
}

function pairIndexForSourceColumn(sourceCol: number): number {
  const base = props.zoomStartsOn === "odd" ? sourceCol : sourceCol - 1;
  return Math.max(0, Math.floor(base / 2));
}

function zoomSourceIndexFor(index: number): number {
  const rowStart = rowStartIndex(index);
  const sourceCol = sourceColumnFor(columnIndex(index));
  return rowStart + sourceCol;
}

function zoomBoxFor(index: number): ZoomBox {
  const sourceCol = sourceColumnFor(columnIndex(index));
  const pairIndex = pairIndexForSourceColumn(sourceCol);
  return props.zoomBoxes[pairIndex] ?? defaultZoomBox;
}

function zoomOffsetFor(index: number): RowZoomOffset {
  const r = rowIndex(index);
  const c = columnIndex(index);
  const cellOffset = props.zoomCellOffsets[r]?.[c];
  if (cellOffset) {
    return cellOffset;
  }

  return props.zoomRowOffsets[r] ?? { x: 0, y: 0 };
}

function shouldRenderZoom(index: number): boolean {
  if (!props.alternateColumnZoom) {
    return false;
  }

  const col = columnIndex(index);
  if (!isZoomColumn(col)) {
    return false;
  }

  const source = resolvedItems.value[zoomSourceIndexFor(index)];
  return !!source?.src;
}

function zoomPhaseActive(): boolean {
  if (!props.alternateColumnZoom) {
    return false;
  }

  if (!props.zoomRevealAfterGrid) {
    return true;
  }

  if (props.revealMode !== "stage") {
    return true;
  }

  const zoomRevealTriggerStage = props.revealGridAtOnce ? 1 : baseMaxStage.value;
  return stage.value > zoomRevealTriggerStage;
}

function shouldUseZoom(index: number): boolean {
  return shouldRenderZoom(index) && zoomPhaseActive();
}

function zoomSourceItem(index: number): GridItem | undefined {
  return resolvedItems.value[zoomSourceIndexFor(index)];
}

function shouldRenderZoomColumnAsSource(index: number): boolean {
  return shouldRenderZoom(index) && !zoomPhaseActive();
}

function shouldRenderStandardItem(index: number): boolean {
  return !shouldRenderZoom(index);
}

function shouldShowZoomOverlays(index: number): boolean {
  return zoomPhaseActive() && shouldRenderZoom(index);
}

function showZoomBox(index: number): boolean {
  if (!props.alternateColumnZoom || !props.showZoomBoxes || !zoomPhaseActive()) {
    return false;
  }

  if (props.zoomBoxRows && props.zoomBoxRows.length > 0) {
    const oneBasedRow = rowIndex(index) + 1;
    if (!props.zoomBoxRows.includes(oneBasedRow)) {
      return false;
    }
  }

  const col = columnIndex(index);
  if (!isSourceColumn(col)) {
    return false;
  }

  const hasNeighbor = props.zoomStartsOn === "odd"
    ? col + 1 < props.columns
    : col - 1 >= 0;

  return hasNeighbor;
}

function showDebugSourceBox(index: number): boolean {
  if (!props.showOffsetDebug || !props.alternateColumnZoom) {
    return false;
  }

  const col = columnIndex(index);
  if (!isSourceColumn(col)) {
    return false;
  }

  const hasNeighbor = props.zoomStartsOn === "odd"
    ? col + 1 < props.columns
    : col - 1 >= 0;

  return hasNeighbor;
}

function zoomBoxStyle(index: number): CSSProperties {
  const box = zoomBoxFor(index);
  const color = box.color ?? defaultZoomBox.color;
  return {
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
    border: props.zoomBoxBorder,
    borderColor: color,
    color,
    "--zoom-box-color": color,
  } as CSSProperties;
}

function isZoomFrameRow(oneBasedRow: number): boolean {
  if (!props.showZoomRowFrames) {
    return false;
  }

  if (props.zoomRowFrameRows && props.zoomRowFrameRows.length > 0) {
    return props.zoomRowFrameRows.includes(oneBasedRow);
  }

  if (props.highlightAlternateRows) {
    return props.highlightStartsOn === "odd"
      ? oneBasedRow % 2 === 1
      : oneBasedRow % 2 === 0;
  }

  return false;
}

const zoomFrameRows = computed(() =>
  Array.from({ length: totalRows.value }, (_, index) => index + 1).filter(
    (oneBasedRow) => isZoomFrameRow(oneBasedRow),
  ),
);

function isZoomFrameColumn(oneBasedColumn: number): boolean {
  if (!props.showZoomColumnFrames || !props.alternateColumnZoom) {
    return false;
  }

  if (props.zoomColumnFrameColumns && props.zoomColumnFrameColumns.length > 0) {
    return props.zoomColumnFrameColumns.includes(oneBasedColumn);
  }

  return isZoomColumn(oneBasedColumn - 1);
}

const zoomFrameColumns = computed(() =>
  Array.from({ length: props.columns }, (_, index) => index + 1).filter(
    (oneBasedColumn) => isZoomFrameColumn(oneBasedColumn),
  ),
);

function zoomRowFrameStyle(oneBasedRow: number): CSSProperties {
  const color =
    props.zoomRowFrameColors[oneBasedRow - 1]
    ?? props.zoomBoxes[0]?.color
    ?? defaultZoomBox.color;

  return {
    gridColumn: "1 / -1",
    gridRow: String(oneBasedRow),
    border: props.zoomRowFrameBorder,
    borderColor: color,
    color,
  } as CSSProperties;
}

function zoomColumnFrameStyle(oneBasedColumn: number): CSSProperties {
  const zeroBasedColumn = oneBasedColumn - 1;
  const sourceCol = sourceColumnFor(zeroBasedColumn);
  const pairIndex = pairIndexForSourceColumn(sourceCol);
  const color =
    props.zoomColumnFrameColors[oneBasedColumn - 1]
    ?? props.zoomBoxes[pairIndex]?.color
    ?? defaultZoomBox.color;

  return {
    gridColumn: String(oneBasedColumn),
    gridRow: "1 / -1",
    border: props.zoomColumnFrameBorder,
    borderColor: color,
    color,
  } as CSSProperties;
}

function zoomImageStyle(index: number): CSSProperties {
  const source = resolvedItems.value[zoomSourceIndexFor(index)];
  const box = zoomBoxFor(index);
  const offset = zoomOffsetFor(index);
  const fitScale = Math.min(100 / box.width, 100 / box.height);
  const effectiveScale = props.zoomFitBox ? props.zoomScale * fitScale : props.zoomScale;
  const centerX = box.x + box.width / 2 + (offset.x ?? 0);
  const centerY = box.y + box.height / 2 + (offset.y ?? 0);
  // With `translate(...) scale(s)`, scale is applied first. The translate value
  // must therefore include `s` so the chosen box center lands at tile center.
  const translateX = 50 - effectiveScale * centerX;
  const translateY = 50 - effectiveScale * centerY;

  return {
    transformOrigin: "top left",
    transform: `translate(${translateX}%, ${translateY}%) scale(${effectiveScale})`,
    objectFit: props.zoomObjectFit,
    backgroundImage: source?.src ? "none" : undefined,
  } as CSSProperties;
}

function zoomColumnImageStyle(index: number): CSSProperties {
  if (shouldUseZoom(index)) {
    return {
      ...zoomImageStyle(index),
      transition: `transform var(--tile-transition) cubic-bezier(0.2, 0.85, 0.2, 1)`,
    } as CSSProperties;
  }

  return {
    objectFit: props.objectFit,
    transition: `transform var(--tile-transition) cubic-bezier(0.2, 0.85, 0.2, 1)`,
    transformOrigin: "top left",
    transform: "translate(0%, 0%) scale(1)",
  } as CSSProperties;
}

function rowLabelStyle(rowIdx: number): CSSProperties {
  return {
    top: `${((rowIdx + 0.5) / totalRows.value) * 100}%`,
  } as CSSProperties;
}

function offsetDebugText(index: number): string {
  const row = rowIndex(index) + 1;
  const col = columnIndex(index) + 1;
  const offset = zoomOffsetFor(index);
  const x = Number(offset.x ?? 0).toFixed(props.offsetDebugPrecision);
  const y = Number(offset.y ?? 0).toFixed(props.offsetDebugPrecision);
  return `r${row} c${col}  x:${x} y:${y}`;
}

function isHighlightRow(index: number): boolean {
  if (!props.highlightAlternateRows) {
    return false;
  }

  const oneBasedRow = Math.floor(index / props.columns) + 1;
  return props.highlightStartsOn === "odd"
    ? oneBasedRow % 2 === 1
    : oneBasedRow % 2 === 0;
}

const rootStyle = computed(
  () =>
    ({
      "--grid-columns": String(props.columns),
      "--grid-rows": String(totalRows.value),
      "--grid-gap": props.gap,
      "--tile-aspect": props.tileAspectRatio,
      "--tile-radius": props.tileRadius,
      "--tile-border": props.tileBorder,
      "--tile-bg": props.tileBackground,
      "--tile-object-fit": props.objectFit,
      "--tile-transition": `${props.transitionMs}ms`,
      "--tile-offset-y": props.startOffsetY,
      "--tile-offset-x": props.startOffsetX,
      "--row-label-band": props.rowLabelBand,
    }) as CSSProperties
);
</script>

<template>
  <section class="results-grid-wrap" :style="rootStyle">
    <div v-if="label" class="results-grid-label">{{ label }}</div>

    <div class="results-grid-shell" :class="{ 'with-row-labels': showRowLabels }">
      <div v-if="showRowLabels" class="row-labels" aria-hidden="true">
        <div
          v-for="rowIdx in totalRows"
          :key="`row-label-${rowIdx}`"
          class="row-label"
          :style="rowLabelStyle(rowIdx - 1)"
        >
          {{ rowLabels[rowIdx - 1] ?? `Row ${rowIdx}` }}
        </div>
      </div>

      <div class="results-grid-stack">
        <div class="results-grid">
          <article
            v-for="(item, index) in resolvedItems"
            :key="`${item.src ?? 'placeholder'}-${index}`"
            class="result-tile"
            :class="{
              visible: isVisible(index),
              placeholder: !item.src,
              'highlight-row': isHighlightRow(index),
              'zoom-tile': shouldRenderZoom(index),
            }"
            :style="tileStyle(index)"
          >
            <img
              v-if="shouldRenderZoom(index)"
              class="result-image"
              :src="zoomSourceItem(index)?.src"
              :alt="zoomSourceItem(index)?.alt ?? `Zoom source ${index + 1}`"
              :style="zoomColumnImageStyle(index)"
            />
            <img
              v-else-if="shouldRenderStandardItem(index) && item.src"
              class="result-image"
              :src="item.src"
              :alt="item.alt ?? item.title ?? `Result ${index + 1}`"
            />
            <div v-else class="result-placeholder">{{ item.title ?? `Tile ${index + 1}` }}</div>

            <div v-if="showZoomBox(index)" class="zoom-box" :style="zoomBoxStyle(index)"></div>
            <div v-else-if="showDebugSourceBox(index)" class="zoom-box zoom-box-debug" :style="zoomBoxStyle(index)"></div>

            <div v-if="showOffsetDebug && shouldShowZoomOverlays(index)" class="offset-debug-pill">
              {{ offsetDebugText(index) }}
            </div>
            <div v-if="showOffsetDebug && shouldShowZoomOverlays(index)" class="offset-debug-crosshair" aria-hidden="true"></div>

            <div v-if="showCaptions && (item.title || item.subtitle)" class="result-caption">
              <p v-if="item.title" class="result-title">{{ item.title }}</p>
              <p v-if="item.subtitle" class="result-subtitle">{{ item.subtitle }}</p>
            </div>
          </article>
        </div>

        <div class="results-grid-overlay" aria-hidden="true">
          <div
            v-for="col in zoomFrameColumns"
            :key="`zoom-column-frame-${col}`"
            class="zoom-column-frame"
            :style="zoomColumnFrameStyle(col)"
          ></div>

          <div
            v-for="row in zoomFrameRows"
            :key="`zoom-row-frame-${row}`"
            class="zoom-row-frame"
            :style="zoomRowFrameStyle(row)"
          ></div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.results-grid-wrap {
  width: 100%;
}

.results-grid-label {
  margin-bottom: 0.65rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.035em;
  color: #cbd5e1;
}

.results-grid-shell {
  position: relative;
}

.results-grid-shell.with-row-labels {
  padding-left: var(--row-label-band);
}

.row-labels {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--row-label-band);
  pointer-events: none;
}

.row-label {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-90deg);
  transform-origin: center;
  white-space: nowrap;
  font-size: 0.64rem;
  font-weight: 700;
  color: #cbd5e1;
  letter-spacing: 0.03em;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));
  gap: var(--grid-gap);
}

.results-grid-stack {
  position: relative;
}

.results-grid-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));
  grid-template-rows: repeat(var(--grid-rows), minmax(0, 1fr));
  gap: var(--grid-gap);
  pointer-events: none;
  z-index: 4;
}

.result-tile {
  aspect-ratio: var(--tile-aspect);
  border-radius: var(--tile-radius);
  border: var(--tile-border);
  background: var(--tile-bg);
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate3d(var(--tile-offset-x), var(--tile-offset-y), 0) scale(0.95);
  opacity: 0;
  filter: blur(4px);
}

.result-tile.visible {
  transform: translate3d(0, 0, 0) scale(1);
  opacity: 1;
  filter: blur(0);
  transition:
    transform var(--tile-transition) cubic-bezier(0.2, 0.85, 0.2, 1),
    opacity var(--tile-transition) ease,
    filter var(--tile-transition) ease;
  transition-delay: var(--tile-delay);
}

.result-tile.highlight-row {
  border-color: color-mix(in srgb, #a3a3a3 60%, #94a3b8 40%);
  box-shadow: 0 0 0 1px color-mix(in srgb, #22d3ee 30%, transparent) inset;
}

.result-image {
  width: 100%;
  height: 100%;
  object-fit: var(--tile-object-fit);
  display: block;
  background: #020617;
}

.zoom-box {
  position: absolute;
  pointer-events: none;
}

.zoom-row-frame {
  pointer-events: none;
  border-radius: calc(var(--tile-radius) + 3px);
  margin: -1px;
  box-sizing: border-box;
  box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 22%, transparent);
}

.zoom-column-frame {
  pointer-events: none;
  border-radius: calc(var(--tile-radius) + 3px);
  margin: -1px;
  box-sizing: border-box;
  box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 22%, transparent);
}

.zoom-box-debug {
  border-style: dashed !important;
  border-width: 1px !important;
  opacity: 0.8;
}

.offset-debug-pill {
  position: absolute;
  left: 0.24rem;
  top: 0.24rem;
  font-size: 0.52rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #f8fafc;
  background: rgba(2, 6, 23, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.7);
  border-radius: 999px;
  padding: 0.12rem 0.35rem;
  z-index: 4;
  pointer-events: none;
}

.offset-debug-crosshair {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 12px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 3;
}

.offset-debug-crosshair::before,
.offset-debug-crosshair::after {
  content: "";
  position: absolute;
  background: rgba(248, 250, 252, 0.75);
}

.offset-debug-crosshair::before {
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  transform: translateX(-50%);
}

.offset-debug-crosshair::after {
  left: 0;
  top: 50%;
  width: 100%;
  height: 1px;
  transform: translateY(-50%);
}

.result-placeholder {
  font-size: 0.78rem;
  color: #94a3b8;
  font-weight: 600;
  text-align: center;
  padding: 0.5rem;
}

.result-caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(transparent, rgba(2, 6, 23, 0.9));
  padding: 0.65rem 0.5rem 0.45rem;
}

.result-title {
  margin: 0;
  font-size: 0.66rem;
  font-weight: 700;
  color: #e2e8f0;
}

.result-subtitle {
  margin: 0.16rem 0 0;
  font-size: 0.56rem;
  color: #94a3b8;
}

@media (max-width: 980px) {
  .results-grid-shell.with-row-labels {
    padding-left: 1.6rem;
  }

  .row-label {
    font-size: 0.56rem;
  }

  .results-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
