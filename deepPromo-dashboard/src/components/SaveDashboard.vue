<template>
  <div>
    <!-- Header -->
    <div class="flex w-screen bg-sky-900 m-0 p-0 px-12" style="height: 130px;">
      <!-- Logo -->
      <div class="w-1/3 flex flex-col justify-between">
        <p class="text-2xl font-bold w-full pt-9">
          <img
            :src="logoImage"
            alt="Deep Primis"
            style="width: 220px;"
            class="h-full object-cover object-center"
          />
        </p>
      </div>

      <!-- Zone Settings -->
      <div class="w-2/3 flex flex-col items-end pt-2">
        <div class="relative">
          <!-- Bouton icône -->
          <button @click="toggleMenu" class="p-2 rounded hover:bg-sky-800" aria-label="Open settings">
            <!-- icône -->
            <svg xmlns="http://www.w3.org/2000/svg"
                 fill="none"
                 viewBox="0 0 24 24"
                 stroke-width="1.5"
                 stroke="currentColor"
                 class="w-6 h-6 text-white">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43 .992a7.723 7.723 0 0 1 0 .255c-.008 .378 .137 .75 .43 .991l1.004 .827c.424 .35 .534 .955 .26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369 .491l-1.217 -.456c-.355 -.133 -.75 -.072 -1.076 .124a6.47 6.47 0 0 1-.22 .128c-.331 .183 -.581 .495 -.644 .869l-.213 1.281c-.09 .543 -.56 .94 -1.11 .94h-2.594c-.55 0-1.019 -.398 -1.11 -.94l-.213 -1.281c-.062 -.374 -.312 -.686 -.644 -.87a6.52 6.52 0 0 1-.22 -.127c-.325 -.196 -.72 -.257 -1.076 -.124l-1.217 .456a1.125 1.125 0 0 1-1.369 -.49l-1.297 -2.247a1.125 1.125 0 0 1 .26 -1.431l1.004 -.827c.292 -.24 .437 -.613 .43 -.991a6.932 6.932 0 0 1 0 -.255c.007 -.38 -.138 -.751 -.43 -.992l-1.004 -.827a1.125 1.125 0 0 1-.26 -1.43l1.297 -2.247a1.125 1.125 0 0 1 1.37 -.491l1.216 .456c.356 .133 .751 .072 1.076 -.124 .072 -.044 .146 -.086 .22 -.128 .332 -.183 .582 -.495 .644 -.869 l.214 -1.28Z" />
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>

          <!-- Menu déroulant -->
          <div v-if="menuOpen"
               class="absolute right-0 mt-0 w-48 bg-gray-300 border border-sky-700 rounded shadow-lg z-20">
            <button @click="resetAndGoHome"
                    class="block w-full text-left px-4 py-2 pl-9 hover:bg-sky-800 hover:text-white">
              Reset Settings
            </button>
          </div>
        </div>

        <!-- Bouton période -->
        <div class="mt-2">
          <button @click="openPeriodModal"
                  class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Period : {{ displayPeriod }} {{ periodRange.join(', ') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bandeau résumé -->
    <div class="mx-12">
      <div class="flex">
        <div class="w-1/6 p-3 flex flex-col items-center justify-center rounded-b-lg border border-sky-900">
          Proformat: Margin
        </div>

        <!-- Bloc Analysis -->
        <div class="w-2/6 p-3 flex items-center justify-between rounded-b-lg border border-sky-900 relative">
          <span class="flex-1 text-center">{{ anaScenarioLabel }} - {{ anaYearLabel }}</span>
          <button @click="toggleAnaMenu" class="ml-2 text-sky-900 hover:text-blue-300" aria-label="Edit analysis">▼</button>

          <!-- Menu déroulant Analysis -->
          <div v-if="anaMenuOpen"
               class="absolute right-0 top-full mt-0 w-full bg-white border border-sky-900 rounded shadow-lg z-20">
            <div class="p-8">
              <label class="block text-xs font-semibold mb-1">Scenario</label>
              <select v-model="ana_scenario" class="w-full p-2 border rounded">
                <option v-for="s in scenarios" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
              <label class="block text-xs font-semibold mt-3 mb-1">Year</label>
              <select v-model="ana_year" class="w-full p-2 border rounded">
                <option v-for="y in years" :key="y.value" :value="y.value">{{ y.label }}</option>
              </select>
              <div class="flex gap-2 mt-3">
                <button @click="saveAna" class="flex-1 bg-blue-500 text-white py-1 rounded">OK</button>
                <button @click="anaMenuOpen=false" class="flex-1 bg-gray-200 py-1 rounded">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Bloc Reference -->
        <div class="w-2/6 p-3 flex items-center justify-between rounded-b-lg border border-sky-900 relative">
          <span class="flex-1 text-center">{{ refScenarioLabel }} - {{ refYearLabel }}</span>
          <button @click="toggleRefMenu" class="ml-2 text-sky-900 hover:text-blue-300" aria-label="Edit reference">▼</button>

          <!-- Menu déroulant Reference -->
          <div v-if="refMenuOpen"
               class="absolute right-0 top-full mt-0 w-full bg-white border border-sky-900 rounded shadow-lg z-20">
            <div class="p-8">
              <label class="block text-xs font-semibold mb-1">Scenario</label>
              <select v-model="ref_scenario" class="w-full p-2 border rounded">
                <option v-for="s in scenarios" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
              <label class="block text-xs font-semibold mt-3 mb-1">Year</label>
              <select v-model="ref_year" class="w-full p-2 border rounded">
                <option v-for="y in years" :key="y.value" :value="y.value">{{ y.label }}</option>
              </select>
              <div class="flex gap-2 mt-3">
                <button @click="saveRef" class="flex-1 bg-blue-500 text-white py-1 rounded">OK</button>
                <button @click="refMenuOpen=false" class="flex-1 bg-gray-200 py-1 rounded">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <div class="w-1/6 flex flex-col items-center justify-center rounded-b-lg border border-sky-900">
          f
        </div>
      </div>

      <!-- Résumé des filtres -->
      

      <!--chart -->
      <!-- <div class="my-12">
        <ProductYtdLines :data="data" title="📊 YTD Analysis vs Reference - 14 Produits" />
      </div> -->

        <div class="my-12">
          <BiTable :data="data" :anaScenarioLabel="anaScenarioLabel" :anaYearLabel="anaYearLabel" :refScenarioLabel="refScenarioLabel" :refYearLabel="refYearLabel" />
        </div>





      <!-- Données API -->
      <div v-if="loading" class="flex items-center justify-center py-6">
        <svg class="animate-spin h-16 w-16 text-sky-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      </div>
      <!-- <div v-else-if="error" class="text-red-500 text-lg">
        Erreur lors du chargement ❌
      </div>
      <div v-else class="text-green-400 text-lg">
        📊 Données reçues : {{ data }}
      </div>  -->
      <br />
      <div class="bg-sky-900 p-4 rounded mb-6">
        <h2 class="text-2xl font-semibold mb-2 text-white">Filtres utilisés :</h2>
        <ul class="list-disc list-inside text-lg text-white">
          <li>Analysis : {{ anaScenarioLabel }} ({{ anaYearLabel }})</li>
          <li>Reference : {{ refScenarioLabel }} ({{ refYearLabel }})</li>
          <li>
            Period : {{ displayPeriod }}
            <span v-if="periodRange.length"> ({{ periodRange.join(', ') }})</span>
          </li>
          <li>Granularity : {{ granularityLabel }}</li>
        </ul>
      </div>
    </div>

    <!-- Modal Period -->
    <div v-if="periodModalOpen" class="fixed inset-0 flex items-center justify-center z-30">
      <div class="absolute inset-0 bg-black/50"></div>

      <div class="relative bg-white rounded-lg shadow-lg w-[90%] max-w-3xl">
        <!-- Header -->
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h2 class="text-xl font-bold">Period</h2>
          <button @click="closePeriodModal" class="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <!-- Body -->
        <div class="p-6">
          <!-- Choix du type -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in periodTypes"
              :key="opt.value"
              @click="setPeriod(opt.value)"
              :class="[
                'px-4 py-2 rounded',
                period === opt.value ? 'bg-blue-500 text-white' : 'bg-gray-200'
              ]"
            >
              {{ opt.label }}
            </button>
          </div>

          <!-- Choix des sous-périodes -->
          <div v-if="period !== 'year' && period" class="mt-4">
            <label class="block mb-2 font-semibold capitalize">{{ period }}</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in periodOptions[period]"
                :key="opt"
                @click="togglePeriod(opt)"
                :class="[
                  'px-3 py-2 rounded',
                  periodRange.includes(opt) ? 'bg-blue-500 text-white' : 'bg-gray-200'
                ]"
              >
                {{ opt }}
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t flex justify-end gap-4">
          <button @click="closePeriodModal" class="px-4 py-2 bg-gray-300 rounded">Fermer</button>
          <button @click="savePeriod" class="px-4 py-2 bg-blue-500 text-white rounded">Enregistrer</button>
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
// import ProductYtdLines from '@/components/ProductYtdLines.vue'
import BiTable from '@/components/BiTable.vue'


// ======= State API =======
const loading = ref(true)
const error = ref(null)
const data = ref([])

// ======= Composables Filtres =======
const {
  ana_scenario, ana_year, ref_scenario, ref_year,
  period, periodRange, granularity,
  resetForm, setPeriod, togglePeriod, periodTypes, periodOptions, buildParams,
  scenarios, years, granularityOptions
} = useFilters()

// Router + route courante
const router = useRouter()
const route = useRoute()

// Menu déroulant global
const menuOpen = ref(false)
const toggleMenu = () => { menuOpen.value = !menuOpen.value }

// Reset + redirection vers home
const resetAndGoHome = () => {
  resetForm()
  router.push({ name: 'PromptForm' })
  menuOpen.value = false
}

// Modal Period
const periodModalOpen = ref(false)
const openPeriodModal = () => { periodModalOpen.value = true }
const closePeriodModal = () => { periodModalOpen.value = false }

// Affichage Period
const displayPeriod = computed(() => period.value || '—')

// Helper: label depuis value
const getLabel = (list, value) => {
  const found = Array.isArray(list)
    ? list.find(item => typeof item === 'object' ? item.value === value : item === value)
    : null
  if (!found) return value ?? '—'
  return typeof found === 'object' ? found.label : found
}

// Labels computed
const anaScenarioLabel = computed(() => getLabel(scenarios, ana_scenario.value))
const refScenarioLabel = computed(() => getLabel(scenarios, ref_scenario.value))
const anaYearLabel = computed(() => getLabel(years, Number(ana_year.value)))
const refYearLabel = computed(() => getLabel(years, Number(ref_year.value)))
const granularityLabel = computed(() => getLabel(granularityOptions, granularity.value))

// Hydrate les filtres depuis la query
const hydrateFromQuery = (q) => {
  if (q.ana_scenario) ana_scenario.value = q.ana_scenario
  if (q.ana_year) ana_year.value = Number(q.ana_year)
  if (q.ref_scenario) ref_scenario.value = q.ref_scenario
  if (q.ref_year) ref_year.value = Number(q.ref_year)

  if (q.period) setPeriod(q.period)

  let list = []
  if (q.periodRange) {
    list = String(q.periodRange).split(',').map(s => s.trim()).filter(Boolean)
  } else if (q.period && q[q.period]) {
    list = String(q[q.period]).split(',').map(s => s.trim()).filter(Boolean)
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

  if (q.bu) granularity.value = q.bu
  else if (q.granularity) granularity.value = q.granularity
}

// Menus Analysis / Reference
const anaMenuOpen = ref(false)
const refMenuOpen = ref(false)
const toggleAnaMenu = () => { anaMenuOpen.value = !anaMenuOpen.value }
const toggleRefMenu = () => { refMenuOpen.value = !refMenuOpen.value }

// Sauvegardes Analysis / Reference
const saveAna = () => {
  const params = buildParams()
  router.push({ name: route.name, query: params })
  anaMenuOpen.value = false
}
const saveRef = () => {
  const params = buildParams()
  router.push({ name: route.name, query: params })
  refMenuOpen.value = false
}

// Sauvegarde de la période
const savePeriod = () => {
  const params = buildParams()
  router.push({
    name: route.name,
    query: params
  })
  closePeriodModal()
}

// Fetch API
const fetchMetrics = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await axios.get('http://localhost:3000/metrics', {
      params: route.query
    })
    data.value = res.data?.data || []
    console.log('📊 API Results:', data.value)
    // renderTreemap(data.value) si tu as une fonction d’affichage
  } catch (err) {
    console.error('❌ API error', err)
    error.value = 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

// Hydratation + fetch initial
onMounted(() => {
  hydrateFromQuery(route.query)
  fetchMetrics()
})

// Réagir aux changements de query (filtres)
watch(
  () => route.query,
  (q) => {
    hydrateFromQuery(q)
    fetchMetrics()
  },
  { deep: true }
)
// Détection automatique des clés YTD
const anaYtdKey = computed(() => {
  if (data.value[0]) {
    return Object.keys(data.value[0]).find(k => k.toLowerCase().includes('anaytd') || k.toLowerCase().includes('ana_ytd')) || 'ana_ytd'
  }
  return 'ana_ytd'
})

const refYtdKey = computed(() => {
  if (data.value[0]) {
    return Object.keys(data.value[0]).find(k => k.toLowerCase().includes('refytd') || k.toLowerCase().includes('ref_ytd')) || 'ref_ytd'
  }
  return 'ref_ytd'
})

</script>

<style scoped>
#treemap {
  background: #f8f8f8;
}
</style>
