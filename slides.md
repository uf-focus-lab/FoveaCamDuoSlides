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

## layout: two-cols

<script setup lang="ts">
import Overview from "assets/design-overview.svg";
import { useStage } from "stores/stage";

// Intra-slide stage, advanced with Left/Right arrows. Stage 2 reveals the
// ΔZ / d arrows (added later).
const stage = useStage(2);
</script>

# The Foundamental Tradeoff

<style scoped lang="scss">
section.math {
  font-size: 1.5rem;
  text-align: center;
  margin: 60px 0;
  padding: 20px;
  border: 2px solid #888;
  border-radius: 40px;
}
.eq {
  position: relative;
}
.eq .arrows {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
</style>

::left::

<section class="math">

Depth $Z$ from disparity $d$ (px):

$$Z=\frac{f \cdot b}{d} ~,\quad \frac{\delta Z}{\delta d} = \frac{f \cdot b}{d^2}$$

Depth <b><i>resolution</i></b> $\Delta Z$ per pixel step:

<div class="eq">

$$
\Delta Z ~=~ \frac{f \cdot b}{d^2} ~=~ \frac{Z ^ 2}{f \cdot b}
$$

<svg class="arrows">
  <SVGArrow :start="[122, 20]" :end="[122, 45]" color="#ef4444" :visible="stage > 1" />
  <SVGArrow :start="[344, 65]" :end="[344, 40]" color="#22c55e" :visible="stage > 1" />
</svg>

</div>

</section>

::right::

<div style="width: 100%; height: 100%; position: relative;">
  <Overview style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; height: auto;" />
</div>

---

## layout: none

<script setup lang="ts">
import CameraTurntable from "components/CameraTurntable.vue";
</script>

<CameraTurntable />

---

# System Design - Technical Details

- Section view of the camera

---

# Calibration - Setup

- Design of the calibration platform
- Marker arrangement
- `TeleCanavs` subproject (contrast enhancement)

---

# Calibration - Extrinsic

- How we mapped the voltages to pointing angles.

---

# Calibration - Extrinsic

- How we used the corners of a marker to findout rectification matrices.

---

# Drift Problem & Correction

- Translational drift from voltage instability, field correctable with tri-marker board.
- Rotational drift from lack of structural rigidity, impacts both extrinsic and intrinsic calibration, mitigatable with metal structural components.

---

# <span style="color: red">New Results</span>: Multi-fovea Stereo Tracking

---

# Data Collection

- Samples of the data collected by raster scan
- Visualization of the data projected to the wide context view

---

# Convergent Stereo

- Architectural Overview (animated flowchart)

---

# Depth Perception Results

- Huge figure + animation

---

# <span style="color: red">New Results</span>: 3D/4D Scene Upgrade

---

# Thank You
