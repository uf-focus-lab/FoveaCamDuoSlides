---
theme: none
title: "FoveaCam Duo: Foveated Stereo for Standoff Depth Sensing"
info: |
  ## FoveaCam Duo — Foveated Stereo for Standoff Depth Sensing
  ICCP 2026 · FOCUS Lab, University of Florida.
drawings:
  persist: false
transition: slide-up
comark: true
duration: 20min
layout: none
---

<script setup lang="ts">
import Cover from "pages/01-cover.vue";
</script>

<Cover />

---

# How Nature Engineers Vision
<script setup lang="ts">
import BiologicalInspiration from "pages/02-biological-inspiration.vue";
</script>

<BiologicalInspiration />

<!--

In our work, we focus on redesigning sensors and cameras for new functions. To discover what new functions are possible, we look at biological systems. Evolution has produced a wide range of eyes, suited for different environments and different purposes, and there's a lot to learn from these biological systems when creating mechanical systems.
-->

--- 

<script setup lang="ts">
import StereoFoveationCrypsis from "pages/03-stereo-foveation-crypsis.vue";
</script>

# Stereo and Foveation

<StereoFoveationCrypsis />

---

# Related Work

<script setup lang="ts">
import RelatedWork from "pages/04-related-work.vue";
</script>

<RelatedWork />


---

# Engineering Foveation

<script setup lang="ts">
import MechanicalChallenges from "pages/05-mechanical-challenges.vue";
</script>

<MechanicalChallenges />

---

<script setup lang="ts">
import PreviewFovealTracking from "pages/06-preview-foveal-tracking.vue";
</script>

<div style="width: 100%; height: 100%;">
  <PreviewFovealTracking />
</div>

---

# Crypsis

<script setup lang="ts">
import CrypsisSimulation from "pages/07-crypsis-simulation.vue";
</script>

<CrypsisSimulation />

---

# Stereo Geometry

<script setup lang="ts">
import { useStage } from "stores/stage";
import GeometryMath from "pages/08A-geometry-math.vue";
import GeometryChart from "pages/08-geometry.vue";
const stage = useStage(11, { preview: -1 }).transient([1, 3, 5, 7, 9]);
</script>

<GeometryMath :stage="stage" />

<GeometryChart :stage="stage" style="position: absolute; top: 50%; left: 50%; transform: translate(calc(-50% + 240px), -50%);" />

<!--
Traditional Stereo has static camera poses, and cameras facing parallel.

Makes it extremely easy to convert disparity into depth, it's easier to create robust models when these are known.

+ Stereo geometry gives the inverse relationship between depth $Z$ and disparity $d$.
+ Depth resolution degrades quadratically with distance $Z$.
+ $Z$ resolution can be imporoved by increasing angular resolution.
-->

---
layout: two-cols
---

<script setup lang="ts">
import { computed } from "vue";
import OurSolutionPoints from "pages/09A-our-solution-points.vue";
import OurSolutionDiagram from "pages/09B-our-solution-diagram.vue";
import { useStage } from "stores/stage";
const stage = useStage(9, { preview: -1 }).transient([2, 4, 6]);
const diagramStage = computed(() => Math.min(4, Math.ceil(stage.value / 2)));
</script>

# Our Solution

::left::

<OurSolutionPoints :stage="stage" />

::right::

<OurSolutionDiagram :stage="diagramStage" />

<!--
With the creation of foundation models for traditional stereo, getting depth from a wide range of applications has become easy.

However, despite these models, there's still a fundamental weakness of triangulation when the objects of interest get further away.

If the object is far enough that it doesn't have any disparity, the information isn't there for a foundation model to recover.
-->

---
layout: none
---

<script setup lang="ts">
import CameraTurntable from "pages/10-camera-turntable.vue";
</script>

<CameraTurntable />

---

# System Design - Technical Details

<script setup lang="ts">
import TechnicalDetails from "pages/11-technical-details.vue";
</script>

<TechnicalDetails />

---

# Calibration - Setup

<script setup lang="ts">
import CalibrationSetup from "pages/12-calibration-setup.vue";
</script>

<CalibrationSetup />

---
layout: none
title: Calibration - Process
---

<script setup lang="ts">
import CalibrationProcess from "pages/13-calibration-process.vue";
</script>

<CalibrationProcess />

---

# Calibration - Reprojection Error



---

# <span style="color: red">New Results</span>: Multi-fovea Stereo Tracking

---

<!-- - Samples of the data collected by raster scan
- Visualization of the data projected to the wide context view -->

<script setup lang="ts">
import DataCollection from "pages/16-data-collection.vue";
</script>

<DataCollection />

---

<script setup lang="ts">
import ConvergentStereoAnimation from "pages/17-convergent-stereo.vue";
</script>

# Convergent Stereo

<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 1rem;">
  <ConvergentStereoAnimation :delay="500" />
</div>

--- 

# Example Walkthrough

<script setup lang="ts">
import ExampleWalkthrough from "pages/18-example-walkthrough.vue";
</script>

<div style="width: 100%; margin-top: 0.5rem;">
  <ExampleWalkthrough />
</div>

---

# Depth Perception Results

<script setup lang="ts">
import AnimatedResultsGrid from "components/AnimatedResultsGrid.vue";

const assetUrls = import.meta.glob(
  "./assets/depth-results/**/*.webp",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;


const asset = (name: string) => assetUrls[`./assets/depth-results/${name}`] ?? "";

const rowA = [
  asset("left/22.webp"),
  "",
  asset("left/37.webp"),
  "",
  asset("left/55.webp"),
  "",
  asset("left/09.webp"),
  "",
];

const rowAHighlight = [
  asset("right/22.webp"),
  "",
  asset("right/37.webp"),
  "",
  asset("right/55.webp"),
  "",
  asset("right/09.webp"),
  "",
];

const rowB = [
  asset("prior/22_prior.webp"),
  "",
  asset("prior/37_prior.webp"),
  "",
  asset("prior/55_prior.webp"),
  "",
  asset("prior/09_prior.webp"),
  "",
];

const rowBHighlight = [
  asset("wide_stereo/22.webp"),
  "",
  asset("wide_stereo/37.webp"),
  "",
  asset("wide_stereo/55.webp"),
  "",
  asset("wide_stereo/09.webp"),
  "",
];

const rowC = [
  asset("disp/22_disparity.webp"),
  "",
  asset("disp/37_disparity.webp"),
  "",
  asset("disp/55_disparity.webp"),
  "",
  asset("disp/09_disparity.webp"),
  "",
];

const zoomBoxes = [
  { x: 67, y: 69, width: 20, height: 20, color: "#ef4444" },
  { x: 40, y: 4, width: 20, height: 20, color: "#22c55e" },
  { x: 42, y: 15, width: 20, height: 20, color: "#38bdf8" },
  { x: 13, y: 10, width: 18, height: 18, color: "#d946ef" },
];

const columnLabels = [
  "Fovea",
  "Monocular",
  "Wide Stereo",
  "Ours",
];

const columnLabelSpans = [2, 1, 1, 1];

const zoomCellOffsets = [
  [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
  [{ x: 1, y: -1 }, { x: 0, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 0 }, { x: 0, y: 5 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
  [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 0 }],
  [{ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 5 }, { x: 3, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 0 }],
  [{ x: 100, y: 0 }, { x: -3, y: -2 }, { x: -1, y: 0 }, { x: 0, y: 3 }, { x: 0, y: 1 }, { x: -2, y: 7 }, { x: 1, y: 0 }, { x: -5, y: -3 }],
];

const depthItems = [...rowA, ...rowAHighlight, ...rowB, ...rowBHighlight, ...rowC].map(
  (src, index) => ({ src: src || undefined, alt: `Depth grid sample ${index + 1}` }),
);
</script>

<div style="transform: scale(0.75); transform-origin: top center; width: 100%; margin-top: 0.35rem;">
  <AnimatedResultsGrid
    :items="depthItems"
    :columns="8"
    :rows="5"
    tile-aspect-ratio="4 / 3"f
    gap="0.18rem"
    reveal-mode="stage"
    :reveal-grid-at-once="true"
    :zoom-reveal-after-grid="true"
    tile-radius="2px"
    tile-border="1px solid rgba(148, 163, 184, 0.55)"
    object-fit="cover"
    :alternate-column-zoom="true"
    zoom-starts-on="odd"
    :zoom-boxes="zoomBoxes"
    :zoom-cell-offsets="zoomCellOffsets"
    :zoom-scale="1.05"
    :zoom-fit-box="true"
    :show-zoom-only="true"
    :show-column-labels="true"
    :column-labels="columnLabels"
    :column-label-spans="columnLabelSpans"
    label=""
  />
</div>

---

# Depth Photometric Error

<div style="width: 100%; margin-top: 0.45rem;">
  <DepthPhotometricErrorTable />
</div>

---

# Lip Reading

<script setup lang="ts">
import LipReadingPreview from "pages/21-lip-reading-preview.vue";
</script>

<div style="width: 100%; height: calc(100% - 5rem); margin-top: 0.75rem;">
  <LipReadingPreview />
</div>
--- 

# Recap

<div style="width: 100%; margin: 0.25rem auto 0;">
  <RecapTiles :crypsis-zoom="3" :crypsis-center-x="65" :crypsis-center-y="55" />
</div>


<!-- ---  -->

<!-- # Thank You
 -->

---

# Calibration - Extrinsic

<script setup lang="ts">
import CalibrationExtrinsic from "pages/B1-calibration-extrinsic.vue";
</script>

<CalibrationExtrinsic />

---

# Calibration - Intrinsic

<script setup lang="ts">
import CalibrationIntrinsic from "pages/B2-calibration-intrinsic.vue";
</script>

<CalibrationIntrinsic />

---

# Calibration Drift - Translational

<script setup lang="ts">
import { useStage } from "stores/stage";
import DriftTranslational from "pages/B3-drift-translational.vue";
const stage = useStage(5, { preview: -1 });
</script>

<div style="height: calc(100% - 72px);">
  <DriftTranslational :stage="stage" />
</div>

---

# Calibration Drift - Rotational

<script setup lang="ts">
import { useStage } from "stores/stage";
import DriftRotational from "pages/B4-drift-rotational.vue";
const stage = useStage(7, { preview: -1 });
</script>

<div style="height: calc(100% - 72px);">
  <DriftRotational :stage="stage" />
</div>