require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { exec } = require('child_process')
const db = require('./db')
const cache = require('./cache')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}))

app.use(express.json())

const periodMap = {
  trimestre: {
    T1: ['01', '02', '03'],
    T2: ['04', '05', '06'],
    T3: ['07', '08', '09'],
    T4: ['10', '11', '12']
  },
  quarter: {
    Q1: ['01', '02', '03'],
    Q2: ['04', '05', '06'],
    Q3: ['07', '08', '09'],
    Q4: ['10', '11', '12']
  },
  semester: {
    S1: ['01', '02', '03', '04', '05', '06'],
    S2: ['07', '08', '09', '10', '11', '12']
  }
}

function getMonthsFromPeriod(period, periodValues) {
  if (period === 'month') {
    return periodValues
      .split(',')
      .map(v => v.replace(/^M/, '').padStart(2, '0'))
      .filter(Boolean)
  }
  if (['trimestre', 'quarter', 'semester'].includes(period)) {
    let result = []
    periodValues.split(',').forEach(v => {
      if (periodMap[period][v]) result = result.concat(periodMap[period][v])
    })
    return result
  }
  return []
}

// Fonction pour formater les montants en euros
function formatCurrency(amount) {
  if (amount === 0 || amount === null || amount === undefined) return '€0'
  const absAmount = Math.abs(amount)
  if (absAmount >= 1000000) return `€${(amount / 1000000).toFixed(1)}M`
  if (absAmount >= 1000) return `€${(amount / 1000).toFixed(1)}k`
  return `€${Math.round(amount).toLocaleString('fr-FR')}`
}

// Fonction pour obtenir le nom du mois
function getMonthName(monthNumber) {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
  return months[monthNumber - 1] || `M${monthNumber}`
}

// Fonction pour générer l'analyse en français
function generateFrenchAnalysis(productId, productData, filters) {
  // Calculer les métriques de base
  const anaTotal = productData.reduce((sum, item) => sum + (item.ana_ytd || 0), 0)
  const refTotal = productData.reduce((sum, item) => sum + (item.ref_ytd || 0), 0)
  const variance = refTotal !== 0 ? ((anaTotal - refTotal) / refTotal * 100).toFixed(1) : 0
  
  // Calculer les effets
  const priceEffect = productData.reduce((sum, item) => sum + (item.price_effect_per || 0), 0)
  const quantityEffect = productData.reduce((sum, item) => sum + (item.quantity_effect_per || 0), 0)
  const volumeEffect = productData.reduce((sum, item) => sum + (item.volume_effect_per || 0), 0)
  
  // Classification ABC
  const abcClass = productData[0]?.abc_ana_full_scope || 'C'
  
  // Analyser les tendances mensuelles
  const monthlyData = {}
  productData.forEach(item => {
    if (item.month) {
      const monthName = getMonthName(item.month)
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = {
          ana: 0,
          ref: 0,
          anaPer: item.ana_per || 0,
          refPer: item.ref_per || 0,
          achievement: item.achievement_rate_ytd || 0
        }
      } else {
        monthlyData[monthName].ana += item.ana_ytd || 0
        monthlyData[monthName].ref += item.ref_ytd || 0
      }
    }
  })
  
  // Trouver les meilleurs et pires mois
  let bestMonth = null
  let worstMonth = null
  let bestMonthValue = -Infinity
  let worstMonthValue = Infinity
  
  Object.entries(monthlyData).forEach(([month, data]) => {
    const achievement = data.achievement
    if (achievement > bestMonthValue) {
      bestMonthValue = achievement
      bestMonth = month
    }
    if (achievement < worstMonthValue) {
      worstMonthValue = achievement
      worstMonth = month
    }
  })
  
  // Calculer les moyennes mobiles
  const lastMonthData = productData[productData.length - 1] || {}
  const ma3 = lastMonthData.ana_ma3 || 0
  const ma12 = lastMonthData.ana_ma12 || 0
  const maTrend = ma12 !== 0 ? ((ma3 - ma12) / ma12 * 100).toFixed(1) : 0
  
  // Déterminer la performance
  const varianceNum = parseFloat(variance)
  let performanceLevel = ''
  let performanceColor = ''
  let recommendations = []
  
  if (varianceNum > 10) {
    performanceLevel = 'EXCELLENTE'
    performanceColor = '#6A9C47'
    recommendations = [
      'Maintenir les stratégies actuelles qui fonctionnent bien',
      'Étudier les possibilités d\'expansion sur d\'autres marchés',
      'Capitaliser sur les succès pour développer des produits similaires',
      'Considérer une augmentation des objectifs pour les prochains trimestres'
    ]
  } else if (varianceNum > 5) {
    performanceLevel = 'TRÈS BONNE'
    performanceColor = '#9BBB59'
    recommendations = [
      'Consolider les performances actuelles',
      'Optimiser les canaux de distribution les plus performants',
      'Surveiller les tendances mensuelles pour maintenir l\'élan',
      'Renforcer la présence sur les marchés où le produit excelle'
    ]
  } else if (varianceNum > 0) {
    performanceLevel = 'POSITIVE'
    performanceColor = '#F79646'
    recommendations = [
      'Maintenir le cap sur la stratégie actuelle',
      'Identifier les opportunités d\'amélioration marginale',
      'Renforcer les points forts identifiés',
      'Préparer des plans de contingence pour les mois difficiles'
    ]
  } else if (varianceNum > -5) {
    performanceLevel = 'LÉGÈREMENT NÉGATIVE'
    performanceColor = '#F79646'
    recommendations = [
      'Analyser les causes de la sous-performance',
      'Revoir la stratégie de prix et les promotions',
      'Optimiser les campagnes marketing ciblées',
      'Renforcer la formation des équipes de vente'
    ]
  } else if (varianceNum > -10) {
    performanceLevel = 'PRÉOCCUPANTE'
    performanceColor = '#C0504D'
    recommendations = [
      'Mettre en place des actions correctives immédiates',
      'Revoir le positionnement produit sur le marché',
      'Analyser la concurrence et ajuster la stratégie',
      'Renégocier les termes avec les fournisseurs si nécessaire'
    ]
  } else {
    performanceLevel = 'CRITIQUE'
    performanceColor = '#C0504D'
    recommendations = [
      'Actions correctives immédiates requises',
      'Revoir le cycle de vie du produit et les alternatives',
      'Étudier la possibilité de retrait du marché si nécessaire',
      'Mettre en place un plan de sauvetage détaillé'
    ]
  }
  
  // Générer l'analyse
  let analysis = ``
  
  analysis += `### APERÇU EXÉCUTIF\n\n`
  analysis += `Le produit **${productId}** présente une performance **${performanceLevel}** pour la période YTD ${filters.ana_year_label || 'actuelle'}, avec une variance de **${varianceNum >= 0 ? '+' : ''}${variance}%** par rapport au plan de référence ${filters.ref_year_label || 'précédent'}.\n\n`
  
  analysis += `###  STATUT DE PERFORMANCE\n`
  analysis += `**Niveau:** ${performanceLevel}  \n`
  analysis += `**Classification ABC:** ${abcClass} (Priorité ${abcClass})  \n`
  analysis += `**Indicateur clé:** Variance ${varianceNum >= 0 ? '+' : ''}${variance}% vs Plan\n\n`
  
  analysis += `### MÉTRIQUES FINANCIÈRES\n\n`
  analysis += `### Chiffre d'Affaires\n`
  analysis += `- **YTD Actuel (${filters.ana_year_label || 'Actuel'}):** ${formatCurrency(anaTotal)}\n`
  analysis += `- **YTD Plan (${filters.ref_year_label || 'Référence'}):** ${formatCurrency(refTotal)}\n`
  analysis += `- **Écart:** ${formatCurrency(anaTotal - refTotal)} (${varianceNum >= 0 ? '+' : ''}${variance}%)\n\n`
  
  if (priceEffect !== 0 || quantityEffect !== 0 || volumeEffect !== 0) {
    analysis += `### 🔍 DÉCOMPOSITION DES EFFETS\n\n`
    analysis += `**Analyse détaillée des facteurs influençant la performance:**\n\n`
    
    const totalEffect = Math.abs(priceEffect) + Math.abs(quantityEffect) + Math.abs(volumeEffect)
    
    if (priceEffect !== 0) {
      const effectPercentage = totalEffect > 0 ? Math.round((Math.abs(priceEffect) / totalEffect) * 100) : 0
      analysis += `- **Effet Prix (${formatCurrency(priceEffect)}):** ${effectPercentage}% de l'écart total  \n`
      analysis += `  → ${priceEffect > 0 ? 'Impact positif' : 'Impact négatif'} sur la marge  \n`
      analysis += `  → ${priceEffect > 0 ? 'Politique de prix efficace' : 'Pression sur les prix détectée'}\n\n`
    }
    
    if (quantityEffect !== 0) {
      const effectPercentage = totalEffect > 0 ? Math.round((Math.abs(quantityEffect) / totalEffect) * 100) : 0
      analysis += `- **Effet Quantité (${formatCurrency(quantityEffect)}):** ${effectPercentage}% de l'écart total  \n`
      analysis += `  → ${quantityEffect > 0 ? 'Augmentation' : 'Diminution'} des volumes vendus  \n`
      analysis += `  → ${quantityEffect > 0 ? 'Demande forte' : 'Problèmes de demande identifiés'}\n\n`
    }
    
    if (volumeEffect !== 0) {
      const effectPercentage = totalEffect > 0 ? Math.round((Math.abs(volumeEffect) / totalEffect) * 100) : 0
      analysis += `- **Effet Volume (${formatCurrency(volumeEffect)}):** ${effectPercentage}% de l'écart total  \n`
      analysis += `  → Impact sur le mix produit et la composition  \n`
      analysis += `  → ${volumeEffect > 0 ? 'Mix favorable' : 'Mix défavorable'}\n\n`
    }
  }
  
  analysis += `## 📅 ANALYSE MENSUELLE\n\n`
  
  const months = Object.keys(monthlyData).sort((a, b) => {
    const monthOrder = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    return monthOrder.indexOf(a) - monthOrder.indexOf(b)
  })
  
  if (months.length > 0) {
    analysis += `### Performance par Mois\n\n`
    
    months.forEach(month => {
      const data = monthlyData[month]
      const monthVariance = data.ref !== 0 ? ((data.ana - data.ref) / data.ref * 100).toFixed(1) : 0
      const achievement = (data.achievement * 100).toFixed(1)
      
      let monthStatus = '⚪ Neutre'
      if (monthVariance > 5) monthStatus = '🟢 Excellent'
      else if (monthVariance > 0) monthStatus = '🟡 Bon'
      else if (monthVariance > -5) monthStatus = '🟠 Correct'
      else monthStatus = '🔴 Critique'
      
      analysis += `**${month}** ${monthStatus}  \n`
      analysis += `→ Actuel: ${formatCurrency(data.ana)} | Plan: ${formatCurrency(data.ref)}  \n`
      analysis += `→ Variance: ${monthVariance >= 0 ? '+' : ''}${monthVariance}% | Taux réalisation: ${achievement}%  \n`
      analysis += `→ Mensuel: ${formatCurrency(data.anaPer)} vs ${formatCurrency(data.refPer)}\n\n`
    })
    
    if (bestMonth && worstMonth) {
      analysis += `### 🏆 MEILLEUR MOIS: ${bestMonth}\n`
      analysis += `Taux de réalisation: ${(bestMonthValue * 100).toFixed(1)}%  \n`
      analysis += `Recommandation: Analyser les facteurs de succès pour réplication\n\n`
      
      analysis += `### ⚠️ MOIS CRITIQUE: ${worstMonth}\n`
      analysis += `Taux de réalisation: ${(worstMonthValue * 100).toFixed(1)}%  \n`
      analysis += `Recommandation: Investigation approfondie requise\n\n`
    }
  }
  
  analysis += `## 📊 TENDANCES ET INDICATEURS\n\n`
  
  analysis += `### Moyennes Mobiles\n`
  analysis += `- **MA3 (3 mois):** ${formatCurrency(ma3)}\n`
  analysis += `- **MA12 (12 mois):** ${formatCurrency(ma12)}\n`
  analysis += `- **Tendance:** ${maTrend >= 0 ? '+' : ''}${maTrend}% vs moyenne annuelle\n\n`
  
  // Analyser la saisonnalité
  if (months.length >= 6) {
    const firstHalf = months.slice(0, 6)
    const secondHalf = months.slice(6)
    
    const firstHalfAvg = firstHalf.reduce((sum, month) => sum + monthlyData[month].ana, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, month) => sum + monthlyData[month].ana, 0) / secondHalf.length
    const seasonality = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100).toFixed(1) : 0
    
    analysis += `### 📈 SAISONNALITÉ\n`
    analysis += `- **1er semestre:** ${formatCurrency(firstHalfAvg)}/mois\n`
    analysis += `- **2nd semestre:** ${formatCurrency(secondHalfAvg)}/mois\n`
    analysis += `- **Variation:** ${seasonality >= 0 ? '+' : ''}${seasonality}%\n\n`
    
    if (Math.abs(seasonality) > 20) {
      analysis += `**⚠️ FORTE SAISONNALITÉ DÉTECTÉE**  \n`
      analysis += `Planification des stocks et promotions requise\n\n`
    }
  }
  
  analysis += `## 🎯 RECOMMANDATIONS STRATÉGIQUES\n\n`
  
  recommendations.forEach((rec, index) => {
    analysis += `${index + 1}. **${rec}**\n`
  })
  
  analysis += `\n`
  
  analysis += `### ⏱️ PLAN D'ACTION IMMÉDIAT (30 JOURS)\n\n`
  
  if (varianceNum >= 5) {
    analysis += `1. **Capitaliser sur le succès** - Documenter les meilleures pratiques\n`
    analysis += `2. **Étendre les performances** - Appliquer aux produits similaires\n`
    analysis += `3. **Réviser les objectifs** - Augmenter les cibles si pertinent\n`
  } else if (varianceNum >= 0) {
    analysis += `1. **Maintenir la performance** - Surveillance continue\n`
    analysis += `2. **Identifier les opportunités** - Analyse des points d'amélioration\n`
    analysis += `3. **Préparer les plans B** - Scénarios de contingence\n`
  } else {
    analysis += `1. **Analyse root-cause** - Identifier les causes profondes\n`
    analysis += `2. **Plan correctif** - Mettre en place des actions correctives\n`
    analysis += `3. **Surveillance renforcée** - Suivi hebdomadaire des indicateurs\n`
  }
  
  analysis += `\n`
  
  analysis += `## 📋 DONNÉES TECHNIQUES\n\n`
  
  analysis += `| PARAMÈTRE | VALEUR |\n`
  analysis += `|-----------|--------|\n`
  analysis += `| **ID Produit** | ${productId} |\n`
  analysis += `| **Période d'analyse** | YTD ${filters.ana_year_label || 'Actuel'} |\n`
  analysis += `| **Référence** | YTD ${filters.ref_year_label || 'Précédent'} |\n`
  analysis += `| **Variance** | ${varianceNum >= 0 ? '+' : ''}${variance}% |\n`
  analysis += `| **Classification ABC** | ${abcClass} |\n`
  analysis += `| **Statut Performance** | ${performanceLevel} |\n`
  analysis += `| **Points de données** | ${productData.length} mois |\n`
  analysis += `| **Effet Prix** | ${formatCurrency(priceEffect)} |\n`
  analysis += `| **Effet Quantité** | ${formatCurrency(quantityEffect)} |\n`
  analysis += `| **Effet Volume** | ${formatCurrency(volumeEffect)} |\n`
  analysis += `| **Date génération** | ${new Date().toLocaleDateString('fr-FR')} |\n`
  
  analysis += `\n`
  
  analysis += `## 🔮 PERSPECTIVES ET SUIVI\n\n`
  
  const nextQuarter = new Date()
  nextQuarter.setMonth(nextQuarter.getMonth() + 3)
  
  analysis += `- **Prochaine revue:** ${nextQuarter.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}\n`
  analysis += `- **Suivi recommandé:** Revue mensuelle des indicateurs clés\n`
  analysis += `- **Points de vigilance:** ${varianceNum < 0 ? 'Performance vs plan' : 'Maintien des résultats'}\n`
  analysis += `- **Risques identifiés:** ${varianceNum < -5 ? 'Écart important au plan' : varianceNum < 0 ? 'Légère sous-performance' : 'Risques limités'}\n`
  analysis += `- **Opportunités:** ${varianceNum > 5 ? 'Croissance et expansion' : varianceNum > 0 ? 'Optimisation marginale' : 'Correction et amélioration'}\n\n`
  
  analysis += `---\n`
  analysis += `*Analyse générée automatiquement - ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}*\n`
  analysis += `*Pour toute question, contacter l'équipe d'analyse performance*\n`
  
  return {
    analysis,
    summary: {
      productId,
      performance: performanceLevel,
      classification: abcClass,
      variance: parseFloat(variance),
      anaTotal,
      refTotal,
      priceEffect,
      quantityEffect,
      volumeEffect,
      bestMonth,
      worstMonth,
      maTrend: parseFloat(maTrend),
      color: performanceColor
    }
  }
}

// Route principale pour les métriques
app.get('/metrics', async (req, res) => {
  console.log('📥 Requête reçue :', req.query)

  const ana_scenario = req.query.ana_scenario || 'ACTUAL_OFFICIAL'
  const ana_year = parseInt(req.query.ana_year) || 2025
  const ref_scenario = req.query.ref_scenario || 'ACTUAL_OFFICIAL'
  const ref_year = parseInt(req.query.ref_year) || 2024
  const mode = req.query.mode || 'analytics'
  const period = req.query.period || 'year'
  const periodValues = req.query[period] || req.query.periodRange || ''
  const granularity = req.query.bu || 'country'

  const cacheKey = `metrics:${mode}:${ana_scenario}:${ana_year}:${ref_scenario}:${ref_year}:${granularity}`

  try {
    const cached = await cache.get(cacheKey)
    
    if (!cached) {
      console.log('⚙️ Cache MISS → dbt run (mode:', mode, ')')
      
      let dbtCommand
      if (mode === 'items') {
        dbtCommand = `dbt run --full-refresh --select unit_product int_metrics_per int_metrics_ytd int_abc int_effects int_moving_averages mrt_sales_metrics --vars '{"ana_scenario": "${ana_scenario}", "ana_year": ${ana_year}, "ref_scenario": "${ref_scenario}", "ref_year": ${ref_year}}'`
      } else {
        dbtCommand = `dbt run --full-refresh --select unit_product int_metrics_per int_metrics_ytd int_abc int_effects int_moving_averages mrt_sales_metrics mrt_sales_analytics --vars '{"ana_scenario": "${ana_scenario}", "ana_year": ${ana_year}, "ref_scenario": "${ref_scenario}", "ref_year": ${ref_year}}'`
      }

      await new Promise((resolve, reject) => {
        exec(dbtCommand, { cwd: '/Users/adrielwotadji/Documents/deepPromo/dbtdeepPromo' },
          (err, stdout, stderr) => {
            if (err) return reject(new Error(`dbt failed: ${stderr || err}`))
            console.log('🚀 dbt terminé:', mode)
            resolve()
          }
        )
      })
    }

    let sql, table, columns
    if (mode === 'items') {
      table = 'dbtdp_dev_marts.mrt_sales_metrics'
      columns = `
        year, month, product_id,
        qty_ana_per, ana_per, qty_ref_per, ref_per, contrib_per, contrib_ref_per,
        ana_margin_price, ana_ytd, ref_ytd, perf_ytd, perf_ref_ytd, perf_var_ytd,
        achievement_rate_ytd, ana_ma3, ana_ma12, total_ana_ma3, total_ana_ma12,
        abc_ana_full_scope, price_effect_per, quantity_effect_per, volume_effect_per
      `
    } else {
      table = 'dbtdp_dev_marts.mrt_sales_analytics'
      columns = `
        country, region, department, city, store_id, year, month, product_id,
        qty_ana_per, ana_per, qty_ref_per, ref_per, contrib_per, contrib_ref_per,
        ana_margin_price, ana_ytd, ref_ytd, perf_ytd, perf_ref_ytd, perf_var_ytd,
        achievement_rate_ytd, ana_ma3, ana_ma12, total_ana_ma3, total_ana_ma12,
        abc_ana_full_scope, price_effect_per, quantity_effect_per, volume_effect_per
      `
    }

    sql = `
      SELECT ${columns}
      FROM ${table}
    `

    const params = []

    if (mode === 'analytics') {
      const validGranularities = ['country', 'region', 'department', 'city', 'store_id']
      if (validGranularities.includes(granularity) && req.query[granularity]) {
        sql += ` WHERE ${granularity} = $1`
        params.push(req.query[granularity])
        console.log(`✅ ANALYTICS - Filtre ${granularity}: ${req.query[granularity]}`)
      } else {
        sql += ' WHERE 1=1'
      }
    } else {
      sql += ' WHERE 1=1'
      console.log('📦 ITEMS - AUCUN filtre granularité (toutes données)')
    }

    if (ana_year) {
      sql += ` AND year = $${params.length + 1}`
      params.push(ana_year)
      console.log(`✅ Filtre year: ${ana_year}`)
    }

    if (period !== 'year' && periodValues) {
      const months = getMonthsFromPeriod(period, periodValues)
      if (months.length > 0) {
        const placeholders = months.map((_, i) => `$${params.length + i + 1}`).join(',')
        sql += ` AND month IN (${placeholders})`
        params.push(...months)
        console.log(`✅ Filtre months: ${months.join(',')}`)
      }
    }

    console.log('📡 SQL (table:', table, 'mode:', mode, '):', sql)
    console.log('➡️ Params:', params)

    const result = await db.query(sql, params)

    if (!cached) {
      await cache.set(cacheKey, JSON.stringify(result.rows), { EX: 3600 })
    }

    res.json({
      success: true,
      mode,
      table,
      count: result.rowCount,
      data: result.rows.slice(0, 100)
    })

  } catch (error) {
    console.error('❌ Erreur API:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Route pour obtenir les produits uniques
app.get('/products', async (req, res) => {
  try {
    const { scenario, year, granularity, granularity_value } = req.query
    
    let sql = `
      SELECT DISTINCT product_id 
      FROM dbtdp_dev_marts.mrt_sales_analytics 
      WHERE 1=1
    `
    
    const params = []
    
    if (scenario) {
      sql += ` AND scenario = $${params.length + 1}`
      params.push(scenario)
    }
    
    if (year) {
      sql += ` AND year = $${params.length + 1}`
      params.push(parseInt(year))
    }
    
    if (granularity && granularity_value) {
      sql += ` AND ${granularity} = $${params.length + 1}`
      params.push(granularity_value)
    }
    
    sql += ` ORDER BY product_id`
    
    const result = await db.query(sql, params)
    
    const products = result.rows.map(row => row.product_id).filter(Boolean)
    
    res.json({
      success: true,
      count: products.length,
      products: products
    })
    
  } catch (error) {
    console.error('❌ Erreur /products:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Route pour générer l'analyse NLG en français
app.post('/generate-nlg', async (req, res) => {
  try {
    const { 
      productId, 
      filters,
      data
    } = req.body
    
    console.log('📝 Génération NLG (FR) pour product:', productId)
    console.log('📊 Données reçues:', data?.length || 0, 'lignes')
    console.log('🔍 Recherche du produit:', productId)
    
    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID produit requis' 
      })
    }
    
    let productData = []
    if (data && Array.isArray(data)) {
      productData = data.filter(item => item.product_id === productId)
      console.log('✅ Produit trouvé:', productData.length, 'lignes de données')
      
      // Debug: afficher quelques lignes de données
      if (productData.length > 0) {
        console.log('📋 Exemple de données produit:', {
          product_id: productData[0].product_id,
          month: productData[0].month,
          ana_ytd: productData[0].ana_ytd,
          ref_ytd: productData[0].ref_ytd,
          abc_ana_full_scope: productData[0].abc_ana_full_scope
        })
      }
    }
    
    if (!productData || productData.length === 0) {
      console.log('⚠️ Aucune donnée trouvée pour le produit:', productId)
      
      const defaultAnalysis = `# 📊 ANALYSE DE PERFORMANCE: PRODUIT ${productId}

## 🔍 APERÇU
Données insuffisantes disponibles pour le produit **${productId}** avec les filtres de sélection actuels.

## ⚠️ STATUT
**INFORMATION LIMITÉE** - Données incomplètes

## 📋 ACTIONS REQUISES
1. **Vérifier l'ID produit** - Confirmer l'exactitude de l'identifiant
2. **Ajuster les filtres** - Élargir les critères de sélection
3. **Valider la disponibilité** - Vérifier la présence de données pour la période

## 🎯 PROCHAINES ÉTAPES
- Consulter l'équipe données pour vérifier la disponibilité
- Réviser les paramètres de filtrage
- Explorer d'autres produits similaires pour analyse

---

*Analyse générée le ${new Date().toLocaleDateString('fr-FR')} - Données insuffisantes*`
      
      return res.json({
        success: true,
        productId,
        analysis: defaultAnalysis,
        summary: {
          productId,
          performance: 'DONNÉES INSUFFISANTES',
          classification: 'INCONNU',
          variance: 0,
          anaTotal: 0,
          refTotal: 0,
          color: '#949494'
        }
      })
    }
    
    // Générer l'analyse complète en français
    console.log('🎯 Génération de l\'analyse pour', productData.length, 'lignes de données')
    const { analysis, summary } = generateFrenchAnalysis(productId, productData, filters)
    
    console.log('✅ Analyse générée avec succès')
    
    res.json({
      success: true,
      productId,
      analysis: analysis,
      summary: summary
    })
    
  } catch (error) {
    console.error('❌ Erreur /generate-nlg:', error)
    
    const errorAnalysis = `# ⚠️ ERREUR DE GÉNÉRATION D'ANALYSE

## 🔴 PROBLÈME TECHNIQUE
Impossible de générer l'analyse pour le produit **${req.body?.productId || 'INCONNU'}**.

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
- ID Produit: ${req.body?.productId || 'N/A'}
- Heure: ${new Date().toLocaleTimeString('fr-FR')}
- Code erreur: ${error.code || 'N/A'}

---

*Erreur survenue le ${new Date().toLocaleDateString('fr-FR')}*`
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      analysis: errorAnalysis
    })
  }
})

// Route pour l'historique des analyses
app.get('/nlg-history', async (req, res) => {
  try {
    const { productId, limit = 10 } = req.query
    
    // Simulation d'historique - À remplacer par une vraie base de données
    const history = [
      {
        id: 1,
        productId: productId || 'P123',
        timestamp: new Date().toISOString(),
        analysisType: 'performance_mensuelle',
        summary: 'Produit affichant une tendance positive avec 15% de croissance',
        variance: 15.5,
        classification: 'B'
      },
      {
        id: 2,
        productId: productId || 'P123',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // Hier
        analysisType: 'analyse_comparative',
        summary: 'Performance stable par rapport au trimestre précédent',
        variance: 2.3,
        classification: 'B'
      }
    ]
    
    res.json({
      success: true,
      history: history.slice(0, limit)
    })
    
  } catch (error) {
    console.error('❌ Erreur /nlg-history:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      metrics: 'operational',
      nlg: 'operational',
      cache: 'operational',
      database: 'operational'
    }
  })
})

app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`)
  console.log(`📊 Endpoints disponibles:`)
  console.log(`   GET  /metrics        - Données métriques`)
  console.log(`   GET  /products       - Liste des produits`)
  console.log(`   POST /generate-nlg   - Génération analyse produit (FR)`)
  console.log(`   GET  /nlg-history    - Historique des analyses`)
  console.log(`   GET  /health         - Santé de l'API`)
})