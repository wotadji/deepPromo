// src/composables/useFilters.js
import { ref, computed } from "vue"

export function useFilters() {
  const scenarios = [
    { value: "ACTUAL_OFFICIAL", label: "ACTUAL OFFICIAL" },
    { value: "FLASH_OFFICIAL", label: "FLASH OFFICIAL" },
    { value: "BUDGET_OFFICIAL", label: "BUDGET OFFICIAL" },
    { value: "FLASH_RESTATED", label: "FLASH RESTATED" }
  ]

  const years = [
    { value: 2025, label: "2025" },
    { value: 2024, label: "2024" },
    { value: 2023, label: "2023" }
  ]

  // 🔥 VALEURS PAR DÉFAUT = 1ÈRE OPTION
  const ana_scenario = ref(scenarios[0].value)  // "ACTUAL_OFFICIAL"
  const ana_year = ref(years[0].value)          // 2025
  const ref_scenario = ref(scenarios[0].value)  // "ACTUAL_OFFICIAL"  
  const ref_year = ref(years[0].value)          // 2025

  const period = ref("")
  const periodRange = ref([])
  const granularity = ref("")

  const periodTypes = [
    { value: "year", label: "Year" },
    { value: "month", label: "Month" },
    { value: "quarter", label: "Quarter" },
    { value: "trimestre", label: "Trimestre" },
    { value: "semester", label: "Semester" }
  ]

  const periodOptions = {
    month: ["M01","M02","M03","M04","M05","M06","M07","M08","M09","M10","M11","M12"],
    quarter: ["Q1","Q2","Q3","Q4"],
    trimestre: ["T1","T2","T3","T4"],
    semester: ["S1","S2"]
  }

  const granularityOptions = ["country","region","department","city","bu"]

  // 🔥 resetForm utilise les 1ères valeurs
  const resetForm = () => {
    ana_scenario.value = scenarios[0].value
    ana_year.value = years[0].value
    ref_scenario.value = scenarios[0].value
    ref_year.value = years[0].value
    period.value = ""
    periodRange.value = []
    granularity.value = ""
  }

  // ... reste identique ...
  const isReady = computed(() =>
    ana_scenario.value &&
    ana_year.value &&
    ref_scenario.value &&
    ref_year.value &&
    period.value &&
    granularity.value
  )

  const setPeriod = (value) => {
    period.value = value
    periodRange.value = []
  }

  const togglePeriod = (opt) => {
    const idx = periodRange.value.indexOf(opt)
    if (idx === -1) periodRange.value.push(opt)
    else periodRange.value.splice(idx, 1)
  }

  const setGranularity = (opt) => { granularity.value = opt }

  const buildParams = () => {
    const params = {
      ana_scenario: ana_scenario.value,
      ana_year: ana_year.value,
      ref_scenario: ref_scenario.value,
      ref_year: ref_year.value,
      period: period.value,
      periodRange: periodRange.value.join(","),
      bu: granularity.value,
      mode: selectedMode.value
    }
    if (period.value && period.value !== "year" && periodRange.value.length > 0) {
      params[period.value] = periodRange.value.join(",")
    }
    console.log('🔗 URL params:', params)
    return params
  }

  return {
    ana_scenario, ana_year, ref_scenario, ref_year,
    period, periodRange, granularity,
    scenarios, years, periodTypes, periodOptions, granularityOptions,
    isReady,
    setPeriod, togglePeriod, setGranularity, resetForm, buildParams
  }
}
