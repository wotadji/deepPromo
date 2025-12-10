<template>
  <div class="overflow-x-auto bg-white shadow-lg rounded-xl p-0">
    <h2 class="text-2xl font-bold mb-6 text-sky-900 text-center">
      📊 Product Performance Dashboard
    </h2>

    <table class="min-w-full border-collapse">
      <thead>
        <tr class="bg-sky-900 text-white text-sm" style="font-size: 12px;">
          <th class="p-3">Product</th>
          <th class="p-3">
            LTM
            <div class="text-xs font-light text-gray-300">Last Twelve Months</div>
          </th>
          <th class="p-3">
            YTD {{ anaScenarioLabel }} - {{ anaYearLabel }} vs {{ refScenarioLabel }} - {{ refYearLabel }}
          </th>
          <th class="p-3">Per Ana</th>
          <th class="p-3">Per Ref</th>
          <th class="p-3">FC</th>
          <th class="p-3">% Var</th>
          <th class="p-3">Trend / Risk / Effects</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(row,index) in finalRows" :key="index" class="border-b" style="font-size: 12px;">
          <!-- PRODUCT -->
          <td class="p-3 text-sky-900 text-center">
            {{ row.product }}
          </td>

          <!-- LTM Chart + Total -->
          <td class="p-2 flex items-center gap-2">
            <svg 
              class="ltmChart"
              :ref="el => setLtmRef(el,index)"
              height="50"
            ></svg>
            <div class="text-right font-bold text-black text-sm">
              {{ format(row.ltmTotal) }}
            </div>
          </td>

          <!-- YTD CHART RESPONSIVE -->
          <td class="p-2">
            <svg class="ytdChart"
                 :ref="el => setYtdRef(el, index)"
                 height="65"
                 style="width: 100%;">
            </svg>
          </td>

          <!-- AC -->
          <td class="p-3 text-center font-bold text-blue-700">
            {{ format(row.anaYtdSum) }}
          </td>

          <!-- REF -->
          <td class="p-3 text-center font-bold text-orange-600">
            {{ format(row.refYtdSum) }}
          </td>

          <!-- FC -->
          <td class="p-3 text-center font-bold text-purple-700">
            {{ format(row.fc) }}
          </td>

          <!-- VARIANCE -->
          <td class="p-3 text-center"
              :class="Number(row.variance) >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.variance }}%
          </td>

          <!-- Trend / Risk / Effects -->
          <td class="p-3 flex items-center justify-center gap-4">
            <span :class="Number(row.variance) >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ Number(row.variance) >= 0 ? '↑' : '↓' }}
            </span>
            <span
              class="px-2 py-1 rounded text-white text-xs"
              :class="{
                'bg-red-600': row.risk === 'A',
                'bg-orange-500': row.risk === 'B',
                'bg-green-600': row.risk === 'C'
              }"
            >
              {{ row.risk }}
            </span>
            <div class="flex gap-1">
              <div class="w-3 h-3 rounded-full" :style="{ background: effectColor(row.priceEffect) }"></div>
              <div class="w-3 h-3 rounded-full" :style="{ background: effectColor(row.qtyEffect) }"></div>
              <div class="w-3 h-3 rounded-full" :style="{ background: effectColor(row.volumeEffect) }"></div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from "vue";
import * as d3 from "d3";

const props = defineProps({
  data: { type: Array, required: true },
  anaScenarioLabel:  { type: String, required: true },
  anaYearLabel:  { type: String, required: true },
  refScenarioLabel:  { type: String, required: true },
  refYearLabel:  { type: String, required: true }
});

const format = (n) => {
  if (n === 0 || n === null || n === undefined) return '0';
  if (Math.abs(n) >= 1e6) {
    return (n / 1e6).toFixed(1) + 'M';
  }
  if (Math.abs(n) >= 1e3) {
    return (n / 1e3).toFixed(1) + 'k';
  }
  return Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 0 });
};

const effectColor = v => v > 0 ? "#10b981" : v < 0 ? "#ef4444" : "#d1d5db";

/* -----------------------------------------------------------
    1️⃣ GROUPEMENT PRODUIT + MOIS
----------------------------------------------------------- */
const grouped = computed(() => {
  const out = {};

  props.data.forEach(row => {
    const pid = row.product_id;
    if (!out[pid]) out[pid] = {
      monthsAna: Array(12).fill(0),
      monthsRef: Array(12).fill(0),
      ltmValues: Array(12).fill(0),
      info: row
    };

    const idx = row.month - 1;

    if (idx >= 0 && idx < 12) {
      out[pid].monthsAna[idx] = row.ana_ytd || 0;
      out[pid].monthsRef[idx] = row.ref_ytd || 0;
      out[pid].ltmValues[idx] = row.ana_per || 0;
    }
  });

  return out;
});

/* -----------------------------------------------------------
    2️⃣ LIGNES FINALES
----------------------------------------------------------- */
const finalRows = computed(() => {
  return Object.entries(grouped.value).map(([product, row]) => {
    const info = row.info;

    // LTM = 12 mois de ana_per
    const ltmVals = row.ltmValues;
    const ltmTotal = ltmVals.reduce((a, b) => a + b, 0);

    // YTD
    const anaYtdSum = row.monthsAna.reduce((a, b) => a + b, 0);
    const refYtdSum = row.monthsRef.reduce((a, b) => a + b, 0);

    // FC (si non disponible, calcule-le)
    const fc = info.fc || 
      (info.ana_per || 0) +
      (info.price_effect_per || 0) +
      (info.quantity_effect_per || 0) +
      (info.volume_effect_per || 0);

    // Variance (achievement_rate_ytd est déjà un ratio)
    const variance = info.achievement_rate_ytd ? 
      (info.achievement_rate_ytd * 100).toFixed(1) : '0.0';

    return {
      product,
      monthsAna: row.monthsAna,
      monthsRef: row.monthsRef,
      anaYtdSum,
      refYtdSum,
      fc,
      variance,
      risk: info.abc_ana_full_scope || "C",
      priceEffect: info.price_effect_per || 0,
      qtyEffect: info.quantity_effect_per || 0,
      volumeEffect: info.volume_effect_per || 0,
      ltmVals,
      ltmTotal
    };
  });
});

/* -----------------------------------------------------------
    3️⃣ RÉFS SVG
----------------------------------------------------------- */
const ytdRefs = ref([]);
const ltmRefs = ref([]);

const setYtdRef = (el, i) => ytdRefs.value[i] = el;
const setLtmRef = (el, i) => ltmRefs.value[i] = el;

/* -----------------------------------------------------------
    4️⃣ YTD Chart
----------------------------------------------------------- */
let resizeObservers = [];

const drawYtdCharts = () => {
  finalRows.value.forEach((row, i) => {
    const el = ytdRefs.value[i];
    if (!el) return;

    const width = el.clientWidth;
    const height = el.clientHeight;

    const svg = d3.select(el);
    svg.selectAll("*").remove();

    const margin = {top: 10, right: 8, bottom: 16, left: 18};

    const max = Math.max(...row.monthsAna, ...row.monthsRef, 1);

    const x = d3.scaleBand()
      .domain(d3.range(12))
      .range([margin.left, width - margin.right])
      .padding(0.15);

    const y = d3.scaleLinear()
      .domain([0, max])
      .range([height - margin.bottom, margin.top]);

    // ANA bars
    svg.selectAll(".ana")
      .data(row.monthsAna)
      .enter().append("rect")
      .attr("x", (d,i)=>x(i))
      .attr("y", d=>y(d))
      .attr("width", x.bandwidth()/2)
      .attr("height", d=>height - margin.bottom - y(d))
      .attr("fill", "#3b82f6")
      .attr("rx", 2);

    // REF bars
    svg.selectAll(".ref")
      .data(row.monthsRef)
      .enter().append("rect")
      .attr("x", (d,i)=>x(i) + x.bandwidth()/2)
      .attr("y", d=>y(d))
      .attr("width", x.bandwidth()/2)
      .attr("height", d=>height - margin.bottom - y(d))
      .attr("fill", "#f97316")
      .attr("rx", 2);

    // AXIS X
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3.axisBottom(x)
          .tickFormat(i => `M${String(i+1).padStart(2,"0")}`)
          .tickSize(0)
      )
      .selectAll("text")
      .style("font-size","8px");
  });
};

/* -----------------------------------------------------------
    5️⃣ LTM — 12 bars noires
----------------------------------------------------------- */
const drawLtmCharts = () => {
  finalRows.value.forEach((row,i)=>{
    const el = ltmRefs.value[i];
    if (!el) return;

    const width = 80;
    const height = 50;

    const svg = d3.select(el);
    svg.attr("width", width).attr("height", height);
    svg.selectAll("*").remove();

    const margin = {top: 5, right: 5, bottom: 5, left: 5};

    const x = d3.scaleBand()
      .domain(d3.range(row.ltmVals.length))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const max = Math.max(...row.ltmVals, 1);

    const y = d3.scaleLinear()
      .domain([0, max])
      .range([height - margin.bottom, margin.top]);

    svg.selectAll(".bar")
      .data(row.ltmVals)
      .enter().append("rect")
      .attr("x", (d,i)=>x(i))
      .attr("y", d=>y(d))
      .attr("width", x.bandwidth())
      .attr("height", d=>height - margin.bottom - y(d))
      .attr("fill", "#000")
      .attr("rx", 2);
  });
};

/* -----------------------------------------------------------
    6️⃣ WATCH + RESIZE OBSERVER
----------------------------------------------------------- */
watch(finalRows, async () => {
  await nextTick();

  drawLtmCharts();
  drawYtdCharts();

  resizeObservers.forEach(obs => obs.disconnect());
  resizeObservers = [];

  ytdRefs.value.forEach((el) => {
    if (!el) return;

    const obs = new ResizeObserver(() => {
      drawYtdCharts();
    });

    obs.observe(el);
    resizeObservers.push(obs);
  });
}, { immediate: true });
</script>

<style scoped>
table th, table td {
  border: 1px solid #e5e7eb;
}
</style>