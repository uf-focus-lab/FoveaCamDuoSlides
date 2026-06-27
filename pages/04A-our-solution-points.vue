<script setup lang="ts">
defineProps<{ stage: number }>();
</script>

<template>
  <section class="points">
    <div class="solution-list">
      <div class="reveal" :class="{ show: stage >= 2, past: stage >= 4 }">
        <div class="reveal-body solution-item">
          <div class="solution-rail" aria-hidden="true">
            <div class="solution-bullet"></div>
            <div class="solution-line" :class="{ show: stage >= 4 }"></div>
          </div>
          <div>Increase <b>focal length</b> for higher depth resolution.</div>
        </div>
      </div>
      <div class="solution-divider" :class="{ show: stage >= 4 }"></div>
      <div class="reveal" :class="{ show: stage >= 4, past: stage >= 6 }">
        <div class="reveal-body solution-item">
          <div class="solution-rail" aria-hidden="true">
            <div class="solution-bullet"></div>
            <div class="solution-line" :class="{ show: stage >= 6 }"></div>
          </div>
          <div>Introduce <b>foveation</b> for extended coverage.</div>
        </div>
      </div>
      <div class="solution-divider" :class="{ show: stage >= 6 }"></div>
      <div class="reveal" :class="{ show: stage >= 6 }">
        <div class="reveal-body solution-item">
          <div class="solution-rail" aria-hidden="true">
            <div class="solution-bullet"></div>
          </div>
          <div>Add <b>wide peripheral</b> for contextual awareness.</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.points {
  position: absolute;
  top: calc(50% + 20px);
  left: 40px;
  transform: translateY(-50%);
  font-size: 2rem;
  text-align: left;
  width: 24ch;
}

.reveal {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.5s ease,
    opacity 0.5s ease;
}

.reveal.show {
  grid-template-rows: 1fr;
  opacity: 1;
}

.reveal.show.past {
  opacity: 0.6;
}

.reveal-body {
  min-height: 0;
  overflow: visible;
}

.solution-item {
  display: grid;
  grid-template-columns: 1.1em 1fr;
  column-gap: 0.55em;
  align-items: start;
  line-height: 1.35;
}

.solution-divider {
  height: 1px;
  margin: 0.6em 0 0.6em calc(1.1em + 0.55em);
  background: color-mix(in srgb, var(--yellow-1) 18%, transparent);
  opacity: 0;
  transform: scaleX(0);
  transform-origin: left;
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

.solution-divider.show {
  opacity: 1;
  transform: scaleX(1);
}

.solution-rail {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
  width: 1.1em;
}

.solution-bullet {
  width: 0.62em;
  height: 0.62em;
  margin-top: 0.42em;
  box-sizing: border-box;
  border: 2px solid var(--yellow-1);
  border-radius: 50%;
  background: var(--fc-bg);
  flex: 0 0 auto;
}

.solution-line {
  position: absolute;
  left: 50%;
  top: calc(0.42em + 0.62em + 0.2em);
  bottom: -1.4em;
  width: 2px;
  background: color-mix(in srgb, var(--yellow-1) 55%, transparent);
  opacity: 0;
  transform: translateX(-50%) scaleY(0);
  transform-origin: top;
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

.solution-line.show {
  opacity: 1;
  transform: translateX(-50%) scaleY(1);
}

.solution-item b {
  color: var(--yellow-1);
}
</style>
