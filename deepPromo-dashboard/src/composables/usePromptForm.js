import { ref, computed } from 'vue'
import { useFilters } from '@/composables/useFilters'
import { useRouter } from 'vue-router'

export function usePromptForm() {
  const router = useRouter()

  // Mode sélectionné (items ou analytics)
  const selectedMode = ref('analytics')

  // Utilisation du composable useFilters
  const filters = useFilters()
  const {
    ana_scenario, ana_year, ref_scenario, ref_year,
    period, periodRange, granularity,
    scenarios, years, periodTypes, periodOptions, granularityOptions,
    setPeriod, togglePeriod, setGranularity, resetForm: resetFilters, buildParams
  } = filters

  // Mois spécifiques pour Items Product
  const monthOptions = ['M01','M02','M03','M04','M05','M06','M07','M08','M09','M10','M11','M12']
  const selectedMonths = ref([])

  const toggleMonth = (month) => {
    const index = selectedMonths.value.indexOf(month)
    if (index > -1) {
      selectedMonths.value.splice(index, 1)
    } else {
      selectedMonths.value.push(month)
    }
    periodRange.value = selectedMonths.value
  }

  // Permet de changer de mode
  const switchToItems = () => {
    selectedMode.value = 'items'
    granularity.value = null
    period.value = 'month'
  }

  const switchToAnalytics = () => {
    selectedMode.value = 'analytics'
    selectedMonths.value = []
  }

  // isReady dépend selon mode
  const isReady = computed(() => {
    if (selectedMode.value === 'items') {
      return ana_scenario.value && ana_year.value && selectedMonths.value.length > 0
    }
    return filters.isReady.value
  })

  // On modifie buildParams pour inclure le mode sélectionné
  const buildParamsWithMode = () => {
    const params = {
      ana_scenario: ana_scenario.value,
      ana_year: ana_year.value,
      ref_scenario: ref_scenario.value,
      ref_year: ref_year.value,
      period: period.value,
      periodRange: periodRange.value.join(","),
      bu: granularity.value,
      mode: selectedMode.value  // Ajout mode dans les paramètres
    }
    if (period.value && period.value !== "year" && periodRange.value.length > 0) {
      params[period.value] = periodRange.value.join(",")
    }
    return params
  }

  // Soumet le formulaire, redirige vers Dashboard avec paramètres
  const submitForm = () => {
    if (!isReady.value) return
    const params = buildParamsWithMode()
    router.push({ name: 'Dashboard', query: params })
  }

  return {
    selectedMode,
    switchToItems,
    switchToAnalytics,
    ana_scenario,
    ana_year,
    ref_scenario,
    ref_year,
    period,
    periodRange,
    granularity,
    scenarios,
    years,
    periodTypes,
    periodOptions,
    granularityOptions,
    monthOptions,
    selectedMonths,
    toggleMonth,
    setPeriod,
    togglePeriod,
    setGranularity,
    isReady,
    submitForm,
    resetForm: resetFilters
  }
}
