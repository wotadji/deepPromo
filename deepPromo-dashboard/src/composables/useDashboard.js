// src/composables/useDashboard.js
import { ref, watch } from "vue"
import { useRoute } from "vue-router"
import axios from "axios"

export function useDashboard() {
  const route = useRoute()

  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Fonction pour charger les données API
  const fetchData = async () => {
    loading.value = true
    error.value = null
    try {
      console.log("📥 Paramètres envoyés à l'API :", route.query)
      const res = await axios.get("http://localhost:3000/metrics", {
        params: route.query
      })
      console.log("📊 Résultats API :", res.data)
      data.value = res.data
    } catch (err) {
      console.error("❌ Erreur Dashboard API :", err)
      error.value = err
    } finally {
      loading.value = false
    }
  }

  // 🔄 Recharger automatiquement quand l’URL change
  watch(
    () => route.query,
    () => {
      fetchData()
    },
    { immediate: true } // lance aussi au montage
  )

  return {
    data,
    loading,
    error,
    fetchData // exposé si tu veux déclencher manuellement
  }
}
