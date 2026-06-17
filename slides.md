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
<!--
One-line hook: dense depth at standoff ranges by *redistributing* resolution — a wide context camera plus two MEMS-steered telephoto foveae.
-->

---

# Biological Inspiration <Eyes />

<script setup lang="ts">
import kismet from "assets/inspiration/kismet.webp";
</script>

<div class="examples">
<img :src="kismet" alt="Kismet" />
</div>

<style scoped lang="scss">
.examples {
  height: 300px;
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  align-items: center;
  & > * {
    height: 100%;
    object-fit: contain;
    border-radius: 40px;
    outline: 2px solid var(--fc-fg);
    &:hover {
      outline-color: #08f;
    }
  }
}
</style>
