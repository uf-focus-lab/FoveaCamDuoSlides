<script setup lang="ts">
// The simulation is embedded via a thin shim (pages/07C) that mounts only the
// submodule's world canvas + controls overlay — not its standalone app shell.
// See AGENTS.md → "Crypsis Simulation".
import CrypsisWorld from "./07C-crypsis-world.vue";

const props = withDefaults(
  defineProps<{
    stage: number;
    left?: string;
  }>(),
  {
    left: "50%",
  },
);
</script>

<template>
  <div class="frame-shell" :style="{ '--frame-left': props.left }">
    <div class="crypsis-app grow-feasible-region">
      <CrypsisWorld />
    </div>
  </div>
</template>

<style scoped>
.frame-shell {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: var(--frame-left, 50%);
  border: none;
  overflow: hidden;
}

/*
 * Themed host for the embedded simulation. `--color` is the app's single text/
 * icon color token (it was hardcoded to `white` in the standalone index.html);
 * binding it to the deck's foreground is the first step of matching this
 * project's colorscheme. Finer per-surface recoloring (header, badges, logo
 * gradient) is left for follow-up customization.
 */
.crypsis-app {
  --color: var(--fc-fg, #fff);
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--color);
  background: var(--fc-bg, #0a1420);
  font-family: inherit;
  user-select: none;
}

/* Global utility classes the app's components rely on, reproduced here (they
   previously lived in the standalone index.html <style>) and scoped to the host
   so they don't leak into the deck. */
.crypsis-app :deep(.mono) {
  font-family: "Cascadia Code", "Courier New", Courier, monospace;
}

.crypsis-app :deep(.reactive:hover) {
  background-color: color-mix(in srgb, currentColor 8%, transparent);
}
.crypsis-app :deep(.reactive:active) {
  background-color: color-mix(in srgb, currentColor 14%, transparent);
}

.crypsis-app :deep(.button) {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  margin: 0;
  padding: 0.6em 0.4em;
  cursor: pointer;
  background-color: transparent;
  border: none;
  outline: none;
}
.crypsis-app :deep(.button:hover) {
  background-color: color-mix(in srgb, currentColor 8%, transparent);
}
.crypsis-app :deep(.button:active) {
  background-color: color-mix(in srgb, currentColor 14%, transparent);
}
.crypsis-app :deep(.button > svg) {
  transform: scale(1.2);
}

.crypsis-app :deep(.icon path) {
  fill: var(--color) !important;
}
.crypsis-app :deep(.icon.bold path) {
  stroke-width: 0.4 !important;
  stroke: var(--color) !important;
}

.crypsis-app :deep(.invisible-scrollbar) {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.crypsis-app :deep(.invisible-scrollbar::-webkit-scrollbar) {
  display: none;
}

.crypsis-app :deep(input:not([type])),
.crypsis-app :deep(input[type="text"]) {
  border: none;
  background-color: transparent;
  color: var(--color);
  font-size: 1em;
  padding: 0;
  outline: none;
  font-family: unset;
}

.crypsis-app :deep(.underline) {
  padding-top: 0.2em;
  padding-bottom: 0.2em;
  border-top: 2px solid transparent;
  border-bottom: 2px solid transparent;
}
.crypsis-app :deep(.underline:focus),
.crypsis-app :deep(.underline:focus-within) {
  border-bottom: 2px solid color-mix(in srgb, currentColor 60%, transparent);
}

/* Stage-driven feasible-region reveal, formerly injected into the iframe
   document; now a scoped rule piercing into the embedded app. */
.crypsis-app :deep(svg.simulation-world .annotations.feasible-regions) {
  clip-path: circle(6% at 50% 50%);
  transition: clip-path 900ms var(--transition-curve, ease-in-out);
}
.crypsis-app.grow-feasible-region
  :deep(svg.simulation-world .annotations.feasible-regions) {
  clip-path: circle(46% at 50% 50%);
}
</style>
