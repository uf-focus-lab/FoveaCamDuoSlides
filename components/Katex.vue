<script setup lang="ts">
import { computed, nextTick, onMounted, provide, ref, watch } from "vue";
import { KatexKey, renderTex } from "./katex-context";

const props = defineProps<{ tex: string; display?: boolean }>();

const root = ref<HTMLElement | null>(null);
const ready = ref(0);
const html = computed(() => renderTex(props.tex, props.display));

function resolve(text: string, nth = 0): HTMLElement | null {
  if (!root.value) return null;
  let i = 0;
  for (const span of root.value.querySelectorAll<HTMLElement>("span")) {
    if (span.childElementCount === 0 && span.textContent === text) {
      if (i++ === nth) return span;
    }
  }
  return null;
}

provide(KatexKey, { ready, resolve });

const flag = () => void nextTick(() => ready.value++);
onMounted(flag);
watch(html, flag);
</script>

<template>
  <span ref="root" class="katex-embed" :class="{ display }">
    <span class="katex-embed-body" v-html="html" />
    <slot />
  </span>
</template>

<style scoped>
.katex-embed {
  display: inline-block;
}

.katex-embed.display {
  display: block;
}

/* Let the rendered KaTeX participate in the outer box directly. */
.katex-embed-body {
  display: contents;
}
</style>
