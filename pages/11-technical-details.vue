<script setup lang="ts">
import CrossSection from "assets/cross-section.svg";
</script>

<template>
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
</template>

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
