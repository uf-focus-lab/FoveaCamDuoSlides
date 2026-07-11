<template>
  <section class="preview-grid" aria-label="Three camera preview panels">
    <article class="panel">
      <div class="panel-video" aria-hidden="true">
        <div class="scanline" />
      </div>
      <p class="panel-label">left fovea</p>
    </article>

    <article class="panel">
      <div class="panel-video" aria-hidden="true">
        <div class="scanline" />
      </div>
      <p class="panel-label">wide angle</p>
    </article>

    <article class="panel">
      <div class="panel-video" aria-hidden="true">
        <div class="scanline" />
      </div>
      <p class="panel-label">right fovea</p>
    </article>
  </section>
</template>

<style scoped>
.preview-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  align-items: stretch;
}

.panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.panel-video {
  position: relative;
  flex: 1;
  min-height: 10rem;
  border-radius: 0.75rem;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  background:
    radial-gradient(circle at 28% 28%, rgb(148 163 184 / 0.22), transparent 42%),
    linear-gradient(165deg, #0b1625, #16263d 55%, #0a1422);
  overflow: hidden;
}

.scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    rgb(255 255 255 / 0.04) 0,
    rgb(255 255 255 / 0.04) 2px,
    transparent 2px,
    transparent 7px
  );
}

.panel-label {
  margin: 0;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: lowercase;
  color: color-mix(in srgb, currentColor 82%, white);
}
</style>
