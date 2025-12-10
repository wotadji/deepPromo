<template>
  <div class="fc-mini-row">
    <div class="fc-mini-label">
      {{ label }}
    </div>
    <svg
      ref="svgRef"
      :width="width"
      :height="height"
      class="fc-mini-svg"
    ></svg>
    <div class="fc-mini-value">
      {{ formattedValue }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import * as d3 from "d3";

const props = defineProps({
  value: {
    type: Number,
    default: 0, // % vs Plan
  },
  label: {
    type: String,
    default: "Per",
  },
  width: {
    type: Number,
    default: 80,
  },
  height: {
    type: Number,
    default: 16,
  },
});

const svgRef = ref(null);

const formattedValue = computed(() => {
  const v = props.value || 0;
  if (isNaN(v)) return "0%";
  const fixed = v.toFixed(0);
  return (v >= 0 ? "+" : "") + fixed + "%";
});

const drawChart = () => {
  const svgEl = svgRef.value;
  if (!svgEl) return;

  const width = props.width;
  const height = props.height;

  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();

  const margin = { left: 2, right: 2, top: 4, bottom: 4 };

  // On fait un domaine symétrique autour de 0
  const abs = Math.abs(props.value || 0);
  const maxAbs = Math.max(10, Math.ceil(abs / 10) * 10); // 10%, 20%, 30%…
  const x = d3
    .scaleLinear()
    .domain([-maxAbs, maxAbs])
    .range([margin.left, width - margin.right]);

  const baselineX = x(0);

  // Ligne de base grise
  svg
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", height / 2)
    .attr("y2", height / 2)
    .attr("stroke", "#DDDDDD")
    .attr("stroke-width", 1);

  const v = props.value || 0;
  const targetX = x(v);
  const isPositive = v >= 0;

  const color = isPositive ? "#6A9C47" : "#C0504D";

  // Segment animé depuis la baseline
  const mainLine = svg
    .append("line")
    .attr("x1", baselineX)
    .attr("x2", baselineX)
    .attr("y1", height / 2)
    .attr("y2", height / 2)
    .attr("stroke", color)
    .attr("stroke-width", 2);

  mainLine
    .transition()
    .duration(500)
    .attr("x2", targetX);

  // Petit cap vertical
  svg
    .append("line")
    .attr("x1", targetX)
    .attr("x2", targetX)
    .attr("y1", height / 2 - 4)
    .attr("y2", height / 2 + 4)
    .attr("stroke", color)
    .attr("stroke-width", 1.5);

  // Petit rond noir au point de forecast (optionnel, léger)
  svg
    .append("circle")
    .attr("cx", targetX)
    .attr("cy", height / 2)
    .attr("r", 2.5)
    .attr("fill", "#000000")
    .attr("opacity", 0.4);
};

onMounted(drawChart);

watch(
  () => props.value,
  () => {
    drawChart();
  }
);
</script>

<style scoped>
.fc-mini-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
}

.fc-mini-label {
  width: 22px;
  text-align: right;
  color: #666666;
  font-weight: 600;
}

.fc-mini-svg {
  flex: 1;
  display: block;
}

.fc-mini-value {
  min-width: 34px;
  text-align: right;
  font-family: "Consolas", "Monaco", monospace;
  color: #333333;
}
</style>
