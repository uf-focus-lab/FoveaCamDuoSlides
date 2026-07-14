<script setup lang="ts">
import { computed } from "vue";
import { katexEmbedClass, renderTex } from "./katex-context";

const props = defineProps<{ tex: string; display?: boolean }>();
const html = computed(() => renderTex(props.tex, props.display));
</script>

<template>
  <span :class="[katexEmbedClass, { display }]">
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
