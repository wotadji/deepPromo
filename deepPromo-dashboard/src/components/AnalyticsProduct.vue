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

    <!-- Period COMPLET -->
    <div class="mt-12">
      <label class="block font-medium text-2xl mb-3 text-sky-50">Period</label>
      <div class="flex flex-wrap gap-2 mb-3">
        <button
          v-for="opt in periodTypes"
          :key="opt.value"
          type="button"
          @click="setPeriod(opt.value)"
          :class="[
            'px-4 py-2 rounded cursor-pointer transition',
            period === opt.value ? 'bg-blue-500 text-white' : 'bg-sky-900 text-white border border-blue-500'
          ]"
        >
          {{ opt.label }}
        </button>
      </div>
      <div v-if="period !== 'year' && period" class="mt-2">
        <label class="text-white mb-2 block capitalize">{{ period }}</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in periodOptions[period]"
            :key="opt"
            type="button"
            @click="togglePeriod(opt)"
            :class="[
              'px-3 py-2 rounded cursor-pointer transition',
              periodRange.includes(opt) ? 'bg-blue-500 text-white' : 'bg-sky-900 text-white border border-blue-500'
            ]"
          >
            {{ opt }}
          </button>
        </div>
      </div>
    </div>

    <!-- Granularity -->
    <div class="mt-12">
      <label class="block font-medium text-2xl mb-3 text-sky-50">Granularity</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in granularityOptions"
          :key="opt"
          type="button"
          @click="setGranularity(opt)"
          :class="[
            'px-3 py-2 rounded cursor-pointer transition',
            granularity === opt ? 'bg-blue-500 text-white' : 'bg-sky-900 text-white border border-blue-500'
          ]"
        >
          {{ opt.charAt(0).toUpperCase() + opt.slice(1) }}
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
  period, periodRange, granularity,
  scenarios, years, periodTypes, periodOptions, granularityOptions,
  setPeriod, togglePeriod, setGranularity
} = promptForm
</script>
