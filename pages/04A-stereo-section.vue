<script setup lang="ts">
/// <reference types="vite/client" />

defineProps<{
  show?: boolean;
  image?: string;
}>();

const blurb = "Multiple eyes allow triangulation of objects in the world.";
</script>

<template>
  <article class="topic-card stereo-card" :class="{ show }">
    <div class="topic-media">
      <img v-if="image" :src="image" alt="Stereo vision reference" />
    </div>

    <div class="topic-copy">
      <h2>Stereo Vision</h2>
      <p class="topic-blurb">{{ blurb }}</p>
    </div>
  </article>
</template>

<style scoped>
.topic-card {
  display: grid;
  grid-template-columns: var(--topic-media-width, 8.8rem) minmax(0, 1fr);
  gap: 4rem;
  align-items: stretch;
  min-height: 14.8rem;
  padding: 0.9rem;
  border: none;
  opacity: 0;
  transform: translate3d(0, 0.8rem, 0);
  transition:
    opacity var(--transition-duration) var(--transition-curve),
    transform var(--transition-duration) var(--transition-curve);
}

.topic-card.show {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.stereo-card {
  background: color-mix(in srgb, var(--fc-bg) 94%, var(--camera-left) 6%);
}

.topic-media {
  aspect-ratio: 1 / 1.05;
  overflow: hidden;
  border-radius: 0.9rem;
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.topic-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.topic-copy {
  display: grid;
  padding: 0.15rem 0.35rem 0.15rem 0.15rem;
  min-width: 0;
  gap: 0.75rem;
  align-content: center;
  justify-items: center;
  text-align: center;
}

.topic-copy h2 {
  margin: 0;
  font-size: 1.65rem;
}

.topic-blurb {
  margin: 0;
  font-size: 1rem;
  line-height: 1.3;
  max-width: 28ch;
  text-wrap: balance;
}
</style>
