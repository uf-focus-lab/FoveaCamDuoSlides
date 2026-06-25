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

# Traditional Stereo

<div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; align-items: start; margin-top: 1.25rem;">
  <div>
    <div style="width: 75%; height: 120px; margin: 0 auto; overflow: hidden; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);">
      <img
        src="/assets/traditional-stereo/disparity_explanation.webp"
        alt="Disparity-to-depth explanation"
        style="width: 115%; height: 115%; object-fit: cover; object-position: 80% 160%;"
      />
    </div>
  </div>
  <div>
    <p style="margin-top: 0;">
      Traditional stereo uses static camera poses with approximately parallel viewing directions.
    </p>
    <p>
      With calibrated geometry, disparity can be mapped to depth reliably, which makes robust depth models easier to build.
    </p>
  </div>
</div>

<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10rem; margin-top: 6rem;">
  <div style="aspect-ratio: 1 / 1; border: 2px solid #d6d9df; border-radius: 14px; padding: 0.75rem; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fafbfc;">
    <img
      src="/assets/traditional-stereo/nvidia.webp"
      alt="NVIDIA logo"
      style="max-width: 80%; max-height: 58%; object-fit: contain;"
    />
    <p style="margin: 0.7rem 0 0; font-size: 0.95rem; font-weight: 600; text-align: center;  color: #6b7280">Foundation Stereo</p>
  </div>
  <div style="aspect-ratio: 1 / 1; border: 2px dashed #d6d9df; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-weight: 600; background: #fafbfc;">
    Box 2
  </div>
  <div style="aspect-ratio: 1 / 1; border: 2px dashed #d6d9df; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-weight: 600; background: #fafbfc;">
    Box 3
  </div>
</div>


<!--
Traditional Stereo has static camera poses, and cameras facing parallel.

Makes it extremely easy to convert disparity into depth, it's easier to create robust models when these are known.
-->

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

<!--
With the creation of foundation models for traditional stereo, getting depth from a wide range of applications has become easy. 

However, despite these models, there's still a fundamental weakness of triangulation when the objects of interest get further away. 

If the object is far enough that it doesn't have any disparity, the information isn't there for a foundation model to recover.
-->

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

<!-- - Samples of the data collected by raster scan
- Visualization of the data projected to the wide context view -->

<script setup lang="ts">
import DataCollection from "components/DataCollection.vue";
</script>

<div style="margin-top: 1.25rem; width: 100%;">
  <DataCollection />
</div>

---

<script setup lang="ts">
import ConvergentStereoAnimation from "components/ConvergentStereoAnimation.vue";
</script>

# Convergent Stereo

<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 1rem;">
  <ConvergentStereoAnimation :delay="500" />
</div>

---

# Depth Perception Results

- Huge figure + animation

---

# <span style="color: red">New Results</span>: 3D/4D Scene Upgrade

---

# Thank You
