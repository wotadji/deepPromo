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
    <div class="fc-mini-value" :class="valueClass">
      {{ formattedValue }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import * as d3 from "d3";

const props = defineProps({
  value: {
    // % vs Plan (ou vs Actual YTD, selon ce que tu lui passes)
    type: Number,
    default: 0,
  },
  label: {
    type: String,
    default: "YTD",
  },
  width: {
    type: Number,
    default: 80,
  },
  height: {
    type: Number,
    default: 18,
  },
});

const svgRef = ref(null);

const formattedValue = computed(() => {
  const v = props.value || 0;
  if (isNaN(v)) return "0%";
  const fixed = v.toFixed(0);
  return (v >= 0 ? "+" : "") + fixed + "%";
});

const valueClass = computed(() => {
  const v = props.value || 0;
  if (v > 5) return "fc-positive";
  if (v < -5) return "fc-negative";
  return "fc-neutral";
});

const drawChart = () => {
  const svgEl = svgRef.value;
  if (!svgEl) return;

  const width = props.width;
  const height = props.height;

  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();

  const margin = { left: 2, right: 2, top: 4, bottom: 4 };

  const abs = Math.abs(props.value || 0);
  const maxAbs = Math.max(10, Math.ceil(abs / 10) * 10);
  const x = d3
    .scaleLinear()
    .domain([-maxAbs, maxAbs])
    .range([margin.left, width - margin.right]);

  const baselineX = x(0);
  const v = props.value || 0;
  const targetX = x(v);
  const isPositive = v >= 0;
  const color = isPositive ? "#6A9C47" : "#C0504D";

  // Base line
  svg
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", height / 2)
    .attr("y2", height / 2)
    .attr("stroke", "#DDDDDD")
    .attr("stroke-width", 1);

  // Segment principal (animé)
  const mainLine = svg
    .append("line")
    .attr("x1", baselineX)
    .attr("x2", baselineX)
    .attr("y1", height / 2)
    .attr("y2", height / 2)
    .attr("stroke", color)
    .attr("stroke-width", 3);

  mainLine
    .transition()
    .duration(600)
    .attr("x2", targetX);

  // Marker forecast (point noir)
  svg
    .append("circle")
    .attr("cx", targetX)
    .attr("cy", height / 2)
    .attr("r", 3)
    .attr("fill", "#000000")
    .attr("stroke", "#FFFFFF")
    .attr("stroke-width", 0.8)
    .attr("opacity", 0.8);

  // Cap vertical à l’extrémité
  svg
    .append("line")
    .attr("x1", targetX)
    .attr("x2", targetX)
    .attr("y1", height / 2 - 5)
    .attr("y2", height / 2 + 5)
    .attr("stroke", color)
    .attr("stroke-width", 1.5);
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
}

.fc-positive {
  color: #6a9c47;
}

.fc-negative {
  color: #c0504d;
}

.fc-neutral {
  color: #777777;
}
</style>
