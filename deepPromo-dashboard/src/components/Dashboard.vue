<template>
  <div class="page">
    <!-- HEADER IBCS -->
    <div class="page-header bg-sky-900">
      <div class="logo-container">
        <img :src="logoImage" alt="Deep Primis" class="logo" />
      </div>
      
      <div class="controls-container">
        <div class="scenario-selectors">
          <!-- ANALYSIS -->
          <div class="scenario-group">
            <label class="scenario-label">ANALYSIS</label>
            <div class="scenario-display" @click="toggleAnaMenu">
              <span class="scenario-name">{{ anaScenarioLabel }}</span>
              <span class="scenario-year">{{ anaYearLabel }}</span>
              <span class="scenario-arrow">▼</span>
            </div>
            
            <div v-if="anaMenuOpen" class="scenario-menu">
              <div class="menu-header">Edit Analysis</div>
              <div class="menu-content">
                <div class="form-group">
                  <label>Scenario</label>
                  <select v-model="ana_scenario" class="select">
                    <option
                      v-for="s in scenarios"
                      :key="s.value"
                      :value="s.value"
                    >
                      {{ s.label }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Year</label>
                  <select v-model="ana_year" class="select">
                    <option
                      v-for="y in years"
                      :key="y.value"
                      :value="y.value"
                    >
                      {{ y.label }}
                    </option>
                  </select>
                </div>
                <div class="menu-actions">
                  <button @click="saveAna" class="btn-primary">Apply</button>
                  <button @click="anaMenuOpen = false" class="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="vs">VS</div>
          
          <!-- REFERENCE -->
          <div class="scenario-group">
            <label class="scenario-label">REFERENCE</label>
            <div class="scenario-display" @click="toggleRefMenu">
              <span class="scenario-name">{{ refScenarioLabel }}</span>
              <span class="scenario-year">{{ refYearLabel }}</span>
              <span class="scenario-arrow">▼</span>
            </div>
            
            <div v-if="refMenuOpen" class="scenario-menu">
              <div class="menu-header">Edit Reference</div>
              <div class="menu-content">
                <div class="form-group">
                  <label>Scenario</label>
                  <select v-model="ref_scenario" class="select">
                    <option
                      v-for="s in scenarios"
                      :key="s.value"
                      :value="s.value"
                    >
                      {{ s.label }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Year</label>
                  <select v-model="ref_year" class="select">
                    <option
                      v-for="y in years"
                      :key="y.value"
                      :value="y.value"
                    >
                      {{ y.label }}
                    </option>
                  </select>
                </div>
                <div class="menu-actions">
                  <button @click="saveRef" class="btn-primary">Apply</button>
                  <button @click="refMenuOpen = false" class="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- SETTINGS -->
          <div class="settings-container">
            <div class="relative">
              <button 
                @click="toggleMenu" 
                class="settings-button" 
                :class="{ 'settings-button-active': menuOpen }"
                aria-label="Settings"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-5 h-5"
                >
                  <path 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" 
                  />
                  <path 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" 
                  />
                </svg>
              </button>
              
              <div 
                v-if="menuOpen"
                class="settings-menu"
              >
                <button 
                  @click="resetAndGoHome"
                  class="settings-menu-item"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke-width="1.5" 
                    stroke="currentColor" 
                    class="w-4 h-4"
                  >
                    <path 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" 
                    />
                  </svg>
                  Reset Settings
                </button>
                
                <button 
                  @click="exportData"
                  class="settings-menu-item"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke-width="1.5" 
                    stroke="currentColor" 
                    class="w-4 h-4"
                  >
                    <path 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" 
                    />
                  </svg>
                  Export Data
                </button>
                
                <div class="settings-menu-divider"></div>
                
                <button 
                  @click="openHelp"
                  class="settings-menu-item"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke-width="1.5" 
                    stroke="currentColor" 
                    class="w-4 h-4"
                  >
                    <path 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" 
                    />
                  </svg>
                  Help & Documentation
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Period Selector IBCS -->
        <div class="period-selector mt-4">
          <div class="period-display" @click="openPeriodModal">
            <span class="period-type">
              PERIOD :
              <span class="scenario-year" style="font-size: 12px;">
                {{ displayPeriod }}
              </span>
            </span>
            <span v-if="periodRange.length" class="period-range">
              ({{ periodRange.join(', ') }})
            </span>
            <span class="period-arrow">▼</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- MAIN CONTENT EN 2 COLONNES -->
    <div class="page-content-grid">
      <!-- COLONNE GAUCHE (2/3) - DASHBOARD -->
      <div class="dashboard-column">
        <!-- Loading State -->
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading data...</div>
        </div>
        
        <!-- Error State -->
        <div v-else-if="error" class="error">
          <div class="error-icon">⚠️</div>
          <div class="error-text">{{ error }}</div>
          <button @click="fetchMetrics" class="btn-secondary">Retry</button>
        </div>
        
        <!-- Data Loaded -->
        <div v-else-if="data && data.length > 0">
          <!-- BiTable Component -->
          <div class="table-wrapper">
            <BiTable 
              :data="data" 
              :anaScenarioLabel="anaScenarioLabel" 
              :anaYearLabel="anaYearLabel" 
              :refScenarioLabel="refScenarioLabel" 
              :refYearLabel="refYearLabel" 
              :selectedProduct="selectedProductId"
              @productSelected="handleProductSelected"
            />
          </div>
          
          <!-- Active Filters IBCS -->
          <div class="active-filters">
            <h3 class="filters-title">Active Filters</h3>
            <div class="filters-grid">
              <div class="filter-item">
                <span class="filter-label">Analysis:</span>
                <span class="filter-value">
                  {{ anaScenarioLabel }} ({{ anaYearLabel }})
                </span>
              </div>
              <div class="filter-item">
                <span class="filter-label">Reference:</span>
                <span class="filter-value">
                  {{ refScenarioLabel }} ({{ refYearLabel }})
                </span>
              </div>
              <div class="filter-item">
                <span class="filter-label">Period:</span>
                <span class="filter-value">
                  {{ displayPeriod }}
                  <span v-if="periodRange.length">
                    {{ periodRange.join(', ') }}
                  </span>
                </span>
              </div>
              <div class="filter-item">
                <span class="filter-label">Granularity:</span>
                <span class="filter-value">{{ granularityLabel }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- No Data -->
        <div v-else class="no-data">
          <div class="no-data-icon">📊</div>
          <div class="no-data-text">No data available for selected filters</div>
          <button @click="resetFilters" class="btn-primary">Reset Filters</button>
        </div>
      </div>
      
      <!-- COLONNE DROITE (1/3) - NLG -->
      <div class="nlg-column">
        <NlgPanel 
          :data="data"
          :filters="currentFilters"
          :anaYearLabel="anaYearLabel"
          :refYearLabel="refYearLabel"
          :selectedProduct="selectedProductId"
          @productSelected="handleProductSelected"
          @analysisGenerated="handleAnalysisGenerated"
          @error="handleNlgError"
          @refreshRequested="handleRefreshRequested"
        />
      </div>
    </div>
    
    <!-- Period Modal IBCS -->
    <div v-if="periodModalOpen" class="modal-overlay" @click="closePeriodModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Period Selection</h2>
          <button @click="closePeriodModal" class="modal-close">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="period-types">
            <button
              v-for="opt in periodTypes"
              :key="opt.value"
              @click="setPeriod(opt.value)"
              :class="[
                'period-type-btn',
                period === opt.value ? 'period-type-active' : ''
              ]"
            >
              {{ opt.label }}
            </button>
          </div>
          
          <div v-if="period !== 'year' && period" class="period-options">
            <h3 class="options-title">Select {{ period }}</h3>
            <div class="options-grid">
              <button
                v-for="opt in periodOptions[period]"
                :key="opt"
                @click="togglePeriod(opt)"
                :class="[
                  'period-option',
                  periodRange.includes(opt) ? 'period-option-active' : ''
                ]"
              >
                {{ opt }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closePeriodModal" class="btn-secondary">Cancel</button>
          <button @click="savePeriod" class="btn-primary">Apply Selection</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

import logoImage from '../assets/logo.png'
import { useFilters } from '@/composables/useFilters'
import BiTable from '@/components/BiTable.vue'
import NlgPanel from '@/components/NlgPanel.vue'

// =========== STATE API ===========
const loading = ref(true)
const error = ref(null)
const data = ref([])
const selectedProductId = ref('')

// =========== COMPOSABLES FILTRES ===========
const {
  ana_scenario, ana_year, ref_scenario, ref_year,
  period, periodRange, granularity,
  resetForm, setPeriod, togglePeriod, periodTypes, periodOptions, buildParams,
  scenarios, years, granularityOptions
} = useFilters()

// Router + route courante
const router = useRouter()
const route = useRoute()

// Menus
const anaMenuOpen = ref(false)
const refMenuOpen = ref(false)
const periodModalOpen = ref(false)
const menuOpen = ref(false)

// ====== HELPERS POUR MENUS ======
const closeAllMenus = () => {
  anaMenuOpen.value = false
  refMenuOpen.value = false
  menuOpen.value = false
}

const toggleAnaMenu = () => {
  anaMenuOpen.value = !anaMenuOpen.value
  refMenuOpen.value = false
  menuOpen.value = false
}

const toggleRefMenu = () => {
  refMenuOpen.value = !refMenuOpen.value
  anaMenuOpen.value = false
  menuOpen.value = false
}

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
  anaMenuOpen.value = false
  refMenuOpen.value = false
}

const openPeriodModal = () => {
  periodModalOpen.value = true
  menuOpen.value = false
}

const closePeriodModal = () => {
  periodModalOpen.value = false
}

// ====== ROUTE SYNC (UN SEUL POINT) ======
const updateRouteWithFilters = (extra = {}) => {
  const params = {
    ...buildParams(),
    ...(selectedProductId.value ? { product_id: selectedProductId.value } : {}),
    ...extra
  }
  router.push({ name: route.name, query: params })
}

// ====== SETTINGS ACTIONS ======
const resetAndGoHome = () => {
  resetForm()
  selectedProductId.value = ''
  closeAllMenus()
  router.push({ name: 'PromptForm' })
}

const exportData = () => {
  if (!data.value || !data.value.length) {
    console.warn('No data to export')
    menuOpen.value = false
    return
  }
  try {
    const blob = new Blob([JSON.stringify(data.value, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'bi_metrics_export.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Export error:', e)
  } finally {
    menuOpen.value = false
  }
}

const openHelp = () => {
  // Ici tu peux remplacer par un vrai lien de doc ou une route interne
  console.log('Open help / documentation panel')
  menuOpen.value = false
}

// ====== LABELS UI ======
const anaScenarioLabel = computed(() => {
  const found = scenarios?.find(s => s.value === ana_scenario.value)
  return found?.label || ana_scenario.value || 'Actual'
})

const refScenarioLabel = computed(() => {
  const found = scenarios?.find(s => s.value === ref_scenario.value)
  return found?.label || ref_scenario.value || 'Plan'
})

const anaYearLabel = computed(() => {
  const val = Number(ana_year.value)
  const found = years?.find(y => y.value === val)
  return found?.label || ana_year.value || 'Current'
})

const refYearLabel = computed(() => {
  const val = Number(ref_year.value)
  const found = years?.find(y => y.value === val)
  return found?.label || ref_year.value || 'Previous'
})

const displayPeriod = computed(() => {
  if (!period.value) return '—'
  return period.value.charAt(0).toUpperCase() + period.value.slice(1)
})

const granularityLabel = computed(() => {
  const found = granularityOptions?.find(g => g.value === granularity.value)
  return found?.label || granularity.value || '—'
})

// Filtres courants pour le NLG
const currentFilters = computed(() => ({
  ana_scenario: ana_scenario.value,
  ana_year: ana_year.value,
  ref_scenario: ref_scenario.value,
  ref_year: ref_year.value,
  period: period.value,
  periodRange: periodRange.value,
  granularity: granularity.value,
  product_id: selectedProductId.value || null
}))

// ====== SAUVEGARDE DES FILTRES ======
const saveAna = () => {
  updateRouteWithFilters()
  anaMenuOpen.value = false
}

const saveRef = () => {
  updateRouteWithFilters()
  refMenuOpen.value = false
}

const savePeriod = () => {
  updateRouteWithFilters()
  closePeriodModal()
}

const resetFilters = () => {
  resetForm()
  selectedProductId.value = ''
  updateRouteWithFilters()
}

// ====== HANDLERS NLG / TABLE ======
const handleProductSelected = (productId) => {
  console.log('Product selected in Dashboard:', productId)
  selectedProductId.value = productId || ''
  updateRouteWithFilters({ product_id: productId || undefined })
}

const handleAnalysisGenerated = (analysis) => {
  console.log('Analysis generated:', analysis)
}

const handleNlgError = (err) => {
  console.error('NLG error:', err)
}

const handleRefreshRequested = () => {
  console.log('Refresh requested from NLG panel')
  fetchMetrics()
}

// ====== API CALL ======
const fetchMetrics = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await axios.get('http://localhost:3000/metrics', {
      params: route.query
    })
    data.value = res.data?.data || []
  } catch (err) {
    console.error('API error', err)
    error.value = 'Error loading data'
  } finally {
    loading.value = false
  }
}

// ====== HYDRATATION DES FILTRES DEPUIS L’URL ======
const hydrateFromQuery = (q) => {
  if (q.ana_scenario) ana_scenario.value = q.ana_scenario
  if (q.ana_year) ana_year.value = Number(q.ana_year)
  if (q.ref_scenario) ref_scenario.value = q.ref_scenario
  if (q.ref_year) ref_year.value = Number(q.ref_year)

  if (q.period) setPeriod(q.period)

  let list = []
  if (q.periodRange) {
    list = String(q.periodRange)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  } else if (q.period && q[q.period]) {
    list = String(q[q.period])
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  }

  periodRange.value = []
  if (period.value) {
    const validOpts = periodOptions[period.value] || []
    list.forEach(opt => {
      if (validOpts.includes(opt) && !periodRange.value.includes(opt)) {
        periodRange.value.push(opt)
      }
    })
  }

  if (q.granularity) granularity.value = q.granularity

  if (q.product_id) {
    selectedProductId.value = q.product_id
  } else {
    selectedProductId.value = ''
  }
}

// ====== CYCLE DE VIE ======
onMounted(() => {
  hydrateFromQuery(route.query)
  fetchMetrics()
})

// Si l’URL change (back/forward, lien partagé, etc.)
watch(
  () => route.query,
  (q) => {
    hydrateFromQuery(q)
    fetchMetrics()
  },
  { deep: true }
)
</script>

<style scoped>
/* IBCS PAGE STYLES */
.page {
  min-height: 100vh;
  background: #F5F7FA;
  font-family: 'Segoe UI', Arial, sans-serif;
}

/* HEADER */
.page-header {
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.logo-container {
  flex-shrink: 0;
}

.logo {
  height: 40px;
}

.controls-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

/* SCENARIO SELECTORS */
.scenario-selectors {
  display: flex;
  align-items: center;
  gap: 10px;
}

.scenario-group {
  position: relative;
}

.scenario-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
  margin-bottom: 4px;
  display: block;
}

.scenario-display {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
  min-width: 160px;
}

.scenario-display:hover {
  background: rgba(255, 255, 255, 0.15);
}

.scenario-name {
  font-weight: 200;
  flex: 1;
}

.scenario-year {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.scenario-arrow {
  font-size: 10px;
  opacity: 0.7;
}

.vs {
  font-size: 12px;
  opacity: 0.6;
  font-weight: 200;
  padding-top: 25px;
}

/* SETTINGS CONTAINER */
.settings-container {
  margin-left: 8px;
  align-self: flex-end;
}

.settings-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.settings-button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.settings-button-active {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.settings-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
  border: 1px solid #E0E0E0;
}

.settings-menu-item {
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.settings-menu-item:hover {
  background: #F5F7FA;
}

.settings-menu-divider {
  height: 1px;
  background: #E0E0E0;
  margin: 4px 0;
}

/* SCENARIO MENU */
.scenario-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 240px;
}

.menu-header {
  padding: 12px 16px;
  background: #2E5EAA;
  color: white;
  font-weight: 600;
  border-radius: 4px 4px 0 0;
}

.menu-content {
  padding: 16px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
}

.select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #D0D0D0;
  border-radius: 3px;
  font-size: 13px;
}

.menu-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

/* PERIOD SELECTOR */
.period-selector {
  position: relative;
}

.period-display {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 10px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 13px;
}

.period-display:hover {
  background: rgba(255, 255, 255, 0.15);
}

.period-type {
  font-weight: 200;
}

.period-range {
  opacity: 0.8;
  font-size: 12px;
}

.period-arrow {
  font-size: 10px;
  opacity: 0.7;
}

/* CONTENU EN 2 COLONNES */
.page-content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  padding: 24px;
  min-height: calc(100vh - 100px);
}

.dashboard-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.nlg-column {
  display: flex;
  flex-direction: column;
}

/* TABLE WRAPPER */
.table-wrapper {
  margin-bottom: 24px;
}

/* LOADING, ERROR, NO DATA STATES */
.loading,
.error,
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #2E5EAA;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #666;
  font-size: 14px;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.error-text {
  color: #C0504D;
  margin-bottom: 16px;
  font-size: 14px;
}

.no-data-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.no-data-text {
  color: #666;
  margin-bottom: 16px;
  font-size: 14px;
}

/* ACTIVE FILTERS */
.active-filters {
  background: white;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filters-title {
  font-size: 16px;
  font-weight: 600;
  color: #2E5EAA;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F0F0F0;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.filter-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

/* BUTTONS */
.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #2E5EAA;
  color: white;
}

.btn-primary:hover {
  background: #24488C;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(46, 94, 170, 0.2);
}

.btn-secondary {
  background: #F0F0F0;
  color: #333;
  border: 1px solid #D0D0D0;
}

.btn-secondary:hover {
  background: #E0E0E0;
}

/* MODAL */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 20px 24px;
  background: #2E5EAA;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  padding: 20px 24px;
  background: #F9F9F9;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* PERIOD SELECTION IN MODAL */
.period-types {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 32px;
}

.period-type-btn {
  padding: 12px 20px;
  background: #F5F7FA;
  border: 2px solid #E0E0E0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  flex: 1;
  min-width: 120px;
}

.period-type-btn:hover {
  background: #E8F0FE;
  border-color: #2E5EAA;
}

.period-type-active {
  background: #2E5EAA;
  color: white;
  border-color: #2E5EAA;
}

.period-type-active:hover {
  background: #24488C;
  border-color: #24488C;
}

.options-title {
  font-size: 16px;
  margin-bottom: 16px;
  color: #333;
  font-weight: 600;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

.period-option {
  padding: 10px;
  background: white;
  border: 2px solid #E0E0E0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  text-align: center;
  transition: all 0.2s;
}

.period-option:hover {
  background: #F5F7FA;
  transform: translateY(-2px);
}

.period-option-active {
  background: #2E5EAA;
  color: white;
  border-color: #2E5EAA;
}

/* RESPONSIVE */
@media (max-width: 1200px) {
  .page-content-grid {
    grid-template-columns: 1.5fr 1fr;
    gap: 20px;
    padding: 20px;
  }
}

@media (max-width: 992px) {
  .page-content-grid {
    grid-template-columns: 1fr;
  }
  
  .nlg-column {
    order: -1;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .controls-container {
    align-items: stretch;
  }
  
  .scenario-selectors {
    flex-direction: column;
    gap: 12px;
  }
  
  .settings-container {
    align-self: center;
    margin-left: 0;
    margin-top: 8px;
  }
  
  .period-display {
    width: 100%;
    justify-content: space-between;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .period-types {
    justify-content: center;
  }
  
  .period-type-btn {
    min-width: 100px;
  }
  
  .options-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 480px) {
  .page-content-grid {
    padding: 16px;
    gap: 16px;
  }
  
  .options-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .modal {
    width: 95%;
  }
}
</style>
