<script setup lang="ts">
import GeometryMath from "./03A-geometry-math.vue";

defineProps<{ stage: number }>();
</script>

<GeometryMath :stage="stage" />
