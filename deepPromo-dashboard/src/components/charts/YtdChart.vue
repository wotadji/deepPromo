<template>
  <!-- Le SVG prend toute la largeur de la cellule -->
  <svg ref="svgRef" class="ytd-chart"></svg>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as d3 from "d3";

const props = defineProps({
  /**
   * Valeurs mensuelles périodiques (NON cumulées) – Analysis (Actual)
   * Index 0 = Janvier, 1 = Février, ... 11 = Décembre
   */
  monthsAna: {
    type: Array,
    default: () => [],
  },
  /**
   * Valeurs mensuelles périodiques (NON cumulées) – Reference (Plan)
   */
  monthsRef: {
    type: Array,
    default: () => [],
  },
});

const svgRef = ref(null);
let resizeObserver = null;

// Palette IBCS / business pro
const COLORS = {
  actual: "#1F4E79", // bleu foncé
  plan: "#F28C28",   // orange
  axis: "#CCCCCC",
};

const draw = () => {
  const el = svgRef.value;
  if (!el) return;

  const svg = d3.select(el);

  const width = el.clientWidth || 200;
  const height = el.clientHeight || 48;

  svg.attr("width", width).attr("height", height);
  svg.selectAll("*").remove();

  const margin = { top: 4, right: 4, bottom: 10, left: 4 };

  // Normaliser sur 12 mois
  const months = d3.range(12);
  const dataActual = months.map((i) => Number(props.monthsAna?.[i] ?? 0));
  const dataPlan = months.map((i) => Number(props.monthsRef?.[i] ?? 0));

  const allValues = [...dataActual, ...dataPlan].filter(
    (v) => !isNaN(v) && v !== null
  );
  const max = allValues.length ? Math.max(...allValues) * 1.1 : 1;

  const x = d3
    .scaleBand()
    .domain(months)
    .range([margin.left, width - margin.right])
    .padding(0.25);

  const y = d3
    .scaleLinear()
    .domain([0, max])
    .range([height - margin.bottom, margin.top]);

  const barWidth = x.bandwidth() / 2;

  // Axe de base
  svg
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", height - margin.bottom + 0.5)
    .attr("y2", height - margin.bottom + 0.5)
    .attr("stroke", COLORS.axis)
    .attr("stroke-width", 0.5);

  // Bars ACTUAL (gauche)
  svg
    .selectAll(".bar-actual")
    .data(dataActual)
    .enter()
    .append("rect")
    .attr("class", "bar-actual")
    .attr("x", (_, i) => x(i))
    .attr("y", (d) => y(Math.max(d, 0)))
    .attr("width", barWidth)
    .attr("height", (d) => Math.max(0, height - margin.bottom - y(Math.max(d, 0))))
    .attr("fill", COLORS.actual)
    .attr("stroke", "#FFFFFF")
    .attr("stroke-width", 0.4)
    .append("title")
    .text((d, i) => `M${i + 1} – Actual: ${d}`);

  // Bars PLAN (droite)
  svg
    .selectAll(".bar-plan")
    .data(dataPlan)
    .enter()
    .append("rect")
    .attr("class", "bar-plan")
    .attr("x", (_, i) => x(i) + barWidth)
    .attr("y", (d) => y(Math.max(d, 0)))
    .attr("width", barWidth)
    .attr("height", (d) => Math.max(0, height - margin.bottom - y(Math.max(d, 0))))
    .attr("fill", COLORS.plan)
    .attr("stroke", "#FFFFFF")
    .attr("stroke-width", 0.4)
    .append("title")
    .text((d, i) => `M${i + 1} – Plan: ${d}`);
};

const scheduleDraw = () => {
  nextTick(() => {
    draw();
  });
};

watch(
  () => [props.monthsAna, props.monthsRef],
  () => {
    scheduleDraw();
  },
  { deep: true }
);

onMounted(() => {
  scheduleDraw();

  const el = svgRef.value;
  if (!el) return;

  resizeObserver = new ResizeObserver(() => {
    draw();
  });
  resizeObserver.observe(el);
});

onBeforeUnmount(() => {
  if (resizeObserver && svgRef.value) {
    resizeObserver.unobserve(svgRef.value);
  }
  resizeObserver = null;
});
</script>

<style scoped>
.ytd-chart {
  display: block;
  width: 100%;
  height: 48px; /* cohérent avec ta cellule */
}
</style>
