<template>
  <div class="nlg-panel">
    <!-- En-tête -->
    <div class="nlg-header">
      <div class="header-content">
        <div class="header-main">
          <h3 style="color: black;" class="nlg-title">
            Natural language Analysis
          </h3>
        </div>
        <div class="header-actions">
          <button 
            v-if="selectedProductId && !nlgLoading"
            @click="toggleHelp"
            class="help-button"
            :title="showHelp ? 'Masquer l\'aide' : 'Afficher l\'aide'"
          >
            {{ showHelp ? '✕' : '?' }}
          </button>
        </div>
      </div>
      
      <!-- Aide contextuelle -->
      <div v-if="showHelp" class="help-section">
        <div class="help-content">
          <p><strong>Comment utiliser :</strong></p>
          <ul>
            <li>Cliquez sur un ID produit dans le tableau pour l'analyser</li>
            <li>L'analyse IA se génère automatiquement</li>
            <li>Utilisez les boutons pour copier ou télécharger</li>
            <li>Les produits récents sont sauvegardés pour accès rapide</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Produit actuellement sélectionné -->
    <div v-if="selectedProductId" class="current-product-section">
      <div class="product-display">
        <div class="product-info">
          <div class="product-id-display">
            <span class="product-id">{{ selectedProductId }}</span>
            <span class="product-status" :class="getStatusClass(analysisSummary?.performance)">
              {{ getStatusText(analysisSummary?.performance) }}
            </span>
          </div>
        </div>
        
        <div class="toolbar-right">
          <div class="toolbar-actions">
            <button 
              @click="copyToClipboard"
              class="toolbar-button copy-btn"
              :class="{ 'success': copiedToClipboard }"
              :title="copiedToClipboard ? 'Copié !' : 'Copier le rapport'"
            >
              <span class="button-icon">{{ copiedToClipboard ? '✓' : '📋' }}</span>
              <span class="button-text">Copier</span>
            </button>
            
            <button 
              @click="downloadAnalysis"
              class="toolbar-button download-btn"
              title="Télécharger le rapport"
            >
              <span class="button-icon">⬇️</span>
              <span class="button-text">PDF</span>
            </button>
            
            <button 
              @click="shareAnalysis"
              class="toolbar-button share-btn"
              v-if="canShare"
              title="Partager l'analyse"
            >
              <span class="button-icon">↗️</span>
              <span class="button-text">Partager</span>
            </button>
            
            <button 
              @click="toggleFullscreen"
              class="toolbar-button fullscreen-btn"
              :title="isFullscreen ? 'Quitter le plein écran' : 'Plein écran'"
            >
              <span class="button-icon">{{ isFullscreen ? '✕' : '⛶' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="nlgLoading" class="loading-state">
      <div class="loading-content">
        <div class="loading-animation">
          <div class="loading-spinner-large"></div>
          <div class="loading-pulse"></div>
        </div>
        <div class="loading-text">
          <div class="loading-title">Génération de l'analyse...</div>
          <div class="loading-subtitle">
            Analyse du produit <strong>{{ selectedProductId }}</strong>
          </div>
          <div class="loading-steps">
            <div class="step" :class="{ 'active': currentStep >= 1 }">Collecte des données</div>
            <div class="step" :class="{ 'active': currentStep >= 2 }">Analyse des tendances</div>
            <div class="step" :class="{ 'active': currentStep >= 3 }">Génération des insights</div>
            <div class="step" :class="{ 'active': currentStep >= 4 }">Formatage du rapport</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenu de l'analyse -->
    <div v-else-if="nlgText && selectedProductId" class="analysis-content">
      <!-- Barre d'outils d'analyse -->
      

      <!-- Contenu de l'analyse -->
      <div class="analysis-text-container" :class="{ 'fullscreen': isFullscreen }" ref="analysisContainer">
        <div class="analysis-text-content" v-html="formattedNlgText"></div>
      </div>

      <!-- Actions supplémentaires -->
      <div class="additional-actions">
        <button @click="saveToFavorites" class="secondary-button favorite-btn">
          <span class="button-icon">⭐</span>
          <span class="button-text">Ajouter aux favoris</span>
        </button>
        
        <button @click="exportToExcel" class="secondary-button excel-btn">
          <span class="button-icon">📊</span>
          <span class="button-text">Exporter données</span>
        </button>
        
        <button @click="scheduleReport" class="secondary-button schedule-btn">
          <span class="button-icon">🕒</span>
          <span class="button-text">Planifier rapport</span>
        </button>
      </div>
    </div>

    <!-- État vide / instructions -->
    <div v-else class="empty-state">
      <div class="empty-state-content">
        <div class="empty-state-icon">👆</div>
        
        <div class="empty-state-text">
          <h4>Sélectionnez un Produit</h4>
          <p>
            Cliquez sur un ID produit dans le tableau pour générer une analyse détaillée 
            avec insights IA et recommandations personnalisées.
          </p>
        </div>
        
        <div class="empty-state-features">
          <div class="feature">
            <div class="feature-icon">🤖</div>
            <div class="feature-content">
              <div class="feature-title">Analyse IA</div>
              <div class="feature-desc">Insights automatiques générés</div>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">📈</div>
            <div class="feature-content">
              <div class="feature-title">Recommandations</div>
              <div class="feature-desc">Actions concrètes proposées</div>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">💡</div>
            <div class="feature-content">
              <div class="feature-title">Prévisions</div>
              <div class="feature-desc">Tendances et projections</div>
            </div>
          </div>
        </div>
        
        <!-- Historique récent -->
        <div v-if="recentProducts.length > 0" class="recent-products-section">
          <div class="recent-title">
            <span class="recent-icon">🕒</span>
            Produits récemment analysés
          </div>
          <div class="recent-products-list">
            <button 
              v-for="product in recentProducts" 
              :key="product.id"
              @click="selectRecentProduct(product.id)"
              class="recent-product-item"
            >
              <div class="recent-product-info">
                <span class="recent-product-id">{{ product.id }}</span>
                <span class="recent-product-time">{{ product.time }}</span>
              </div>
              <span class="recent-product-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mode plein écran -->
    <div v-if="isFullscreen" class="fullscreen-overlay" @click.self="toggleFullscreen">
      <div class="fullscreen-container">
        <div class="fullscreen-header">
          <div class="fullscreen-title">
            <h3>Analyse Produit: {{ selectedProductId }}</h3>
            <div class="fullscreen-subtitle">
              Générée le {{ formattedTimestamp }} | Performance: {{ analysisSummary?.performance || 'N/A' }}
            </div>
          </div>
          <button @click="toggleFullscreen" class="close-fullscreen">
            ✕ Fermer
          </button>
        </div>
        <div class="fullscreen-content" v-html="formattedNlgText"></div>
      </div>
    </div>

    <!-- Notifications -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <div class="notification-content">
        <span class="notification-icon">
          {{ notification.type === 'success' ? '✓' : '⚠️' }}
        </span>
        <span class="notification-text">{{ notification.message }}</span>
      </div>
      <button @click="hideNotification" class="notification-close">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import axios from 'axios'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  filters: {
    type: Object,
    required: true,
    default: () => ({})
  },
  selectedProduct: {
    type: String,
    default: ''
  },
  anaYearLabel: {
    type: String,
    default: 'Actuel'
  },
  refYearLabel: {
    type: String,
    default: 'Référence'
  }
})

const emit = defineEmits(['refreshRequested', 'error', 'productSelected'])

// Références
const selectedProductId = ref('')
const nlgText = ref('')
const nlgLoading = ref(false)
const analysisSummary = ref(null)
const copiedToClipboard = ref(false)
const generatedTimestamp = ref(null)
const recentProducts = ref([])
const showHelp = ref(false)
const compareMode = ref(false)
const isFullscreen = ref(false)
const currentStep = ref(0)
const notification = ref({
  show: false,
  message: '',
  type: 'info'
})

// Watch pour la prop selectedProduct
watch(() => props.selectedProduct, (newProduct) => {
  console.log('NlgPanel - Watch triggered - newProduct:', newProduct);
  if (newProduct && newProduct !== selectedProductId.value) {
    selectedProductId.value = newProduct
    console.log('NlgPanel - Generating NLG analysis for:', newProduct);
    generateNlgAnalysis()
    
    // Ajouter à l'historique récent
    addToRecentProducts(newProduct)
  }
}, { immediate: true })

// Timestamp formaté
const formattedTimestamp = computed(() => {
  if (!generatedTimestamp.value) return 'À l\'instant'
  const date = new Date(generatedTimestamp.value)
  const now = new Date()
  const diffMinutes = Math.floor((now - date) / (1000 * 60))
  
  if (diffMinutes < 1) return 'À l\'instant'
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
  if (diffMinutes < 1440) return `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Texte NLG formaté
const formattedNlgText = computed(() => {
  if (!nlgText.value) return ''
  
  // Transformation Markdown vers HTML avec classes spécifiques
  let html = nlgText.value
  
  // Titres
  html = html.replace(/^# (.*$)/gim, '<h1 class="analysis-h1">$1</h1>')
  html = html.replace(/^## (.*$)/gim, '<h2 class="analysis-h2">$1</h2>')
  html = html.replace(/^### (.*$)/gim, '<h3 class="analysis-h3">$1</h3>')
  
  // Mise en forme
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="analysis-strong">$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em class="analysis-em">$1</em>')
  html = html.replace(/`(.*?)`/g, '<code class="analysis-code">$1</code>')
  
  // Listes
  html = html.replace(/^- (.*$)/gim, '<li class="analysis-li">$1</li>')
  html = html.replace(/(<li class="analysis-li">.*<\/li>)/g, '<ul class="analysis-ul">$1</ul>')
  
  // Paragraphes
  html = html.replace(/\n\n/g, '</p><p class="analysis-p">')
  html = html.replace(/\n/g, '<br>')
  
  // Tableaux (format Markdown simple)
  html = html.replace(/\| (.*?) \|/g, (match, content) => {
    const cells = content.split('|').map(cell => cell.trim()).filter(Boolean)
    if (cells.length >= 2) {
      return `<div class="analysis-row"><span class="analysis-cell">${cells[0]}</span><span class="analysis-cell value">${cells[1]}</span></div>`
    }
    return match
  })
  
  // Ajouter le conteneur
  return `<div class="analysis-content-inner">${html}</div>`
})

// Web Share API disponible
const canShare = computed(() => {
  return navigator.share && !nlgLoading.value
})

// Peut-on comparer ?
const canCompare = computed(() => {
  return recentProducts.value.length > 1 && !nlgLoading.value
})

// Fonctions utilitaires
const formatCurrency = (amount) => {
  if (amount === 0 || amount === null || amount === undefined) return '€0'
  const absAmount = Math.abs(amount)
  if (absAmount >= 1000000) return `€${(amount / 1000000).toFixed(1)}M`
  if (absAmount >= 1000) return `€${(amount / 1000).toFixed(1)}k`
  return `€${Math.round(amount).toLocaleString('fr-FR')}`
}

const formatPercentage = (value) => {
  if (value === null || value === undefined) return '0.0%'
  const num = parseFloat(value)
  if (isNaN(num)) return '0.0%'
  return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`
}

const getVarianceClass = (variance) => {
  const num = parseFloat(variance) || 0
  if (num > 5) return 'positive'
  if (num < -5) return 'negative'
  return 'neutral'
}

const getStatusClass = (performance) => {
  if (!performance) return 'unknown'
  if (performance.includes('EXCELLENTE') || performance.includes('BONNE')) return 'good'
  if (performance.includes('CRITIQUE') || performance.includes('PRÉOCCUPANTE')) return 'bad'
  return 'neutral'
}

const getStatusText = (performance) => {
  if (!performance) return 'Non analysé'
  if (performance.includes('EXCELLENTE')) return 'Excellente'
  if (performance.includes('BONNE')) return 'Bonne'
  if (performance.includes('POSITIVE')) return 'Positive'
  if (performance.includes('NÉGATIVE')) return 'Négative'
  if (performance.includes('PRÉOCCUPANTE')) return 'Préoccupante'
  if (performance.includes('CRITIQUE')) return 'Critique'
  return performance
}

// Gestionnaires
const generateNlgAnalysis = async () => {
  if (!selectedProductId.value) {
    console.log('NlgPanel - No product selected, skipping analysis')
    return
  }
  
  console.log('NlgPanel - Starting NLG analysis for:', selectedProductId.value)
  
  nlgLoading.value = true
  nlgText.value = ''
  analysisSummary.value = null
  currentStep.value = 0
  
  // Simuler la progression
  const progressInterval = setInterval(() => {
    if (currentStep.value < 4) {
      currentStep.value++
    }
  }, 800)
  
  try {
    // Appeler l'API NLG
    console.log('NlgPanel - Calling NLG API with data:', props.data.length, 'rows')
    const response = await axios.post('http://localhost:3000/generate-nlg', {
      productId: selectedProductId.value,
      filters: {
        ...props.filters,
        ana_year_label: props.anaYearLabel,
        ref_year_label: props.refYearLabel
      },
      data: props.data
    })
    
    clearInterval(progressInterval)
    currentStep.value = 4
    
    if (response.data.success) {
      nlgText.value = response.data.analysis
      analysisSummary.value = response.data.summary
      generatedTimestamp.value = new Date().toISOString()
      
      console.log('NlgPanel - Analysis generated successfully')
      
      // Faire défiler vers le haut
      await nextTick()
      const container = document.querySelector('.analysis-text-container')
      if (container) {
        container.scrollTop = 0
      }
      
      showNotification('Analyse générée avec succès', 'success')
    } else {
      throw new Error(response.data.error || 'Échec de la génération')
    }
    
  } catch (error) {
    console.error('Erreur génération NLG:', error)
    
    // Générer une analyse d'erreur
    nlgText.value = generateErrorAnalysis(error)
    analysisSummary.value = {
      productId: selectedProductId.value,
      performance: 'ERREUR',
      classification: 'N/A',
      variance: 0,
      anaTotal: 0,
      refTotal: 0,
      color: '#C0504D'
    }
    generatedTimestamp.value = new Date().toISOString()
    
    showNotification('Erreur lors de la génération', 'error')
    emit('error', error)
  } finally {
    nlgLoading.value = false
  }
}

const generateErrorAnalysis = (error) => {
  return `# ⚠️ ERREUR DE GÉNÉRATION D'ANALYSE

## 🔴 PROBLÈME TECHNIQUE
Impossible de générer l'analyse pour le produit **${selectedProductId.value}**.

## 🛠️ DÉTAILS DE L'ERREUR
\`\`\`
${error.message}
\`\`\`

## 🔄 ACTIONS CORRECTIVES
1. **Vérifier la connexion** - Assurez-vous de la connectivité serveur
2. **Réessayer** - Tentative de génération dans quelques instants
3. **Contacter le support** - Si le problème persiste

## 📞 ASSISTANCE TECHNIQUE
Pour assistance technique, veuillez fournir:
- ID Produit: ${selectedProductId.value}
- Heure: ${new Date().toLocaleTimeString('fr-FR')}
- Code erreur: ${error.code || 'N/A'}

---

*Erreur survenue le ${new Date().toLocaleDateString('fr-FR')}*`
}

const refreshAnalysis = () => {
  if (selectedProductId.value) {
    emit('refreshRequested', selectedProductId.value)
    generateNlgAnalysis()
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(nlgText.value)
    copiedToClipboard.value = true
    showNotification('Rapport copié dans le presse-papier', 'success')
    
    setTimeout(() => {
      copiedToClipboard.value = false
    }, 3000)
  } catch (error) {
    console.error('Échec de la copie:', error)
    // Fallback pour anciens navigateurs
    const textArea = document.createElement('textarea')
    textArea.value = nlgText.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    
    copiedToClipboard.value = true
    showNotification('Rapport copié', 'success')
    setTimeout(() => {
      copiedToClipboard.value = false
    }, 3000)
  }
}

const downloadAnalysis = () => {
  if (!nlgText.value) return
  
  // Créer un PDF simplifié
  const content = `
    Analyse Produit: ${selectedProductId.value}
    Générée le: ${new Date().toLocaleDateString('fr-FR')}
    Performance: ${analysisSummary.value?.performance || 'N/A'}
    
    ${nlgText.value}
  `
  
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analyse_produit_${selectedProductId.value}_${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  showNotification('Rapport téléchargé', 'success')
}

const shareAnalysis = async () => {
  if (!canShare.value || !nlgText.value) return
  
  try {
    await navigator.share({
      title: `Analyse Produit: ${selectedProductId.value}`,
      text: nlgText.value.substring(0, 200) + '...',
      url: window.location.href
    })
    showNotification('Analyse partagée', 'success')
  } catch (error) {
    console.error('Erreur partage:', error)
    showNotification('Erreur lors du partage', 'error')
  }
}

const addToRecentProducts = (productId) => {
  // Vérifier si déjà dans la liste
  const existingIndex = recentProducts.value.findIndex(p => p.id === productId)
  
  if (existingIndex !== -1) {
    // Déplacer en premier
    const [existing] = recentProducts.value.splice(existingIndex, 1)
    recentProducts.value.unshift(existing)
  } else {
    // Ajouter en premier
    recentProducts.value.unshift({
      id: productId,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString()
    })
  }
  
  // Garder seulement les 5 plus récents
  if (recentProducts.value.length > 5) {
    recentProducts.value.pop()
  }
  
  // Sauvegarder dans localStorage
  localStorage.setItem('nlgRecentProducts', JSON.stringify(recentProducts.value))
}

const selectRecentProduct = (productId) => {
  selectedProductId.value = productId
  emit('productSelected', productId)
  generateNlgAnalysis()
}

const toggleHelp = () => {
  showHelp.value = !showHelp.value
}

const toggleCompareMode = () => {
  compareMode.value = !compareMode.value
  showNotification('Mode comparaison ' + (compareMode.value ? 'activé' : 'désactivé'), 'info')
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const saveToFavorites = () => {
  const favorites = JSON.parse(localStorage.getItem('nlgFavorites') || '[]')
  
  if (!favorites.find(fav => fav.id === selectedProductId.value)) {
    favorites.push({
      id: selectedProductId.value,
      name: `Produit ${selectedProductId.value}`,
      added: new Date().toISOString(),
      performance: analysisSummary.value?.performance || 'N/A'
    })
    
    localStorage.setItem('nlgFavorites', JSON.stringify(favorites))
    showNotification('Ajouté aux favoris', 'success')
  } else {
    showNotification('Déjà dans les favoris', 'info')
  }
}

const exportToExcel = () => {
  showNotification('Export Excel en développement', 'info')
}

const scheduleReport = () => {
  showNotification('Planification en développement', 'info')
}

const showNotification = (message, type = 'info') => {
  notification.value = {
    show: true,
    message,
    type
  }
  
  setTimeout(() => {
    hideNotification()
  }, 5000)
}

const hideNotification = () => {
  notification.value.show = false
}

// Initialisation
onMounted(() => {
  // Charger l'historique récent
  const savedRecent = localStorage.getItem('nlgRecentProducts')
  if (savedRecent) {
    recentProducts.value = JSON.parse(savedRecent)
  }
  
  // Vérifier si un produit est pré-sélectionné dans l'URL
  const urlParams = new URLSearchParams(window.location.search)
  const productParam = urlParams.get('product_id')
  if (productParam) {
    selectedProductId.value = productParam
    generateNlgAnalysis()
  }
})
</script>

<style scoped>
.nlg-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Header */
.nlg-header {
  padding: 16px 20px;
  color: white;
  position: relative;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-main {
  flex: 1;
}

.nlg-title {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 20px;
}

.nlg-subtitle {
  font-size: 13px;
  opacity: 0.9;
  font-weight: 300;
}

.header-actions {
  margin-top: -4px;
}

.help-button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.help-button:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
}

.help-section {
  margin-top: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.help-content {
  font-size: 12px;
  line-height: 1.5;
}

.help-content ul {
  margin: 8px 0 0 0;
  padding-left: 18px;
}

.help-content li {
  margin: 4px 0;
}

/* Current Product Section */
.current-product-section {
  padding: 16px 20px;
  background: #F8FAFC;
  border-bottom: 1px solid #E8ECF1;
}

.product-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.product-info {
  flex: 1;
}

.product-label {
  font-size: 12px;
  color: #64748B;
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-icon {
  font-size: 14px;
}

.product-id-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-id {
  font-size: 20px;
  font-weight: 700;
  color: #2E5EAA;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.product-status {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.product-status.good {
  background: rgba(106, 156, 71, 0.1);
  color: #6A9C47;
  border: 1px solid rgba(106, 156, 71, 0.3);
}

.product-status.bad {
  background: rgba(192, 80, 77, 0.1);
  color: #C0504D;
  border: 1px solid rgba(192, 80, 77, 0.3);
}

.product-status.neutral {
  background: rgba(148, 148, 148, 0.1);
  color: #949494;
  border: 1px solid rgba(148, 148, 148, 0.3);
}

.product-status.unknown {
  background: rgba(100, 116, 139, 0.1);
  color: #64748B;
  border: 1px solid rgba(100, 116, 139, 0.3);
}

.product-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
}

.refresh-btn {
  background: #2E5EAA;
  color: white;
  border-color: #2E5EAA;
}

.refresh-btn:hover:not(:disabled) {
  background: #24488C;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(46, 94, 170, 0.2);
}

.refresh-btn:disabled {
  background: #95B8E7;
  cursor: not-allowed;
  opacity: 0.7;
}

.compare-btn {
  background: white;
  color: #475569;
  border-color: #CBD5E1;
}

.compare-btn:hover {
  background: #F1F5F9;
  border-color: #94A3B8;
}

.compare-btn.active {
  background: #3B82F6;
  color: white;
  border-color: #3B82F6;
}

.action-icon {
  font-size: 14px;
}

.action-text {
  white-space: nowrap;
}

.refresh-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Quick Metrics */
.quick-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.metric-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #CBD5E1;
}

.metric-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  background: #F1F5F9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 11px;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  font-weight: 600;
}

.metric-value {
  font-size: 16px;
  font-weight: 700;
  color: #1E293B;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.metric-value.positive {
  color: #6A9C47;
}

.metric-value.negative {
  color: #C0504D;
}

.metric-value.neutral {
  color: #F79646;
}

.abc-value.abc-a {
  color: #C0504D;
  font-weight: 800;
}

.abc-value.abc-b {
  color: #F79646;
  font-weight: 700;
}

.abc-value.abc-c {
  color: #9BBB59;
  font-weight: 600;
}

/* Loading State */
.loading-state {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 1;
  background: #F8FAFC;
}

.loading-content {
  max-width: 500px;
}

.loading-animation {
  position: relative;
  margin-bottom: 24px;
}

.loading-spinner-large {
  width: 60px;
  height: 60px;
  border: 3px solid #E2E8F0;
  border-top-color: #2E5EAA;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
  margin: 0 auto;
}

.loading-pulse {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border: 2px solid rgba(46, 94, 170, 0.1);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.5;
  }
}

.loading-title {
  font-size: 18px;
  color: #2E5EAA;
  margin-bottom: 8px;
  font-weight: 600;
}

.loading-subtitle {
  font-size: 14px;
  color: #64748B;
  margin-bottom: 24px;
}

.loading-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 300px;
  margin: 0 auto;
}

.step {
  font-size: 13px;
  color: #94A3B8;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
  text-align: left;
  position: relative;
  padding-left: 32px;
  transition: all 0.3s;
}

.step:before {
  content: '';
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #E2E8F0;
  transition: all 0.3s;
}

.step.active {
  color: #2E5EAA;
  border-color: #2E5EAA;
  background: rgba(46, 94, 170, 0.05);
}

.step.active:before {
  background: #2E5EAA;
  box-shadow: 0 0 0 3px rgba(46, 94, 170, 0.2);
}

/* Analysis Content */
.analysis-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.analysis-toolbar {
  padding: 12px 20px;
  background: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  flex: 1;
}

.analysis-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.analysis-title h4 {
  margin: 0;
  font-size: 16px;
  color: #1E293B;
  font-weight: 600;
}

.analysis-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toolbar-right {
  flex-shrink: 0;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.toolbar-button {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #CBD5E1;
  background: white;
  color: #475569;
}

.toolbar-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.copy-btn:hover {
  background: #E8F4FF;
  border-color: #2E5EAA;
  color: #2E5EAA;
}

.copy-btn.success {
  background: #6A9C47;
  border-color: #6A9C47;
  color: white;
}

.download-btn:hover {
  background: #F0FFF0;
  border-color: #6A9C47;
  color: #6A9C47;
}

.share-btn:hover {
  background: #FFF0F5;
  border-color: #D15B8F;
  color: #D15B8F;
}

.fullscreen-btn:hover {
  background: #F1F5F9;
  border-color: #94A3B8;
}

.button-icon {
  font-size: 14px;
}

.button-text {
  white-space: nowrap;
}

/* Analysis Text Container */
.analysis-text-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: white;
  position: relative;
}

.analysis-text-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  padding: 40px;
  background: white;
}

.analysis-text-content {
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.7;
  color: #334155;
}

:deep(.analysis-content-inner) {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

:deep(.analysis-h1) {
  font-size: 24px;
  color: #2E5EAA;
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  border-bottom: 2px solid #E2E8F0;
  font-weight: 700;
}

:deep(.analysis-h2) {
  font-size: 20px;
  color: #1E293B;
  margin: 32px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #E2E8F0;
  font-weight: 600;
}

:deep(.analysis-h3) {
  font-size: 16px;
  color: #2E5EAA;
  margin: 24px 0 12px 0;
  font-weight: 600;
}

:deep(.analysis-p) {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #475569;
}

:deep(.analysis-strong) {
  color: #2E5EAA;
  font-weight: 600;
}

:deep(.analysis-em) {
  color: #64748B;
  font-style: italic;
}

:deep(.analysis-code) {
  background: #F1F5F9;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: #334155;
}

:deep(.analysis-ul) {
  margin: 16px 0;
  padding-left: 24px;
}

:deep(.analysis-li) {
  margin: 8px 0;
  color: #475569;
  font-size: 14px;
}

:deep(.analysis-row) {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #F1F5F9;
}

:deep(.analysis-cell) {
  font-size: 13px;
}

:deep(.analysis-cell.value) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 600;
  color: #2E5EAA;
}

/* Additional Actions */
.additional-actions {
  padding: 16px 20px;
  background: #F8FAFC;
  border-top: 1px solid #E2E8F0;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.secondary-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #CBD5E1;
  background: white;
  color: #475569;
}

.secondary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.favorite-btn:hover {
  background: #FFF8E6;
  border-color: #FBBF24;
  color: #D97706;
}

.excel-btn:hover {
  background: #F0FFF4;
  border-color: #6A9C47;
  color: #6A9C47;
}

.schedule-btn:hover {
  background: #F3F4F6;
  border-color: #9CA3AF;
  color: #4B5563;
}

/* Empty State */
.empty-state {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 1;
  background: #F8FAFC;
}

.empty-state-content {
  max-width: 500px;
}

.empty-state-icon {
  font-size: 48px;
  opacity: 0.2;
  margin-bottom: 20px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-state-text h4 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #1E293B;
  font-weight: 600;
}

.empty-state-text p {
  font-size: 14px;
  color: #64748B;
  line-height: 1.6;
  margin-bottom: 32px;
}

.empty-state-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 40px;
}

.feature {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.feature:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.feature-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  background: #F1F5F9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-content {
  text-align: center;
}

.feature-title {
  font-size: 13px;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 4px;
}

.feature-desc {
  font-size: 11px;
  color: #64748B;
}

/* Recent Products */
.recent-products-section {
  width: 100%;
  max-width: 400px;
  margin-top: 32px;
}

.recent-title {
  font-size: 12px;
  color: #64748B;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.recent-icon {
  font-size: 14px;
}

.recent-products-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-product-item {
  padding: 12px 16px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}

.recent-product-item:hover {
  background: #F1F5F9;
  border-color: #CBD5E1;
  transform: translateX(4px);
}

.recent-product-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-product-id {
  font-size: 14px;
  font-weight: 600;
  color: #2E5EAA;
  font-family: 'Consolas', 'Monaco', monospace;
}

.recent-product-time {
  font-size: 11px;
  color: #94A3B8;
}

.recent-product-arrow {
  font-size: 14px;
  color: #94A3B8;
  transition: transform 0.2s;
}

.recent-product-item:hover .recent-product-arrow {
  transform: translateX(4px);
  color: #2E5EAA;
}

/* Fullscreen Overlay */
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.fullscreen-container {
  flex: 1;
  background: white;
  margin: 20px;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fullscreen-header {
  padding: 20px 24px;
  background: #2E5EAA;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fullscreen-title h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
}

.fullscreen-subtitle {
  font-size: 13px;
  opacity: 0.9;
}

.close-fullscreen {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s;
}

.close-fullscreen:hover {
  background: rgba(255, 255, 255, 0.3);
}

:deep(.fullscreen-content) {
  flex: 1;
  overflow-y: auto;
  padding: 40px;
  font-size: 16px;
  line-height: 1.8;
}

/* Notifications */
.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  min-width: 300px;
  max-width: 400px;
  z-index: 10001;
  animation: slideInRight 0.3s ease;
  border-left: 4px solid #2E5EAA;
}

.notification.success {
  border-left-color: #6A9C47;
}

.notification.error {
  border-left-color: #C0504D;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.notification-icon {
  font-size: 16px;
}

.notification.success .notification-icon {
  color: #6A9C47;
}

.notification.error .notification-icon {
  color: #C0504D;
}

.notification-text {
  font-size: 14px;
  color: #334155;
  flex: 1;
}

.notification-close {
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  margin-left: 8px;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #475569;
}

/* Responsive */
@media (max-width: 768px) {
  .product-display {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .product-actions {
    justify-content: flex-start;
  }
  
  .quick-metrics {
    grid-template-columns: 1fr;
  }
  
  .toolbar-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .additional-actions {
    flex-direction: column;
  }
  
  .empty-state-features {
    grid-template-columns: 1fr;
  }
  
  .fullscreen-container {
    margin: 10px;
  }
  
  :deep(.fullscreen-content) {
    padding: 20px;
  }
  
  .notification {
    left: 20px;
    right: 20px;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .nlg-title {
    font-size: 16px;
  }
  
  .product-id {
    font-size: 16px;
  }
  
  .toolbar-button .button-text {
    display: none;
  }
  
  .toolbar-button {
    padding: 8px;
  }
  
  .secondary-button .button-text {
    display: none;
  }
  
  .secondary-button {
    padding: 8px;
    justify-content: center;
  }
}
</style>