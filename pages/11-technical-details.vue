<script setup lang="ts">
import CrossSection from "assets/cross-section.svg";

// Spec values mirror the poster's Technical Details cell.
const specs = [
  { label: "Wide FoV", value: "25.6° × 19.4°" },
  { label: "Fovea FoV", value: "2.86° × 2.15°" },
  { label: "Wide Angular Res.", value: "~55 px/°" },
  { label: "Fovea Angular Res.", value: "~502 px/°" },
  { label: "Actuation Range", value: "20° × 20°" },
  { label: "Extended FoV", value: "22.9° × 22.2°" },
];
</script>

<template>
  <div class="tech-details">
    <CrossSection class="section-view" />

    <section class="key-parameters">
      <dl>
        <div v-for="spec in specs" :key="spec.label">
          <dt>{{ spec.label }}</dt>
          <dd>{{ spec.value }}</dd>
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

.key-parameters dl {
  display: grid;
  margin: 0;
}

.key-parameters div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 12px 0;
  border-top: 1px solid var(--divider);
}

.key-parameters div:last-child {
  border-bottom: 1px solid var(--divider);
}

.key-parameters dt {
  font-size: 0.98rem;
  color: var(--text-2);
}

.key-parameters dd {
  margin: 0;
  font-size: 1.18rem;
  font-weight: 650;
  color: var(--blue-2);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
