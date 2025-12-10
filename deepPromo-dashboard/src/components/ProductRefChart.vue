<template>
  <div class="w-full h-96 bg-white rounded-xl shadow-xl p-8 border border-orange-100">
    <h3 class="text-2xl font-bold text-orange-600 mb-6">{{ title }}</h3>
    <div ref="chartContainer" class="w-full h-[380px] bg-gradient-to-b from-orange-50 to-white rounded-lg"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  data: { type: Array, required: true },
  title: { type: String, default: 'YTD Reference (14 produits)' }
})

const chartContainer = ref(null)

const renderChart = () => {
  if (!chartContainer.value || !props.data.length) return
  
  d3.select(chartContainer.value).html('')
  
  const width = 450
  const height = 380
  const margin = { top: 20, right: 30, bottom: 60, left: 50 }
  
  const svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('width', '100%')
    .style('height', '100%')

  // 🔥 MÊME LOGIQUE mais refytd
  const monthOrder = ['M01','M02','M03','M04','M05','M06','M07','M08','M09','M10','M11','M12']
  const dataByProduct = {}
  
  props.data.forEach(row => {
    const productId = (row.productid || '').slice(-6)
    const month = row.month
    const monthIdx = monthOrder.indexOf(month)
    
    if (monthIdx >= 0 && productId) {
      if (!dataByProduct[productId]) dataByProduct[productId] = []
      dataByProduct[productId][monthIdx] = Number(row.refytd || 0)
    }
  })
  
  const allProducts = Object.keys(dataByProduct).slice(0, 14)
  const productsData = allProducts.map(id => ({
    id,
    data: monthOrder.map((m, i) => dataByProduct[id][i] || 0)
  }))

  // 🔥 SCALES
  const x = d3.scaleLinear().domain([0, 11]).range([margin.left, width - margin.right])
  const y = d3.scaleLinear()
    .domain([0, d3.max(productsData.flatMap(p => p.data)) * 1.1])
    .range([height - margin.bottom, margin.top])

  // 🔥 AXES
  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(i => monthOrder[i]))
  
  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => (d/1000)+'k'))

  // 🔥 14 LIGNES ORANGES
  const line = d3.line()
    .x((d, i) => x(i))
    .y(d => y(d))
    .curve(d3.curveMonotoneX)
  
  const colorScale = d3.scaleOrdinal(d3.schemeOranges[7])
  
  productsData.forEach((product, i) => {
    svg.append('path')
      .datum(product.data)
      .attr('fill', 'none')
      .attr('stroke', colorScale(i % 7))
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.7)
      .attr('d', line)
  })
}

onMounted(renderChart)
watch(() => props.data, renderChart, { deep: true })
</script>
