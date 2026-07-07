<script setup lang="ts">
import { useIsSlideActive } from "@slidev/client";
import { computed, ref, watch } from "vue";

const isActive = useIsSlideActive();
const runId = ref(0);

watch(
  isActive,
  (active) => {
    if (active) runId.value += 1;
  },
  { immediate: true },
);

const frameSrc = computed(() => `/crypsis-simulation/index.html?kiosk=1&run=${runId.value}`);
</script>

<template>
  <section class="crypsis-slide" :data-active="isActive">
    <div class="frame-shell">
      <iframe
        :key="runId"
        :src="frameSrc"
        title="Crypsis Simulation"
        class="crypsis-frame"
        loading="eager"
      />
    </div>
  </section>
</template>

<style scoped>
.crypsis-slide {
  width: 100%;
  height: calc(100% - 5.6rem);
  margin-top: 1.2rem;
  display: grid;
  place-items: center;
}

.frame-shell {
  width: 100%;
  height: 100%;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
  background: #0a1420;
}

.crypsis-frame {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: #0a1420;
}
</style>
