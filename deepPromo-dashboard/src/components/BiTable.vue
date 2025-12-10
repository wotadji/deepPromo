<template>
  <div class="dashboard">
    <!-- En-tête IBCS -->
    <div class="header">
      <div class="legend">
        <div class="legend-item">
          <div class="color-box" style="background-color: #1F4E79;"></div>
          <span>Analysis</span>
        </div>
        <div class="legend-item">
          <div class="color-box" style="background-color: #F28C28;"></div>
          <span>Reference</span>
        </div>
        <div class="legend-item">
          <div class="color-box" style="background-color: #6A9C47;"></div>
          <span>Forecast (Positive)</span>
        </div>
        <div class="legend-item">
          <div class="color-box" style="background-color: #C0504D;"></div>
          <span>Forecast (Negative)</span>
        </div>
        <div class="legend-item">
          <div class="color-box" style="background-color: #F5F5F5; border: 1px solid #CCCCCC;"></div>
          <span>Scale: {{ formatCurrency(maxScaleValue) }} = 100%</span>
        </div>
      </div>
    </div>

   <!-- Tableau IBCS avec scroll interne -->
<div class="table-scroll-container">
  <div class="table-wrapper">
    <table class="table">
      <!-- THEAD fixe -->
      <thead class="table-header-fixed">
        <tr class="table-header">
          <th class="col-ltm">
            <div class="col-header">PERFORMANCE LTM</div>
            <!-- <div class="col-subheader">Douze derniers mois</div> -->
          </th>
          <th class="col-ytd">
            <div class="col-header">TENDANCE YTD</div>
            <!-- <div class="col-subheader">Cumulatif {{ anaYearLabel }} vs {{ refYearLabel }}</div> -->
          </th>
          <th class="col-actual">
            <div class="col-header">ANALYSE (€)</div>
            <!-- <div class="col-subheader">Par {{ anaYearLabel }} -  (€)</div> -->
          </th>
          <th class="col-plan">
            <div class="col-header">RÉFÉRENCE (€)</div>
            <!-- <div class="col-subheader">Par {{ refYearLabel }} -  (€)</div> -->
          </th>
          <th class="col-fc">
            <div class="col-header">PRÉVISION</div>
            <!-- <div class="col-subheader">YTD vs Actual</div> -->
          </th>
          <th class="col-var">
            <div class="col-header">VAR</div>
            <!-- <div class="col-subheader">% vs Plan</div> -->
          </th>
          <th class="col-risk">
            <div class="col-header">RISQUES & EFFETS</div>
            <!-- <div class="col-subheader">ABC / PQV</div> -->
          </th>
        </tr>
        
        <!-- FOOTER fixe juste après le header -->
        <tr v-if="finalRows.length > 0" class="table-footer-fixed">
          <td class="footer-value">
            {{ formatCompact(ltmTotal) }}
          </td>
          <td></td>
          <td class="footer-value footer-actual">
            <div class="footer-value-content">
              {{ formatCurrency(anaTotal) }}
            </div>
          </td>
          <td class="footer-value footer-plan">
            <div class="footer-value-content">
              {{ formatCurrency(refTotal) }}
            </div>
          </td>
          <td class="footer-value footer-fc">
            <div class="footer-fc-content" :class="getForecastValueClass(fcTotal, anaTotal)">
              <div class="footer-fc-value">
                {{ formatCurrency(fcTotal) }}
              </div>
              <div class="footer-fc-vs-plan" :class="getVarianceClass(fcOverallVariance)">
                <!-- vs Plan: {{ formatPercentage(fcOverallVariance) }} -->
              </div>
            </div>
          </td>
          <td class="footer-value" :class="getVarianceClass(overallVariance)">
            {{ formatPercentage(overallVariance) }}
          </td>
          <td></td>
        </tr>
      </thead>
      
      <!-- TBODY scrollable -->
      <tbody class="scrollable-tbody">
        <!-- Boucle sur chaque produit -->
        <template v-for="(row, index) in finalRows" :key="index">
          <!-- Ligne 1: Label du produit avec colspan -->
          <tr class="product-label-row">
            <td colspan="7" class="product-label-cell">
              <div class="text-xs text-gray-600 pl-2 py-1" style="font-size: 12px;">
                {{ row.vueInfo.country }} | {{ row.vueInfo.region }} | {{ row.vueInfo.city }} | {{ row.vueInfo.department }} | {{ row.vueInfo.store_id }} | 
                <button 
                  class="product-id-button"
                  @click="selectProduct(row.product)"
                  :class="{ 'product-id-selected': row.product === selectedProduct }"
                >
                    {{ row.product }}
                 </button>
              </div>
            </td>
          </tr>
          
          <!-- Ligne 2: Données du produit -->
          <tr 
            class="table-row"
            :class="{ 'selected-row': row.product === selectedProduct }"
          >
            <!-- COL 1: LTM CHART -->
            <td class="cell-ltm">
              <div class="ltm-container">
                <svg 
                  class="ltm-chart"
                  :ref="el => setLtmRef(el, index)"
                  height="36"
                  width="80"
                ></svg>
                <div class="ltm-total">
                  {{ formatCompact(row.ltmTotal) }}
                </div>
              </div>
            </td>
            
            <!-- COL 2: YTD CHART (via composant YtdChart) -->
            <td class="cell-ytd">
              <YtdChart
                class="ytd-chart"
                :monthsAna="row.monthsAna"
                :monthsRef="row.monthsRef"
                :height="48"
              />
            </td>
            
            <!-- COL 3: ACTUAL YTD -->
            <td class="cell-actual">
              <div class="actual-container">
                <div class="value-actual" style="color: #333333;">
                  <span class="contribution-percentage mr-1" :title="`Contribution au total ${anaYearLabel}: ${formatCurrency(row.anaYtdSum)} / ${formatCurrency(anaTotal)}`">
                    {{ formatContribution(row.anaYtdSum, anaTotal) }}
                  </span>
                  <span class="value-actual" style="color: #333333;">
                    {{ formatCurrency(row.anaYtdSum) }}
                  </span>
                </div>
                <div class="horizontal-bar comparison-bar">
                  <!-- <div 
                    class="bar-fill bar-actual-fill"
                    :style="{ width: getBarWidth(row.anaYtdSum) + '%' }"
                    :title="'Actual: ' + formatCurrency(row.anaYtdSum) + ' (' + getBarWidth(row.anaYtdSum).toFixed(1) + '% of scale)'"
                  >
                    <div class="bar-end bar-actual-end"></div> 
                   
                  </div> -->
                   <MiniBar
                    :value="row.anaYtdSum"
                    :max="maxScaleValue"
                    color="#1F4E79"
                    :stroke="5"
                    :dotSize="4"
                    />
                </div>
              </div>
            </td>
            
            <!-- COL 4: PLAN YTD -->
            <td class="cell-plan">
              <div class="plan-container">
                <div class="value-plan" style="color: #333333;">
                  <span class="contribution-percentage mr-1" :title="`Contribution au total ${refYearLabel}: ${formatCurrency(row.refYtdSum)} / ${formatCurrency(refTotal)}`">
                    {{ formatContribution(row.refYtdSum, refTotal) }}
                  </span>
                  <span class="value-plan" style="color: #333333;">
                    {{ formatCurrency(row.refYtdSum) }}
                  </span>
                </div>
                <div class="horizontal-bar comparison-bar">
                 <!--  <div 
                    class="bar-fill bar-plan-fill"
                    :style="{ width: getBarWidth(row.refYtdSum) + '%' }"
                    :title="'Plan: ' + formatCurrency(row.refYtdSum) + ' (' + getBarWidth(row.refYtdSum).toFixed(1) + '% of scale)'"
                  >
                    <div class="bar-end bar-plan-end"></div>
                  </div> -->
                   <MiniBar
                    :value="row.refYtdSum"
                    :max="maxScaleValue"
                    color="#F28C28"
                    :stroke="5"
                    :dotSize="4"
                    />

                </div>
              </div>
            </td>
            
            <!-- COL 5: FORECAST -->
            <td class="cell-fc">
              <div class="forecast-container flex flex-col items-end gap-2">
                <!-- Valeur FC YTD (€) -->
                <div class="flex items-center justify-end gap-2">
                  <span class="font-mono text-xs font-semibold text-gray-700">
                    {{ formatCurrency(row.fcYtd) }}
                  </span>
                </div>

                <!-- Bloc PER + YTD (composants ForecastMini personnalisés) -->
                <ForecastMini 
                  :value="Math.round(row.fcPerVsActual)" 
                  label="Per"
                  :stroke="5"
                />
                <ForecastMini 
                  :value="Math.round(row.fcYtdVsActual)" 
                  label="Ytd"
                  :stroke="5"
                />
              </div>
            </td>
            
            <!-- COL 6: VARIANCE -->
            <td class="cell-var">
              <div class="variance-container" :class="getVarianceClass(row.variance)">
                <span class="variance-icon">
                  {{ getVarianceIcon(row.variance) }}
                </span>
                <span class="variance-value" style="color: #333333;">
                  {{ formatPercentage(row.variance) }}
                </span>
              </div>
            </td>
            
            <!-- COL 7: RISK & EFFECTS -->
            <td class="cell-risk">
              <div class="risk-container">
                <div class="abc-badge" :class="getRiskClass(row.risk)">
                  {{ row.risk }}
                </div>
                
                <div class="effects">
                  <div class="effect-dots">
                    <div 
                      v-for="(effect, idx) in [
                        { value: row.priceEffect, label: 'P' },
                        { value: row.qtyEffect, label: 'Q' },
                        { value: row.volumeEffect, label: 'V' }
                      ]" 
                      :key="idx"
                      class="effect-dot"
                      :title="`${effect.label}: ${formatCurrency(effect.value)}`"
                      :class="getEffectClass(effect.value)"
                    >
                      {{ effect.label }}
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </template>
        
        <!-- TFOOT dupliqué en bas du TBODY pour l'affichage normal -->
        <tr v-if="finalRows.length > 0" class="table-footer-mobile">
          <td colspan="7">
            <div class="mobile-footer-content">
              <div class="mobile-footer-row">
                <span class="footer-label">TOTAL:</span>
                <span class="footer-value">{{ formatCompact(ltmTotal) }}</span>
              </div>
              <div class="mobile-footer-row">
                <span>Actual:</span>
                <span class="footer-actual">{{ formatCurrency(anaTotal) }}</span>
              </div>
              <div class="mobile-footer-row">
                <span>Plan:</span>
                <span class="footer-plan">{{ formatCurrency(refTotal) }}</span>
              </div>
              <div class="mobile-footer-row">
                <span>Forecast:</span>
                <span :class="getForecastValueClass(fcTotal, anaTotal)">{{ formatCurrency(fcTotal) }}</span>
                <span :class="getVarianceClass(fcOverallVariance)" style="font-size: 9px; margin-left: 4px;">
                  (vs Plan: {{ formatPercentage(fcOverallVariance) }})
                </span>
              </div>
              <div class="mobile-footer-row">
                <span>Variance:</span>
                <span :class="getVarianceClass(overallVariance)">{{ formatPercentage(overallVariance) }}</span>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
    
    <!-- Notes IBCS -->
    <div class="notes">
      <div class="note">
        <strong>Comparaison Actual vs Plan:</strong> 
        <span class="legend-sample">
          <span class="legend-bar actual"></span> <strong>Actual</strong> ({{ anaYearLabel }} YTD) | 
          <span class="legend-bar plan"></span> <strong>Plan</strong> ({{ refYearLabel }} YTD)
        </span>
        <strong>Forecast YTD:</strong> Prévision cumulée année en cours comparée à l'Actual YTD.
        <strong>Échelle basée sur valeurs individuelles:</strong> {{ formatCurrency(maxScaleValue) }} = 100% largeur.
        <strong>Note:</strong> Les totaux peuvent dépasser 100% de l'échelle.
      </div>
      <div class="timestamp">
        Données au: {{ currentDate }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted } from "vue";
import * as d3 from "d3";
import YtdChart from "@/components/charts/YtdChart.vue";
import ForecastMini from "@/components/charts/ForecastMini.vue";
import MiniBar from "@/components/charts/MiniBar.vue";

const props = defineProps({
  data: { 
    type: Array, 
    required: true,
    default: () => [] 
  },
  anaScenarioLabel:  { 
    type: String, 
    required: false,
    default: "Actual" 
  },
  anaYearLabel:  { 
    type: String, 
    required: false,
    default: "Current" 
  },
  refScenarioLabel:  { 
    type: String, 
    required: false,
    default: "Plan" 
  },
  refYearLabel:  { 
    type: String, 
    required: false,
    default: "Previous" 
  },
  selectedProduct: {
    type: String,
    required: false,
    default: ''
  }
});

const emit = defineEmits(['productSelected']);

// Fonction pour sélectionner un produit
const selectProduct = (productId) => {
  console.log('BiTable - Product selected:', productId);
  emit('productSelected', productId);
};

// FORMATTERS
const formatCurrency = (n) => {
  if (n === 0 || n === null || n === undefined) return '0';
  if (Math.abs(n) >= 1e6) return '' + (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return '' + (n / 1e3).toFixed(1) + 'k';
  return '' + Math.round(n).toLocaleString('fr-FR');
};

const formatCompact = (n) => {
  if (n === 0 || n === null || n === undefined) return '0';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return Math.round(n).toLocaleString('fr-FR');
};

const formatPercentage = (value) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.0%';
  return (num >= 0 ? '+' : '') + num.toFixed(1) + '%';
};

// ÉCHELLE GLOBALE + GROUPING
const grouped = computed(() => {
  const out = {};
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    return out;
  }
  
  props.data.forEach(row => {
    const pid = row.product_id;
    if (!pid) return;
    
    if (!out[pid]) {
      out[pid] = {
        monthsAna: Array(12).fill(0),
        monthsRef: Array(12).fill(0),
        monthsFcPer: Array(12).fill(0),  // Forecast périodique par mois
        ltmValues: Array(12).fill(0),
        info: row
      };
    }
    
    const idx = row.month - 1;
    if (idx >= 0 && idx < 12) {
      out[pid].monthsAna[idx] = row.ana_per || 0;
      out[pid].monthsRef[idx] = row.ref_per || 0;
      out[pid].ltmValues[idx] = row.ana_per || 0;
      
      // Calcul du forecast périodique (mensuel)
      out[pid].monthsFcPer[idx] = row.fc_per || 
        (row.ana_per || 0) +
        (row.price_effect_per || 0) +
        (row.quantity_effect_per || 0) +
        (row.volume_effect_per || 0);
    }
  });
  
  return out;
});

const finalRows = computed(() => {
  const rows = Object.entries(grouped.value).map(([product, row]) => {
    const info = row.info;
    const ltmVals = row.ltmValues;
    const ltmTotal = ltmVals.reduce((a, b) => a + b, 0);
    
    // ACTUAL YTD (cumul des mois)
    const anaYtdSum = row.monthsAna.reduce((a, b) => a + b, 0);
    
    // PLAN YTD (cumul des mois)
    const refYtdSum = row.monthsRef.reduce((a, b) => a + b, 0);
    const vueInfo = row.info;
    
    // FORECAST PÉRIODIQUE (mensuel)
    const fcPer = info.fc_per || 
      (info.ana_per || 0) +
      (info.price_effect_per || 0) +
      (info.quantity_effect_per || 0) +
      (info.volume_effect_per || 0);
    
    // FORECAST YTD (cumul des forecasts mensuels)
    let fcYtd = info.fc_ytd;
    if (fcYtd === undefined || fcYtd === null) {
      fcYtd = row.monthsFcPer.reduce((a, b) => a + b, 0);
    }
    
    // VARIANCE Actual vs Plan YTD
    const variance = refYtdSum !== 0 ? 
      ((anaYtdSum - refYtdSum) / refYtdSum * 100).toFixed(1) : '0.0';
    
    // VARIANCE Forecast vs Plan YTD
    const fcVariance = refYtdSum !== 0 ? 
      ((fcYtd - refYtdSum) / refYtdSum * 100).toFixed(1) : '0.0';
    
    const planPer = info.ref_per || info.plan_per || 0;
    const actualPer = info.ana_per || 0;
    
    // % FC Per vs Actual (nouveau calcul)
    const fcPerVsActual = actualPer !== 0
      ? ((fcPer - actualPer) / actualPer) * 100
      : 0;
    
    // % FC YTD vs Actual YTD (nouveau calcul)
    const fcYtdVsActual = anaYtdSum !== 0
      ? ((fcYtd - anaYtdSum) / anaYtdSum) * 100
      : 0;
    
    return {
      product,
      vueInfo,
      monthsAna: row.monthsAna,
      monthsRef: row.monthsRef,
      anaYtdSum,
      refYtdSum,
      fcPer,
      fcYtd,
      variance,
      fcVariance,
      risk: info.abc_ana_full_scope || "C",
      priceEffect: info.price_effect_per || 0,
      qtyEffect: info.quantity_effect_per || 0,
      volumeEffect: info.volume_effect_per || 0,
      ltmVals,
      ltmTotal,
      planPer,
      actualPer,
      fcPerVsActual,  // Nouvelle valeur
      fcYtdVsActual   // Nouvelle valeur
    };
  });
  
  // Trier par contribution descendante
  return rows.sort((a, b) => b.anaYtdSum - a.anaYtdSum);
});

const ltmTotal = computed(() => 
  finalRows.value.reduce((sum, row) => sum + row.ltmTotal, 0)
);

const anaTotal = computed(() => 
  finalRows.value.reduce((sum, row) => sum + row.anaYtdSum, 0)
);

const refTotal = computed(() => 
  finalRows.value.reduce((sum, row) => sum + row.refYtdSum, 0)
);

const fcTotal = computed(() => 
  finalRows.value.reduce((sum, row) => sum + row.fcYtd, 0)
);

const overallVariance = computed(() => {
  if (refTotal.value === 0) return '0.0';
  return ((anaTotal.value - refTotal.value) / refTotal.value * 100).toFixed(1);
});

const fcOverallVariance = computed(() => {
  if (refTotal.value === 0) return '0.0';
  return ((fcTotal.value - refTotal.value) / refTotal.value * 100).toFixed(1);
});

// ÉCHELLE UNIQUEMENT POUR LES LIGNES INDIVIDUELLES
const maxScaleValue = computed(() => {
  if (!finalRows.value || finalRows.value.length === 0) return 1;
  
  let maxIndividualValue = 0;
  
  finalRows.value.forEach(row => {
    if (row.anaYtdSum > maxIndividualValue) maxIndividualValue = row.anaYtdSum;
    if (row.refYtdSum > maxIndividualValue) maxIndividualValue = row.refYtdSum;
    if (row.fcYtd > maxIndividualValue) maxIndividualValue = row.fcYtd;
  });
  
  return maxIndividualValue > 0 ? maxIndividualValue : 1;
});

const getBarWidth = (value) => {
  if (!maxScaleValue.value || maxScaleValue.value === 0) return 0;
  const width = (value / maxScaleValue.value) * 100;
  return Math.min(width, 100);
};

// FORECAST LOGIC - BASÉ SUR FC_YTD vs ACTUAL_YTD
const getForecastValueClass = (forecastYtd, actualYtd) => {
  if (actualYtd === 0 || actualYtd === null || actualYtd === undefined) return 'forecast-neutral';
  const percentage = (forecastYtd / actualYtd) * 100;
  if (percentage >= 100) return 'forecast-positive';
  return 'forecast-negative';
};

const getForecastIndicatorClass = (forecastYtd, actualYtd) => {
  if (actualYtd === 0 || actualYtd === null || actualYtd === undefined) return 'forecast-indicator-neutral';
  const percentage = (forecastYtd / actualYtd) * 100;
  if (percentage >= 100) return 'forecast-indicator-positive';
  return 'forecast-indicator-negative';
};

const getForecastIndicatorText = (forecastYtd, actualYtd) => {
  if (actualYtd === 0 || actualYtd === null || actualYtd === undefined) return '→';
  const percentage = ((forecastYtd - actualYtd) / (actualYtd || 1) * 100).toFixed(1);
  if (forecastYtd >= actualYtd) return `+${percentage}%`;
  return `${percentage}%`;
};

const getForecastDescription = (forecastYtd, actualYtd) => {
  if (actualYtd === 0 || actualYtd === null || actualYtd === undefined) return 'Neutre';
  const percentage = ((forecastYtd - actualYtd) / (actualYtd || 1) * 100).toFixed(1);
  if (forecastYtd >= actualYtd) return `Meilleur de ${percentage}% vs Actual`;
  return `Inférieur de ${Math.abs(percentage)}% vs Actual`;
};

// VARIANCE & RISK
const getVarianceClass = (variance) => {
  const num = typeof variance === 'string' ? parseFloat(variance) : variance;
  if (isNaN(num)) return 'neutral';
  if (num > 5) return 'positive';
  if (num < -5) return 'negative';
  return 'neutral';
};

const getVarianceIcon = (variance) => {
  const num = typeof variance === 'string' ? parseFloat(variance) : variance;
  if (isNaN(num)) return '→';
  if (num > 0) return '▲';
  if (num < 0) return '▼';
  return '→';
};

const getRiskClass = (risk) => {
  switch(risk) {
    case 'A': return 'risk-a';
    case 'B': return 'risk-b';
    case 'C': return 'risk-c';
    default: return 'risk-unknown';
  }
};

const getEffectClass = (value) => {
  if (value > 0) return 'effect-positive';
  if (value < 0) return 'effect-negative';
  return 'effect-neutral';
};

// DATE
const currentDate = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Nouvelle fonction pour formater la contribution en pourcentage
const formatContribution = (value, total) => {
  if (total === 0 || total === null || total === undefined || value === 0) return '0.0%';
  const percentage = (value / total) * 100;
  return percentage.toFixed(1) + '%';
};

// CHART RENDERING - LTM UNIQUEMENT (YTD est dans YtdChart)
const ltmRefs = ref([]);
const setLtmRef = (el, i) => ltmRefs.value[i] = el;

const drawLtmCharts = () => {
  finalRows.value.forEach((row, i) => {
    const el = ltmRefs.value[i];
    if (!el) return;
    const width = 80;
    const height = 36;
    const svg = d3.select(el);
    svg.attr("width", width).attr("height", height);
    svg.selectAll("*").remove();
    const margin = { top: 2, right: 2, bottom: 2, left: 2 };
    const max = Math.max(...row.ltmVals, 1);
    const x = d3.scaleBand()
      .domain(d3.range(row.ltmVals.length))
      .range([margin.left, width - margin.right])
      .padding(0.05);
    const y = d3.scaleLinear()
      .domain([0, max])
      .range([height - margin.bottom, margin.top]);
    svg.selectAll(".ltm-bar")
      .data(row.ltmVals)
      .enter().append("rect")
      .attr("x", (d, i) => x(i))
      .attr("y", d => y(d))
      .attr("width", x.bandwidth())
      .attr("height", d => height - margin.bottom - y(d))
      .attr("fill", "#333333")
      .attr("opacity", 0.7);
  });
};

watch(finalRows, async () => {
  await nextTick();
  drawLtmCharts();
}, { immediate: true });

onMounted(() => {
  setTimeout(() => {
    drawLtmCharts();
  }, 100);
});
</script>

<style scoped>
/* (style identique à ton code précédent, conservé intégralement) */

.dashboard {
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #333333;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* HEADER */
.header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 0px;
  padding-bottom: 0px;
  width: 100%;
  flex-shrink: 0;
}

.legend {
  display: flex;
  gap: 12px;
  font-size: 11px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.color-box {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

/* TABLE SCROLL CONTAINER */
.table-scroll-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  margin-top: 10px;
}

.table-wrapper {
  flex: 1;
  overflow: auto;
  position: relative;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  background: #FFFFFF;
}

/* TABLE STRUCTURE */
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
}

/* THEAD avec header ET footer fixes */
thead.table-header-fixed {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #FFFFFF;
}

/* En-tête principal */
.table-header {
  background: #F5F7FA;
  border-bottom: 2px solid #1F4E79;
}

.table-header th {
  padding: 8px 6px;
  text-align: center;
  color: #1F4E79;
  border-right: 1px solid #E0E0E0;
  height: 58px;
  vertical-align: middle;
}

/* Footer fixe dans le thead */
.table-footer-fixed {
  background: #F5F7FA;
  border-top: 2px solid #E0E0E0;
  border-bottom: 2px solid #E0E0E0;
  position: sticky;
  top: 58px; /* Hauteur du header */
  z-index: 99;
}

.col-header {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.col-subheader {
  font-size: 10px;
  color: #666666;
  margin-top: 2px;
}

/* COLUMN WIDTHS - IMPORTANT POUR L'ALIGNEMENT */
.col-product { width: 120px; min-width: 120px; }
.col-ltm { width: 120px; min-width: 120px; }
.col-ytd { width: 120px; min-width: 180px; }
.col-actual, 
.col-plan, 
.col-fc { width: 140px; min-width: 100px; }
.col-var { width: 50px; min-width: 90px; }
.col-risk { width: 120px; min-width: 120px; }

/* TBODY scrollable - SANS display:block pour garder l'alignement */
.scrollable-tbody {
  display: table-row-group;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

/* ROWS */
.table-row {
  border-bottom: 1px solid #F0F0F0;
}

.table-row:hover {
  background: #F9F9F9;
}

.table-row td {
  padding: 2px 4px;
  border-right: 1px solid #f0f0f0;
  vertical-align: middle;
  height: 50px;
}

/* PRODUCT CELL */
.cell-product {
  text-align: center;
}

/* PRODUCT ID BUTTON */
.product-id-button {
  cursor: pointer;
  color: #1F4E79;
}
.product-id-button:hover {
  font-weight: bold;
}

.product-id-button:active {
  transform: translateY(0);
}

.product-id-selected {
  background: rgba(46, 94, 170, 0.2) !important;
  border-color: #1F4E79 !important;
  animation: pulse 0.5s;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.product-id-text {
  font-size: 14px;
}

.product-id-icon {
  font-size: 12px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.product-id-button:hover .product-id-icon {
  opacity: 1;
}

/* LIGNE SÉLECTIONNÉE */
.selected-row {
  background: linear-gradient(90deg, rgba(46, 94, 170, 0.1) 0%, rgba(46, 94, 170, 0.05) 100%) !important;
  border-left: 4px solid #1F4E79 !important;
  border-right: 1px solid #1F4E79 !important;
  box-shadow: 0 2px 8px rgba(46, 94, 170, 0.2);
  position: relative;
  z-index: 1;
}

.selected-row:hover {
  background: linear-gradient(90deg, rgba(46, 94, 170, 0.15) 0%, rgba(46, 94, 170, 0.08) 100%) !important;
}

.selected-row td {
  border-color: rgba(46, 94, 170, 0.2) !important;
}

/* Bouton du produit sélectionné */
.selected-row .product-id-button {
  background: rgba(46, 94, 170, 0.2) !important;
  border-color: #1F4E79 !important;
  color: #1F4E79 !important;
  font-weight: 700;
}

.selected-row .product-id-button:hover {
  background: rgba(46, 94, 170, 0.3) !important;
}

/* LTM */
.ltm-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ltm-chart {
  flex-shrink: 0;
}

.ltm-total {
  font-size: 11px;
  color: #333333;
  text-align: right;
  min-width: 35px;
}

/* YTD CHART */
.ytd-chart {
  display: block;
}

/* ACTUAL / PLAN BARS */
.actual-container,
.plan-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.value-actual,
.value-plan,
.value-fc {
  font-size: 11px;
  text-align: right;
  font-family: 'Consolas', 'Monaco', monospace;
}

.value-actual { color: #1F4E79; }
.value-plan   { color: #F28C28; }

/* FORECAST */
.forecast-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.value-fc.forecast-positive { color: #6A9C47; }
.value-fc.forecast-negative { color: #C0504D; }
.value-fc.forecast-neutral  { color: #949494; }

.forecast-description {
  font-size: 9px;
  font-style: italic;
  opacity: 0.8;
  text-align: right;
}

.forecast-description.forecast-positive { color: #6A9C47; }
.forecast-description.forecast-negative { color: #C0504D; }
.forecast-description.forecast-neutral  { color: #949494; }

/* NOUVEAU : Indicateur Forecast vs Plan */
.fc-vs-plan {
  font-size: 9px;
  text-align: right;
  margin-top: 2px;
  padding: 1px 4px;
  border-radius: 2px;
  opacity: 0.8;
}

.fc-vs-plan.positive {
  background: rgba(106, 156, 71, 0.1);
  color: #6A9C47;
}

.fc-vs-plan.negative {
  background: rgba(192, 80, 77, 0.1);
  color: #C0504D;
}

.fc-vs-plan.neutral {
  background: rgba(148, 148, 148, 0.1);
  color: #949494;
}

/* BARS */
.horizontal-bar {
  width: 100%;
  height: 8px;
  background: #F5F5F5;
  border-radius: 2px;
  position: relative;
  overflow: visible;
}

.horizontal-bar.comparison-bar {
  background: linear-gradient(90deg, 
    transparent 0%, 
    transparent 25%, 
    rgba(200, 200, 200, 0.1) 25%, 
    rgba(200, 200, 200, 0.1) 50%, 
    transparent 50%, 
    transparent 75%, 
    rgba(200, 200, 200, 0.1) 75%, 
    rgba(200, 200, 200, 0.1) 100%
  );
}

.bar-fill {
  height: 100%;
  border-radius: 2px;
  position: relative;
  transition: width 0.3s ease;
}

.bar-actual-fill { background: #1F4E79; }
.bar-plan-fill   { background: #F28C28; }

.bar-end {
  position: absolute;
  right: -6px;
  top: -1px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1px solid white;
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.3);
}

.bar-actual-end   { 
  background: #1F4E79; 
  border-color: #FFFFFF;
}

.bar-plan-end     { 
  background: #F28C28; 
  border-color: #FFFFFF;
}

/* FORECAST INDICATOR */
.forecast-indicator {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 2px;
  white-space: nowrap;
}

.forecast-indicator-positive {
  background: rgba(106, 156, 71, 0.1);
  color: #6A9C47;
}

.forecast-indicator-negative {
  background: rgba(192, 80, 77, 0.1);
  color: #C0504D;
}

.forecast-indicator-neutral {
  background: rgba(148, 148, 148, 0.1);
  color: #949494;
}

/* VARIANCE */
.variance-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 11px;
}

.positive {
  background: rgba(106, 156, 71, 0.1);
  color: #6A9C47;
}

.negative {
  background: rgba(192, 80, 77, 0.1);
  color: #C0504D;
}

.neutral {
  background: rgba(148, 148, 148, 0.1);
  color: #949494;
}

.variance-icon {
  font-size: 10px;
}

/* RISK & EFFECTS */
.risk-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.abc-badge {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 10px;
  color: white;
}

.risk-a { background: #C0504D; }
.risk-b { background: #F79646; }
.risk-c { background: #9BBB59; }
.risk-unknown { background: #949494; }

.effects {
  display: flex;
  justify-content: center;
}

.effect-dots {
  display: flex;
  gap: 2px;
}

.effect-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  cursor: help;
  color: white;
}

.effect-positive { background: #6A9C47; }
.effect-negative { background: #C0504D; }
.effect-neutral  { background: #949494; }

/* FOOTER */
.table-footer-fixed td {
  padding: 4px 4px;
  border-right: 1px solid #E0E0E0;
  vertical-align: middle;
  height: 35px;
}

.footer-label {
  text-align: center;
  font-weight: 600;
  color: #1F4E79;
  font-size: 11px;
}

.footer-value {
  text-align: right;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  font-weight: 700;
}

.footer-actual { color: #1F4E79; }
.footer-plan   { color: #F28C28; }

.footer-value-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.footer-scale-note {
  font-size: 9px;
  color: #666666;
  font-style: italic;
  opacity: 0.8;
  margin-top: 2px;
  font-weight: normal;
}

.footer-fc-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.footer-fc-value {
  font-size: 11px;
  font-weight: 700;
  font-family: 'Consolas', 'Monaco', monospace;
}

.footer-fc-vs-plan {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 2px;
  font-weight: normal;
}

.footer-fc-vs-plan.positive {
  background: rgba(106, 156, 71, 0.1);
  color: #6A9C47;
}

.footer-fc-vs-plan.negative {
  background: rgba(192, 80, 77, 0.1);
  color: #C0504D;
}

.footer-fc-vs-plan.neutral {
  background: rgba(148, 148, 148, 0.1);
  color: #949494;
}

/* FOOTER MOBILE (pour le bas du TBODY) */
.table-footer-mobile {
  display: none;
}

.mobile-footer-content {
  padding: 12px;
  background: #F5F7FA;
  border-top: 2px solid #E0E0E0;
}

.mobile-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 11px;
}

.mobile-footer-row span:first-child {
  color: #666;
  font-weight: 600;
}

/* NOTES */
.notes {
  margin-top: 12px;
  padding: 8px 12px;
  background: #F9F9F9;
  border-radius: 3px;
  font-size: 10px;
  color: #666666;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.note { flex: 1; }

.legend-sample {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 8px;
}

.legend-bar {
  width: 16px;
  height: 4px;
  border-radius: 1px;
}

.legend-bar.actual        { background: #1F4E79; }
.legend-bar.plan          { background: #F28C28; }
.legend-bar.forecast-good { background: #6A9C47; }
.legend-bar.forecast-bad  { background: #C0504D; }

.timestamp {
  font-size: 9px;
  color: #949494;
  white-space: nowrap;
  margin-left: 16px;
}

/* RESPONSIVE */
@media (max-width: 1200px) {
  .col-ytd { width: 160px; min-width: 160px; }
  .col-ltm { width: 100px; min-width: 100px; }
  .legend { gap: 8px; }
  
  .table-footer-fixed {
    top: 52px;
  }
}

@media (max-width: 768px) {
  .dashboard {
    height: auto;
  }
  
  .table-scroll-container {
    height: 500px;
  }
  
  .header { 
    flex-direction: column; 
    gap: 12px; 
    justify-content: flex-start;
  }
  
  .legend { 
    align-self: flex-start; 
    justify-content: flex-start; 
  }
  
  .forecast-indicator { display: none; }
  .scale-indicator { display: none; }
  .forecast-description { display: none; }
  .fc-vs-plan { display: none; }
  
  .product-id-button {
    padding: 2px 4px;
  }
  
  .product-id-text {
    font-size: 12px;
  }
  
  .product-id-icon {
    display: none;
  }
  
  /* Sur mobile, masquer le footer fixe et montrer le footer dans le tbody */
  .table-footer-fixed {
    display: none;
  }
  
  .table-footer-mobile {
    display: table-row;
  }
  
  .notes {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .timestamp {
    margin-left: 0;
    align-self: flex-end;
  }
}

/* Custom scrollbar pour le wrapper principal */
.table-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Pour permettre le scroll vertical sur tout le tableau */
.table-scroll-container {
  max-height: 70vh;
  overflow-y: auto;
}

.table-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.table-scroll-container::-webkit-scrollbar-track {
  background: #f9f9f9;
}

.table-scroll-container::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

/* AJOUTS POUR LES CONTRIBUTIONS */
.value-actual-with-contribution,
.value-plan-with-contribution {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.contribution-percentage {
  font-size: 9px;
  color: #666666;
  font-weight: normal;
  opacity: 0.8;
}

/* Pour les lignes sélectionnées */
.selected-row .contribution-percentage {
  color: #1F4E79;
  font-weight: 600;
  opacity: 1;
}

/* Footer contribution */
.footer-contribution {
  font-size: 9px;
  color: #666666;
  font-style: italic;
  opacity: 0.8;
  margin-top: 2px;
  font-weight: normal;
}
</style>