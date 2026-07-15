<script setup lang="ts">
import { ref } from "vue";
// The submodule's dialog list (simulation controls + per-target/obstacle
// entries). Its contents come from the Dialog registry, populated by
// `Dialog.provide(sim)` in pages/07 — so no props are needed here.
import Dialogs from "../crypsis-simulation/components/dialog/index.vue";

const open = ref(false);
</script>

<template>
  <div class="crypsis-controls" :class="{ open }">
    <button
      class="fold-toggle"
      type="button"
      :aria-expanded="open"
      :title="open ? 'Hide controls' : 'Show controls'"
      @click="open = !open"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M15 5l-7 7 7 7"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <div v-show="open" class="controls-panel">
      <Dialogs />
    </div>
  </div>
</template>

<style scoped>
/* Spans the whole slide but only captures pointer events on the button and the
   open panel. The panel sits on the LEFT half (opposite the world canvas) so it
   never covers the simulation, while the toggle sits at the top-left of the
   RIGHT half. Controls are a dark-paneled overlay, so `--color` is a fixed light
   value rather than the deck foreground. */
.crypsis-controls {
  --color: #eaf1ff;
  position: absolute;
  inset: 0;
  z-index: 10;
  color: var(--color);
  pointer-events: none;
}

/* Toggle at the top-left corner of the right (simulation) half; invisible until
   hovered or open. */
.fold-toggle {
  pointer-events: auto;
  position: absolute;
  top: 0.45em;
  left: calc(50% + 0.45em);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2em;
  height: 2em;
  padding: 0;
  border: none;
  border-radius: 0.45em;
  background: color-mix(in srgb, var(--fc-bg, #0a1420) 72%, transparent);
  color: var(--color);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.2s ease,
    background-color 0.2s ease;
}
.fold-toggle:hover,
.fold-toggle:focus-visible,
.crypsis-controls.open .fold-toggle {
  opacity: 1;
}
.fold-toggle svg {
  transition: transform 0.2s ease;
}
.crypsis-controls.open .fold-toggle svg {
  transform: rotate(180deg);
}

/* Left half, opaque so the equations behind don't bleed through when open. The
   small font-size shrinks the whole (em-sized) dialog list. */
.controls-panel {
  pointer-events: auto;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 50%;
  font-size: 0.5em;
  background: var(--fc-bg, #0a1420);
}

/* Fill the left-half panel instead of the submodule's default right-docked box. */
.crypsis-controls :deep(.dialog-container) {
  position: absolute;
  inset: 0;
  left: 0;
  right: auto;
  width: 100%;
  padding: 0.8em;
}

/* Global utility classes the dialog markup relies on (originally in the app's
   index.html), reproduced scoped so they don't leak into the deck. */
.crypsis-controls :deep(.mono) {
  font-family: "Cascadia Code", "Courier New", Courier, monospace;
}
.crypsis-controls :deep(.button) {
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
.crypsis-controls :deep(.button:hover) {
  background-color: color-mix(in srgb, currentColor 12%, transparent);
}
.crypsis-controls :deep(.button > svg) {
  transform: scale(1.2);
}
.crypsis-controls :deep(.icon path) {
  fill: currentColor !important;
}
.crypsis-controls :deep(input:not([type])),
.crypsis-controls :deep(input[type="text"]) {
  border: none;
  background-color: transparent;
  color: var(--color);
  font-size: 1em;
  padding: 0;
  outline: none;
  font-family: unset;
}
</style>
