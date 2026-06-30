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

# Biological Inspiration
<script setup lang="ts">
import BiologicalInspiration from "pages/02-biological-inspiration.vue";
</script>

<BiologicalInspiration />

<!--
What are cameras if not emulations of the eyes? As an optics lab, we care alot about what there is to learn from biological optics. Evolution rarely creats systems without purpose. 
Eyes are extremely complex systems with too many revolving parts to completely understand, but eye systems are designed for a purpose with strengths and weaknesses. 
-->
--- 

<script setup lang="ts">
import StereoFoveationCrypsis from "pages/02B-stereo-foveation-crypsis.vue";
</script>

# Stereo, Foveation, and Crypsis

<StereoFoveationCrypsis />

---

# Stereo Geometry

<script setup lang="ts">
import { useStage } from "stores/stage";
import GeometryMath from "pages/03-geometery.md";
import GeometryChart from "pages/03-geometry.vue";
const stage = useStage(5, { preview: -1 }).transient(4, 600);
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
import OurSolutionPoints from "pages/04A-our-solution-points.vue";
import OurSolutionDiagram from "pages/04B-our-solution-diagram.vue";
import { useStage } from "stores/stage";
const stage = useStage(7, { preview: -1 }).transient([2, 4, 6]);
const diagramStage = computed(() => Math.ceil(stage.value / 2))
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
import CameraTurntable from "pages/05-camera-turntable.vue";
</script>

<CameraTurntable />

---

# System Design - Technical Details

<script setup lang="ts">
import TechnicalDetails from "pages/06-technical-details.vue";
</script>

<TechnicalDetails />

---

# Calibration - Setup

<script setup lang="ts">
import CalibrationSetup from "pages/07-calibration-setup.vue";
</script>

<CalibrationSetup />

---
layout: none
title: Calibration - Process
---

<script setup lang="ts">
import CalibrationProcess from "pages/08-calibration-process.vue";
</script>

<CalibrationProcess />

---

# Calibration - Extrinsic

<script setup lang="ts">
import CalibrationExtrinsic from "pages/09-calibration-extrinsic.vue";
</script>

<CalibrationExtrinsic />

---

# Calibration - Intrinsic

<script setup lang="ts">
import CalibrationIntrinsic from "pages/10-calibration-intrinsic.vue";
</script>

<CalibrationIntrinsic />

---

<script setup lang="ts">
import DriftProblem from "pages/11-drift.vue";
</script>

<DriftProblem />

---

# <span style="color: red">New Results</span>: Multi-fovea Stereo Tracking

---

# Data Collection

<!-- - Samples of the data collected by raster scan
- Visualization of the data projected to the wide context view -->

<script setup lang="ts">
import DataCollection from "pages/13-data-collection.vue";
</script>

<div style="margin-top: 1.25rem; width: 100%;">
  <DataCollection />
</div>

---

<script setup lang="ts">
import ConvergentStereoAnimation from "pages/14-convergent-stereo.vue";
</script>

# Convergent Stereo

<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 1rem;">
  <ConvergentStereoAnimation :delay="500" />
</div>

---

# Depth Perception Results

<script setup lang="ts">
import AnimatedResultsGrid from "components/AnimatedResultsGrid.vue";

const rowA = [
  "/assets/depth-results/left/22.webp",
  "",
  "/assets/depth-results/left/37.webp",
  "",
  "/assets/depth-results/left/55.webp",
  "",
  "/assets/depth-results/left/09.webp",
  "",
];

const rowAHighlight = [
  "/assets/depth-results/right/22.webp",
  "",
  "/assets/depth-results/right/37.webp",
  "",
  "/assets/depth-results/right/55.webp",
  "",
  "/assets/depth-results/right/09.webp",
  "",
];

const rowB = [
  "/assets/depth-results/prior/22_prior.webp",
  "",
  "/assets/depth-results/prior/37_prior.webp",
  "",
  "/assets/depth-results/prior/55_prior.webp",
  "",
  "/assets/depth-results/prior/09_prior.webp",
  "",
];

const rowBHighlight = [
  "/assets/depth-results/wide_stereo/22.webp",
  "",
  "/assets/depth-results/wide_stereo/37.webp",
  "",
  "/assets/depth-results/wide_stereo/55.webp",
  "",
  "/assets/depth-results/wide_stereo/09.webp",
  "",
];

const rowC = [
  "/assets/depth-results/disp/22_disparity.webp",
  "",
  "/assets/depth-results/disp/37_disparity.webp",
  "",
  "/assets/depth-results/disp/55_disparity.webp",
  "",
  "/assets/depth-results/disp/09_disparity.webp",
  "",
];

const zoomBoxes = [
  { x: 67, y: 69, width: 20, height: 20, color: "#ef4444" },
  { x: 40, y: 4, width: 20, height: 20, color: "#22c55e" },
  { x: 42, y: 15, width: 20, height: 20, color: "#38bdf8" },
  { x: 13, y: 10, width: 18, height: 18, color: "#d946ef" },
];

const zoomCellOffsets = [
  [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
  [{ x: 1, y: -1 }, { x: 0, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
  [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 0 }],
  [{ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 0 }],
  [{ x: 100, y: 0 }, { x: -3, y: -2 }, { x: -1, y: 0 }, { x: 0, y: 3 }, { x: 0, y: 1 }, { x: -2, y: 7 }, { x: 1, y: 0 }, { x: -5, y: -3 }],
];

const rowLabels = [
  "Left Fovea",
  "Right Fovea",
  "Monofovea",
  "Wide Stereo",
  "Ours",
];
const zoomRowFrameColors = [
  "",
  "#ef4444",
  "",
  "#22c55e",
  "",
];

const zoomColumnFrameColors = [
  "",
  "#ef4444",
  "",
  "#22c55e",
  "",
  "#38bdf8",
  "",
  "#d946ef",
];

const depthItems = [...rowA, ...rowAHighlight, ...rowB, ...rowBHighlight, ...rowC].map(
  (src, index) => ({ src: src || undefined, alt: `Depth grid sample ${index + 1}` }),
);
</script>

<AnimatedResultsGrid
  :items="depthItems"
  :columns="8"
  :rows="5"
  tile-aspect-ratio="4 / 3"
  gap="0.18rem"
  reveal-mode="stage"
  reveal-by="row"
  :reveal-grid-at-once="true"
  :highlight-alternate-rows="true"
  highlight-starts-on="even"
  :stagger-ms="20"
  :transition-ms="300"
  start-offset-y="10px"
  tile-radius="2px"
  tile-border="1px solid rgba(148, 163, 184, 0.55)"
  object-fit="cover"
  :alternate-column-zoom="true"
  :zoom-reveal-after-grid="true"
  zoom-starts-on="odd"
  :zoom-boxes="zoomBoxes"
  :zoom-cell-offsets="zoomCellOffsets"
  :zoom-scale="1.05"
  :zoom-fit-box="true"
  :show-zoom-boxes="true"
  :zoom-box-rows="[1]"
  :show-zoom-row-frames="false"
  :show-zoom-column-frames="true"
  :zoom-column-frame-columns="[2, 4, 6, 8]"
  :zoom-column-frame-colors="zoomColumnFrameColors"
  zoom-column-frame-border="3px solid currentColor"
  :show-offset-debug="false"
  :show-row-labels="true"
  :row-labels="rowLabels"
  row-label-band="2.1rem"
  zoom-box-border="2px solid currentColor"
  label=""
/>

---
layout: two-cols
---

::left::

# Recap

+ **Design**

  FoveaCam Duo delivers high-resolution foveated stereo with prephial awareness. 

+ **Calibration**

  The pipeline ensure precise extrinsic and intrinsic mapping.

+ **Dataset**

  Automated data collection delivers large amount of raster samples.

+ **Convergent Stereo**

  validates disparity signal embedded in foveated views.

::right::

# Next Steps

+ **Decision**

  Where to put foveas for most information.

+ **Aggregation**

  How to merge information back into wide prepherial.

---

# <span style="color: red">New Results</span>: 3D/4D Scene Upgrade

---

# Thank You
