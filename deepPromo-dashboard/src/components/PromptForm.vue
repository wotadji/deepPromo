<template>
  <div class="flex w-screen min-h-screen bg-gray-100 m-0 p-0">
    <!-- Bloc gauche -->
    <div class="w-4/7 bg-sky-900 flex flex-col justify-between">
       <div class="flex w-full">
            <div class="w-1/2" style="padding-top: 20px;">
                <div class="text-2xl font-bold w-full ml-6">
                    <img :src="logoImage" alt="Deep Primis" style="width: 220px;" class="h-full object-cover object-center" />
                </div>
            </div>
            <div class="w-1/2 flex justify-end" style="padding-top: 18px;">
                <!-- PROGRES EN CERCEAU -->
                <div class="mb-8 mr-6">
                    <div class="relative text-sm">
                        <!-- Cercle de fond -->
                        <div class="w-12 h-12 border-2 rounded-full flex items-center justify-center font-bold text-gray-500">
                            {{ currentStep }}/2
                        </div>
                        <!-- Cercle de progression (rempli) -->
                        <div 
                            class="absolute inset-0 rounded-full flex items-center justify-center to-sky-500 text-white font-bold border-2 border-blue-500"
                            :class="{ 'w-full h-full': currentStep === 2, 'w-12 h-12': currentStep === 1 }"
                        >
                            {{ currentStep }}/2
                        </div>
                    </div>
                </div>
            </div>
        </div>
     
      <div v-if="modeSelected" class="mb-8">
            <span class="text-xl font-semibold text-sky-50 ml-8">
                ... {{ selectedMode === 'items' ? 'Items Product' : 'Analytics Product' }} 
            </span>
      </div>
      <div class="max-w-2xl ml-8 mr-8 flex-1" style="margin-top: 24px;">
        <!-- ÉTAPE 1 :Mode d'analyse (1/2) -->
        <div v-if="!modeSelected" class="mb-8 ml-0">
          <label class="font-medium text-2xl mb-4 text-sky-50 text-center">Analysis mode</label>
          <div class="flex gap-4 mt-4">
            <button
              @click="selectItemsMode"
              class="px-12 py-4 rounded-lg font-semibold text-xl transition-all text-white border border-blue-500 hover:bg-sky-950 hover:border-blue-300 shadow-lg"
            >
              Items Product
            </button>
            <button
              @click="selectAnalyticsMode"
              class="px-12 py-4 rounded-lg font-semibold text-xl transition-all text-white border border-blue-500 hover:bg-sky-950 hover:border-blue-300 shadow-lg"
            >
              Analytics Product
            </button>
          </div>
        </div>

        <!-- 🔥 ÉTAPE 2 : ItemsProduct (2/2) -->
        <ItemsProduct v-if="modeSelected && selectedMode === 'items'" />

        <!-- 🔥 ÉTAPE 2 : AnalyticsProduct (2/2) -->
        <AnalyticsProduct v-if="modeSelected && selectedMode === 'analytics'" />
      </div>

      <!-- Footer DYNAMIQUE -->
      <div class="flex justify-between mt-6 m-0 p-0 bg-sky-950">
        <button
          v-if="modeSelected"
          @click="goBackToSelection"
          class="bg-blue-600 text-white px-8 py-3 rounded hover:bg-blue-700 hover:scale-105 transition-all shadow-md"
        >
          ← Back
        </button>
        <button
          v-else
          @click="resetForm"
          class="bg-sky-950 text-white px-6 py-3 rounded hover:text-blue-300"
        >
          Reset
        </button>

        <button
          v-if="modeSelected && isReady"
          @click="submitForm"
          class="bg-green-800 text-white px-8 py-3 rounded hover:bg-green-600 hover:scale-105 transition-all shadow-lg font-semibold"
        >
          Go >>
        </button>
      </div>
    </div>

    <!-- Bloc droit -->
    <div class="w-full lg:w-3/7 relative overflow-hidden h-auto lg:h-screen">
      <img :src="backgroundImage" alt="DeepPromo Background" class="w-full h-full object-cover object-center" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, provide, watch } from 'vue'  // 🔥 AJOUT watch
import { useRouter } from 'vue-router'
import backgroundImage from '../assets/background.jpg'
import logoImage from '../assets/logo.png'
import ItemsProduct from './ItemsProduct.vue'
import AnalyticsProduct from './AnalyticsProduct.vue'
import { usePromptForm } from '@/composables/usePromptForm'

// Composable
const promptForm = usePromptForm()
const {
  selectedMode, switchToItems, switchToAnalytics, isReady, submitForm, resetForm,
  monthOptions, selectedMonths, toggleMonth,
  ana_scenario, ana_year, ref_scenario, ref_year,
  period, periodRange, granularity,
  scenarios, years, periodTypes, periodOptions, granularityOptions,
  setPeriod, togglePeriod, setGranularity
} = promptForm

// Logique navigation
const modeSelected = ref(false)

const selectItemsMode = () => {
  switchToItems()
  modeSelected.value = true
}

const selectAnalyticsMode = () => {
  switchToAnalytics()
  modeSelected.value = true
}

const goBackToSelection = () => {
  modeSelected.value = false
  resetForm()
}

// 🔥 PROGRES : 1/2 (50%) ou 2/2 (100%)
const currentStep = computed(() => modeSelected.value ? 2 : 1)
const progressValue = computed(() => (currentStep.value / 2) * 100)
const radius = 45
const circumference = radius * 2 * Math.PI
const offset = computed(() => circumference - (progressValue.value / 100) * circumference)

// 🔥 DEBUG watch (OPTIONNEL - peut être supprimé)
watch(selectedMode, (newMode) => {
  console.log('🎯 Mode sélectionné:', newMode.value || newMode)
})

// Provide pour enfants
provide('promptForm', {
  ana_scenario, ana_year, ref_scenario, ref_year,
  period, periodRange, granularity, selectedMonths,
  scenarios, years, periodTypes, periodOptions, granularityOptions, monthOptions,
  toggleMonth, setPeriod, togglePeriod, setGranularity
})
</script>


<style scoped>
/* Animation douce pour le cercle */
@keyframes progressFill {
  from { transform: scale(0.5); opacity: 0.5; }
  to { transform: scale(1); opacity: 1; }
}

div[class*="w-"] {
  animation: progressFill 0.3s ease-out;
}
</style>
