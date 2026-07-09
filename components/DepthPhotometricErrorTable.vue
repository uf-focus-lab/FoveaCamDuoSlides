<script setup lang="ts">
interface ErrorRow {
  label: string;
  value: string;
  emphasize?: boolean;
}

const rows: ErrorRow[] = [
  { label: "Mono-Fovea (aligned)", value: "0.0410" },
  { label: "Fine-Tuned IGEV", value: "0.0415" },
  { label: "Ours (full strength prior loss)", value: "0.0856" },
  { label: "Ours (no prior loss)", value: "0.0480" },
  { label: "Ours", value: "0.0354", emphasize: true },
];
</script>

<template>
  <section class="photometric-table-wrap">
    <!-- <p class="table-caption">Quantitative comparison using mean photometric reprojection error.</p> -->

    <table class="photometric-table" aria-label="Depth photometric error table">
      <thead>
        <tr>
          <th scope="col">Method</th>
          <th scope="col">Mean Photo. Error ↓</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.label" :class="{ emphasize: row.emphasize }">
          <th scope="row">{{ row.label }}</th>
          <td>{{ row.value }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.photometric-table-wrap {
  width: min(900px, 50%);
  margin: 0 auto;
  padding-top: 5rem;
}

.table-caption {
  margin: 0 0 0.45rem;
  font-size: 0.88rem;
  color: #cbd5e1;
  letter-spacing: 0.01em;
}

.photometric-table {
  width: 100%;
  border-collapse: collapse;
  border-top: 2px solid rgba(226, 232, 240, 0.8);
  border-bottom: 2px solid rgba(226, 232, 240, 0.8);
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.45);
}

.photometric-table thead th {
  color: #f8fafc;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  padding: 0.52rem 0.7rem;
  text-align: left;
  border-bottom: 1px solid rgba(226, 232, 240, 0.45);
}

.photometric-table tbody th,
.photometric-table tbody td {
  padding: 0.44rem 0.7rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
}

.photometric-table tbody th {
  font-size: 0.9rem;
  font-weight: 500;
  color: #e2e8f0;
  text-align: left;
}

.photometric-table tbody td {
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
  color: #f8fafc;
  text-align: right;
}

.photometric-table tbody tr.emphasize th,
.photometric-table tbody tr.emphasize td {
  font-weight: 700;
}

.photometric-table tbody tr:last-child th,
.photometric-table tbody tr:last-child td {
  border-bottom: 0;
}
</style>
