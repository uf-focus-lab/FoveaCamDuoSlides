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

<script setup lang="ts">
import kismet from "assets/inspiration/kismet.webp";

const items = [
  { caption: "Kismet — expressive robotic head, MIT (1998)" },
  { caption: "Kismet — expressive robotic head, MIT (1998)" },
  { caption: "Kismet — expressive robotic head, MIT (1998)" },
  { caption: "Kismet — expressive robotic head, MIT (1998)" },
  { caption: "Kismet — expressive robotic head, MIT (1998)" },
];
</script>

<div class="flex-1 min-h-0">
  <Gallery :items="items" loop />
</div>

---

# System Design - Overview

<script setup lang="ts">
import Overview from "assets/design-overview.svg";
</script>

<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
  <Overview style="overflow: hidden" />
</div>

---

# System Design - Technical Details

+ Section view of the camera

---

# Calibration - Setup

+ Design of the calibration platform
+ Marker arrangement
+ `TeleCanavs` subproject (contrast enhancement)

---

# Calibration - Extrinsic

+ How we mapped the voltages to pointing angles.

---

# Calibration - Extrinsic

+ How we used the corners of a marker to findout rectification matrices.

---

# Drift Problem & Correction

+ Translational drift from voltage instability, field correctable with tri-marker board.
+ Rotational drift from lack of structural rigidity, impacts both extrinsic and intrinsic calibration, mitigatable with metal structural components.

---

# <span style="color: red">New Results</span>: Multi-fovea Stereo Tracking

---

# Data Collection

+ Samples of the data collected by raster scan
+ Visualization of the data projected to the wide context view

---

# Convergent Stereo

+ Architectural Overview (animated flowchart)

---

# Depth Perception Results

+ Huge figure + animation

---

# <span style="color: red">New Results</span>: 3D/4D Scene Upgrade

---

# Thank You
