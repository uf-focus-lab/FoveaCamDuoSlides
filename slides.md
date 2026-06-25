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
layout: two-cols
---

<script setup lang="ts">
import Overview from "assets/design-overview.svg";
import Eagle from "assets/eagle.svg";
import TradeOffChart from "pages/TradeOffChart.vue";
import { useStage } from "stores/stage";
const stage = useStage(4);
</script>

# The Fundamental Tradeoff

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
  <SVGArrow :start="[274, 70]" :end="[274, 45]" color="#22c55e" :visible="stage > 1" />
</svg>

</div>

</section>

::right::

<TradeOffChart :stage="stage" />

---

## layout: none

<script setup lang="ts">
import CameraTurntable from "components/CameraTurntable.vue";
</script>

<CameraTurntable />

---

# System Design - Technical Details

<script setup lang="ts">
import CrossSection from "assets/cross-section.svg";
</script>

<div class="tech-details">
  <CrossSection class="section-view" />

  <section class="key-parameters">
    <h2>Key Parameters</h2>
    <dl>
      <div>
        <dt>Left / right fovea</dt>
        <dd>100 mm focal length</dd>
      </div>
      <div>
        <dt>Fovea separation</dt>
        <dd>100 mm</dd>
      </div>
      <div>
        <dt>Center wide camera</dt>
        <dd>Approx. 12 mm focal length</dd>
      </div>
      <div>
        <dt>Steering</dt>
        <dd>MEMS mirror with frame sync</dd>
      </div>
      <div>
        <dt>Optical path</dt>
        <dd>Front lens / cover, static mirror, backend lens, image sensor</dd>
      </div>
    </dl>
  </section>
</div>

<style scoped lang="scss">
.tech-details {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 36px;
  align-items: center;
  height: calc(100% - 90px);
  margin-top: 12px;
}

.section-view {
  width: 100%;
  max-height: 100%;
  color: currentColor;
}

.key-parameters {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.key-parameters h2 {
  margin: 0 0 18px;
  font-size: 1.35rem;
  font-weight: 650;
}

.key-parameters dl {
  display: grid;
  gap: 0;
  margin: 0;
}

.key-parameters div {
  padding: 14px 0;
  border-top: 1px solid color-mix(in srgb, currentColor 22%, transparent);
}

.key-parameters div:last-child {
  border-bottom: 1px solid color-mix(in srgb, currentColor 22%, transparent);
}

.key-parameters dt {
  margin-bottom: 4px;
  font-size: 0.76rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.62;
}

.key-parameters dd {
  margin: 0;
  font-size: 1.08rem;
  line-height: 1.25;
}
</style>

---

# Calibration - Setup

- Design of the calibration platform
- Marker arrangement
- `TeleCanavs` subproject (contrast enhancement)

---

# Calibration - Extrinsic

- How we mapped the voltages to pointing angles.

---

# Calibration - Intrinsic

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
