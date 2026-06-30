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

# Biological Inspiration <Eyes />

- Images of predators and their eyes (e.g., owl, cat, eagle, etc.)
- Crypsis analysis (animated simulation)

> Results up front

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

- Huge figure + animation

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
