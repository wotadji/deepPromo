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
    default: 0,
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

  /** 🔥 NOUVEAU — Épaisseur du segment */
  stroke: {
    type: Number,
    default: 2, // identique à ton comportement actuel
  },

  /** 🔥 NOUVEAU — Taille du rond final */
  dotSize: {
    type: Number,
    default: 2.5, // identique à ton comportement actuel
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
  const midY = height / 2;

  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();

  const margin = { left: 2, right: 2, top: 4, bottom: 4 };

  // Domaine symétrique
  const abs = Math.abs(props.value || 0);
  const maxAbs = Math.max(10, Math.ceil(abs / 10) * 10);

  const x = d3.scaleLinear()
    .domain([-maxAbs, maxAbs])
    .range([margin.left, width - margin.right]);

  const baselineX = x(0);

  // Ligne de base grise
  svg.append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", midY)
    .attr("y2", midY)
    .attr("stroke", "#DDDDDD")
    .attr("stroke-width", 1);

  const v = props.value || 0;
  const targetX = x(v);
  const isPositive = v >= 0;

  const color = isPositive ? "#6A9C47" : "#C0504D";

  // Segment animé
  const mainLine = svg.append("line")
    .attr("x1", baselineX)
    .attr("x2", baselineX)
    .attr("y1", midY)
    .attr("y2", midY)
    .attr("stroke", color)
    .attr("stroke-width", props.stroke);

  mainLine.transition().duration(500).attr("x2", targetX);

  // Cap vertical
  svg.append("line")
    .attr("x1", targetX)
    .attr("x2", targetX)
    .attr("y1", midY - 4)
    .attr("y2", midY + 4)
    .attr("stroke", color)
    .attr("stroke-width", props.stroke * 0.75);

  // 🔥 Petit rond noir configurable
  svg.append("circle")
    .attr("cx", targetX)
    .attr("cy", midY)
    .attr("r", props.dotSize)
    .attr("fill", "#000000")
    .attr("opacity", 0.4);
};

onMounted(drawChart);
watch(() => props.value, drawChart);
watch(() => props.stroke, drawChart);
watch(() => props.dotSize, drawChart);
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
