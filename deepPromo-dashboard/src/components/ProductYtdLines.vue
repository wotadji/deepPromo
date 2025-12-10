<template>
  <div class="w-full max-w-6xl mx-auto space-y-6 p-4">
    <h2 class="text-3xl font-bold text-center text-gray-800 mb-8">
      {{ title }} ({{ productCharts.length }} produits)
    </h2>
    
    <div v-for="(productData, index) in productCharts" :key="productData.id"
         class="bg-gradient-to-r from-gray-50 to-white rounded-2xl shadow-md border-2 border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
      
      <!-- Nom produit -->
      <h3 class="text-2xl font-black text-blue-600 text-center mb-6 p-4 bg-white rounded-lg shadow-sm">
        {{ productData.id }}
      </h3>

      <!-- 2 Bar Charts côte à côte -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- ANA BARS -->
        <div class="bg-blue-50 p-6 rounded-xl border-4 border-blue-200 group hover:border-blue-300 transition-all">
          <h4 class="font-bold text-blue-700 text-lg mb-4 text-center">🔵 Analysis YTD</h4>
          <div class="h-48 bg-white rounded-lg border shadow-sm overflow-hidden">
            <svg ref="anaSvgs" :data-index="index" class="w-full h-full" viewBox="0 0 400 180"></svg>
          </div>
          <div class="text-center mt-2 text-sm text-blue-600 font-mono">
            Max: {{ formatNumber(Math.max(...productData.ana)) }}€
          </div>
        </div>

        <!-- REF BARS -->
        <div class="bg-orange-50 p-6 rounded-xl border-4 border-orange-200 group hover:border-orange-300 transition-all">
          <h4 class="font-bold text-orange-700 text-lg mb-4 text-center">🟠 Reference YTD</h4>
          <div class="h-48 bg-white rounded-lg border shadow-sm overflow-hidden">
            <svg ref="refSvgs" :data-index="index" class="w-full h-full" viewBox="0 0 400 180"></svg>
          </div>
          <div class="text-center mt-2 text-sm text-orange-600 font-mono">
            Max: {{ formatNumber(Math.max(...productData.ref)) }}€
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  data: { type: Array, required: true },
  title: { type: String, default: '📊 YTD Bar Charts - Analysis vs Reference' }
})

const anaSvgs = ref([])
const refSvgs = ref([])

const formatNumber = (num) => num.toLocaleString('fr-FR', { maximumFractionDigits: 0 })

const productCharts = computed(() => {
  const dataByProduct = {}
  
  props.data.forEach((row, i) => {
    const productId = (row.productid || row.product_id || row.productId || `P${i}`).slice(-6)
    let monthStr = row.month
    if (typeof monthStr === 'number') {
      monthStr = `M${monthStr.toString().padStart(2, '0')}`
    }
    const monthIdx = ['M01','M02','M03','M04','M05','M06','M07','M08','M09','M10','M11','M12'].indexOf(monthStr)
    const anaYtd = Number(row.anaytd || row['ana_ytd'] || row.anaYtd || row.anaytd || 0)
    const refYtd = Number(row.refytd || row['ref_ytd'] || row.refYtd || row.refytd || 0)
    
    if (monthIdx >= 0 && productId) {
      if (!dataByProduct[productId]) {
        dataByProduct[productId] = { ana: new Array(12).fill(0), ref: new Array(12).fill(0) }
      }
      dataByProduct[productId].ana[monthIdx] = Math.max(dataByProduct[productId].ana[monthIdx], anaYtd)
      dataByProduct[productId].ref[monthIdx] = Math.max(dataByProduct[productId].ref[monthIdx], refYtd)
    }
  })
  
  const result = Object.entries(dataByProduct)
    .slice(0, 14)
    .map(([id, data]) => ({
      id,
      ana: data.ana,
      ref: data.ref
    }))
  
  // 🔥 CONSOLE propre - 14 produits seulement
  console.table(result.map(p => ({
    Produit: p.id,
    'Max ANA': formatNumber(Math.max(...p.ana)),
    'Max REF': formatNumber(Math.max(...p.ref)),
    'Mois ANA': p.ana.filter(v => v > 0).length,
    'Mois REF': p.ref.filter(v => v > 0).length
  })))
  
  console.log('✅ 14 PRODUITS SÉLECTIONNÉS:', result.map(p => p.id))
  return result
})

// 🔥 BAR CHART avec ÉCHELLE IDENTIQUE ANA/REF
const drawBarChart = (svgEl, values, color, globalMaxScale) => {
  if (!svgEl) return
  
  const svg = d3.select(svgEl)
  const width = 400, height = 180
  const margin = { top: 20, right: 20, bottom: 40, left: 40 }
  
  svg.selectAll('*').remove()
  
  // 🔥 ÉCHELLE IDENTIQUE pour tous les charts (ANA + REF)
  const maxVal = globalMaxScale || Math.max(...values.filter(v => v > 0)) * 1.1 || 100
  const x = d3.scaleBand()
    .domain(d3.range(12))
    .range([margin.left, width - margin.right])
    .padding(0.1)
  
  const y = d3.scaleLinear().domain([0, maxVal]).range([height - margin.bottom, margin.top])
  
  // Axes X (Mois M01-M12)
  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSize(0))
    .style('font-size', '10px')
    .selectAll('text')
    .style('text-anchor', 'middle')
    .text(d => `M${(d+1).toString().padStart(2,'0')}`)
  
  // Axes Y (échelle commune)
  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(3))
    .style('font-size', '10px')
  
  // 🔥 BARRES arrondies
  svg.selectAll('.bar')
    .data(values)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', (d, i) => x(i))
    .attr('y', d => y(d))
    .attr('width', x.bandwidth())
    .attr('height', d => height - margin.bottom - y(d))
    .attr('fill', d => d > 0 ? color : '#e5e7eb')
    .attr('rx', 3)
    .attr('ry', 3)
    .attr('opacity', d => d > 0 ? 0.85 : 0.3)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1).attr('transform', 'scale(1.05)')
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 0.85).attr('transform', '')
    })
  
  // Valeurs sur les barres hautes
  svg.selectAll('.bar-value')
    .data(values)
    .enter().append('text')
    .attr('x', (d, i) => x(i) + x.bandwidth()/2)
    .attr('y', d => d > maxVal * 0.3 ? y(d) - 8 : y(d) + 15)
    .attr('text-anchor', 'middle')
    .attr('font-size', '9px')
    .attr('font-weight', 'bold')
    .attr('fill', '#1f2937')
    .text(d => d > maxVal * 0.2 ? (d/1000).toFixed(0) + 'k' : '')
}

const renderCharts = async () => {
  await nextTick()
  
  // 🔥 ÉCHELLE GLOBALE pour TOUS les charts (ANA + REF)
  const globalMaxAna = Math.max(...productCharts.value.flatMap(p => p.ana))
  const globalMaxRef = Math.max(...productCharts.value.flatMap(p => p.ref))
  const globalMaxScale = Math.max(globalMaxAna, globalMaxRef) * 1.1
  
  console.log('📊 ÉCHELLE GLOBALE:', formatNumber(globalMaxScale))
  
  productCharts.value.forEach((product, index) => {
    const anaEl = anaSvgs.value[index]
    const refEl = refSvgs.value[index]
    
    // 🔥 MÊME ÉCHELLE pour les 2 charts du produit
    if (anaEl) drawBarChart(anaEl, product.ana, '#3b82f6', globalMaxScale)
    if (refEl) drawBarChart(refEl, product.ref, '#f97316', globalMaxScale)
  })
}

onMounted(renderCharts)
watch(() => props.data, renderCharts, { deep: true })
</script>

<style scoped>
svg { 
  background: linear-gradient(to bottom, #f8fafc, #ffffff) !important; 
  border-radius: 6px; 
}

.bar:hover {
  opacity: 1 !important;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}
</style>
