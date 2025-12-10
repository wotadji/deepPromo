<template>
  <form @submit.prevent class="space-y-6">
    <!-- Analysis / Reference -->
    <div class="flex gap-5 text-sky-50">
      <div class="w-1/2">
        <label class="block font-medium text-2xl mb-3">Analysis</label>
        <select v-model="ana_scenario" class="mb-4 w-full p-3 border border-blue-500 bg-sky-900 rounded">
          <option v-for="s in scenarios" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
        <select v-model="ana_year" class="w-full p-3 border border-blue-500 bg-sky-900 rounded">
          <option v-for="y in years" :key="y.value" :value="y.value">{{ y.label }}</option>
        </select>
      </div>
      <div class="w-1/2">
        <label class="block font-medium text-2xl mb-3">Reference</label>
        <select v-model="ref_scenario" class="mb-4 w-full p-3 border border-blue-500 bg-sky-900 rounded">
          <option v-for="s in scenarios" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
        <select v-model="ref_year" class="w-full p-3 border border-blue-500 bg-sky-900 rounded">
          <option v-for="y in years" :key="y.value" :value="y.value">{{ y.label }}</option>
        </select>
      </div>
    </div>

    <!-- Period : MOIS SEULEMENT -->
    <div class="mt-12">
      <label class="block font-medium text-2xl mb-3 text-sky-50">Period (Mois)</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="month in monthOptions"
          :key="month"
          type="button"
          @click="toggleMonth(month)"
          :class="[
            'px-4 py-2 rounded cursor-pointer transition',
            selectedMonths.includes(month) 
              ? 'bg-blue-500 text-white' 
              : 'bg-sky-900 text-white border border-blue-500 hover:bg-blue-600'
          ]"
        >
          {{ month }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup>
import { inject } from 'vue'
const promptForm = inject('promptForm')
const {
  ana_scenario, ana_year, ref_scenario, ref_year,
  scenarios, years, monthOptions, selectedMonths, toggleMonth
} = promptForm
</script>
