<template>
  <svg
    ref="svgRef"
    class="mini-svg"
    :height="height"
  ></svg>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import * as d3 from "d3";

const props = defineProps({
  value: { type: Number, default: 0 },
  max:   { type: Number, default: 1 },
  color: { type: String, default: "#1F4E79" },

  stroke:  { type: Number, default: 4 },     // épaisseur visuelle
  height:  { type: Number, default: 20 },    // hauteur totale SVG
  dotSize: { type: Number, default: 3.5 },   // taille du rond final
});

const svgRef = ref(null);

const draw = () => {
  const svgEl = svgRef.value;
  if (!svgEl) return;

  const svg = d3.select(svgEl);
  const width = svgEl.clientWidth;
  const height = props.height;
  const midY = height / 2;

  svg.attr("width", width).attr("height", height);
  svg.selectAll("*").remove();

  const x = d3.scaleLinear()
    .domain([0, props.max])
    .range([0, width]);

  const targetX = x(props.value);

  /** Ligne grise */
  svg.append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", midY)
    .attr("y2", midY)
    .attr("stroke", "#DDDDDD")
    .attr("stroke-width", props.stroke * 0.4);

  /** Barre colorée */
  svg.append("line")
    .attr("x1", 0)
    .attr("x2", targetX)
    .attr("y1", midY)
    .attr("y2", midY)
    .attr("stroke", props.color)
    .attr("stroke-width", props.stroke)
    .attr("stroke-linecap", "round");

  /** ROND FINAL (taille réglable) */
  svg.append("circle")
    .attr("cx", targetX)
    .attr("cy", midY)
    .attr("r", props.dotSize)
    .attr("fill", "#000")
    .attr("opacity", 0.5);
};

onMounted(() => {
  draw();
  window.addEventListener("resize", draw);
});

watch(() => props.value, draw);
watch(() => props.max, draw);
watch(() => props.stroke, draw);
watch(() => props.dotSize, draw);
</script>

<style scoped>
.mini-svg {
  width: 100%;
  display: block;
}
</style>
