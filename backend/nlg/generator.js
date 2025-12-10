// nlg/generator.js - Moteur de génération NLG

class NLGGenerator {
  constructor() {
    this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  }

  // Formater les montants
  formatCurrency(amount) {
    if (amount === 0 || amount === null || amount === undefined) return '€0'
    const absAmount = Math.abs(amount)
    if (absAmount >= 1000000) return `€${(amount / 1000000).toFixed(1)}M`
    if (absAmount >= 1000) return `€${(amount / 1000).toFixed(1)}K`
    return `€${Math.round(amount).toLocaleString('fr-FR')}`
  }

  formatPercentage(value) {
    if (value === null || value === undefined) return '0.0%'
    const num = parseFloat(value)
    if (isNaN(num)) return '0.0%'
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`
  }

  // Calculer les métriques du produit
  calculateMetrics(productData) {
    if (!productData || productData.length === 0) {
      return null
    }

    // Agrégation des données mensuelles
    const months = Array(12).fill(0).map((_, i) => i + 1)
    
    const anaYtd = months.map(month => {
      const item = productData.find(d => d.month === month)
      return item ? (item.ana_ytd || 0) : 0
    })
    
    const refYtd = months.map(month => {
      const item = productData.find(d => d.month === month)
      return item ? (item.ref_ytd || 0) : 0
    })
    
    const anaPer = months.map(month => {
      const item = productData.find(d => d.month === month)
      return item ? (item.ana_per || 0) : 0
    })
    
    const refPer = months.map(month => {
      const item = productData.find(d => d.month === month)
      return item ? (item.ref_per || 0) : 0
    })

    // Calcul des totaux
    const totalAnaYtd = anaYtd.reduce((sum, val) => sum + val, 0)
    const totalRefYtd = refYtd.reduce((sum, val) => sum + val, 0)
    const totalAnaPer = anaPer.reduce((sum, val) => sum + val, 0)
    const totalRefPer = refPer.reduce((sum, val) => sum + val, 0)

    // Variance
    const ytdVariance = totalRefYtd !== 0 
      ? ((totalAnaYtd - totalRefYtd) / totalRefYtd * 100) 
      : 0

    // Dernier mois avec données
    const lastMonthIndex = anaPer.findIndex(val => val > 0)
    const lastMonth = lastMonthIndex !== -1 ? this.monthNames[lastMonthIndex] : null
    const lastMonthAna = lastMonthIndex !== -1 ? anaPer[lastMonthIndex] : 0
    const lastMonthRef = lastMonthIndex !== -1 ? refPer[lastMonthIndex] : 0

    // Meilleurs/mauvais mois
    const variances = months.map((month, i) => {
      const ref = refPer[i] || 1
      return ((anaPer[i] - ref) / ref * 100)
    })
    
    const maxVarianceIndex = variances.indexOf(Math.max(...variances.filter(v => !isNaN(v))))
    const minVarianceIndex = variances.indexOf(Math.min(...variances.filter(v => !isNaN(v))))
    
    const bestMonth = maxVarianceIndex !== -1 ? this.monthNames[maxVarianceIndex] : null
    const worstMonth = minVarianceIndex !== -1 ? this.monthNames[minVarianceIndex] : null

    // Effets cumulés
    const priceEffect = productData.reduce((sum, item) => sum + (item.price_effect_per || 0), 0)
    const quantityEffect = productData.reduce((sum, item) => sum + (item.quantity_effect_per || 0), 0)
    const volumeEffect = productData.reduce((sum, item) => sum + (item.volume_effect_per || 0), 0)

    // ABC classification
    const abcClass = productData[0]?.abc_ana_full_scope || 'C'

    // Moving averages
    const lastMa3 = productData[productData.length - 1]?.ana_ma3 || 0
    const lastMa12 = productData[productData.length - 1]?.ana_ma12 || 0

    // Tendances
    const recentMonths = anaPer.slice(-3).filter(v => v > 0)
    const olderMonths = anaPer.slice(-6, -3).filter(v => v > 0)
    
    const recentAvg = recentMonths.length > 0 
      ? recentMonths.reduce((a, b) => a + b) / recentMonths.length 
      : 0
    const olderAvg = olderMonths.length > 0 
      ? olderMonths.reduce((a, b) => a + b) / olderMonths.length 
      : 0
      
    const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg * 100) : 0

    return {
      totalAnaYtd,
      totalRefYtd,
      totalAnaPer,
      totalRefPer,
      ytdVariance,
      lastMonth,
      lastMonthAna,
      lastMonthRef,
      bestMonth,
      worstMonth,
      bestMonthValue: anaPer[maxVarianceIndex] || 0,
      worstMonthValue: anaPer[minVarianceIndex] || 0,
      priceEffect,
      quantityEffect,
      volumeEffect,
      abcClass,
      lastMa3,
      lastMa12,
      trend,
      monthlyData: months.map((month, i) => ({
        month: this.monthNames[i],
        monthNum: month,
        anaYtd: anaYtd[i],
        refYtd: refYtd[i],
        anaPer: anaPer[i],
        refPer: refPer[i],
        variance: variances[i]
      }))
    }
  }

  // Générer le texte d'analyse
  generateAnalysis(productId, metrics, filters) {
    if (!metrics) {
      return "Insufficient data to generate analysis for this product."
    }

    const {
      totalAnaYtd,
      totalRefYtd,
      ytdVariance,
      lastMonth,
      lastMonthAna,
      lastMonthRef,
      bestMonth,
      worstMonth,
      priceEffect,
      quantityEffect,
      volumeEffect,
      abcClass,
      trend,
      monthlyData
    } = metrics

    const analysisYear = filters?.ana_year || 'Current'
    const refYear = filters?.ref_year || 'Previous'

    let analysis = `# Performance Analysis: Product ${productId}\n\n`

    // 1. Vue d'ensemble
    analysis += `## 📊 Executive Summary\n\n`
    
    const performanceLevel = Math.abs(ytdVariance)
    let overallSentiment = ''
    
    if (ytdVariance > 10) {
      overallSentiment = 'excellent'
    } else if (ytdVariance > 5) {
      overallSentiment = 'very good'
    } else if (ytdVariance > 0) {
      overallSentiment = 'positive'
    } else if (ytdVariance > -5) {
      overallSentiment = 'slightly negative'
    } else if (ytdVariance > -10) {
      overallSentiment = 'concerning'
    } else {
      overallSentiment = 'critical'
    }

    analysis += `Product **${productId}** shows **${overallSentiment}** performance for ${analysisYear} YTD, with a variance of **${this.formatPercentage(ytdVariance)}** compared to ${refYear} plan.\n\n`

    // 2. Points clés
    analysis += `## 🎯 Key Performance Indicators\n\n`
    
    analysis += `- **YTD Actual vs Plan:** ${this.formatCurrency(totalAnaYtd)} vs ${this.formatCurrency(totalRefYtd)} (${this.formatPercentage(ytdVariance)})\n`
    analysis += `- **ABC Classification:** ${abcClass} priority product\n`
    
    if (lastMonth) {
      const lastMonthVariance = lastMonthRef > 0 
        ? ((lastMonthAna - lastMonthRef) / lastMonthRef * 100) 
        : 0
      analysis += `- **Latest Month (${lastMonth}):** ${this.formatCurrency(lastMonthAna)} (${this.formatPercentage(lastMonthVariance)} vs plan)\n`
    }
    
    if (bestMonth) {
      analysis += `- **Best Performing Month:** ${bestMonth}\n`
    }
    
    if (worstMonth) {
      analysis += `- **Month Needing Attention:** ${worstMonth}\n`
    }

    analysis += `\n`

    // 3. Analyse des effets
    analysis += `## 🔍 Performance Drivers Analysis\n\n`
    
    const totalEffect = priceEffect + quantityEffect + volumeEffect
    if (totalEffect !== 0) {
      analysis += `**Breakdown of Performance Effects:**\n\n`
      
      if (priceEffect !== 0) {
        const priceShare = Math.abs((priceEffect / totalEffect) * 100).toFixed(1)
        analysis += `- **Price Effect (${this.formatCurrency(priceEffect)}):** ${priceShare}% of total variance\n`
      }
      
      if (quantityEffect !== 0) {
        const quantityShare = Math.abs((quantityEffect / totalEffect) * 100).toFixed(1)
        analysis += `- **Quantity Effect (${this.formatCurrency(quantityEffect)}):** ${quantityShare}% of total variance\n`
      }
      
      if (volumeEffect !== 0) {
        const volumeShare = Math.abs((volumeEffect / totalEffect) * 100).toFixed(1)
        analysis += `- **Volume Effect (${this.formatCurrency(volumeEffect)}):** ${volumeShare}% of total variance\n`
      }
    } else {
      analysis += `No significant price, quantity, or volume effects detected.\n`
    }

    analysis += `\n`

    // 4. Tendances et patterns
    analysis += `## 📈 Trend Analysis\n\n`
    
    if (Math.abs(trend) > 5) {
      analysis += `- **Recent Trend:** ${trend > 0 ? 'Positive' : 'Negative'} momentum observed over last 3 months\n`
    }
    
    // Analyser les patterns mensuels
    const positiveMonths = monthlyData.filter(m => m.variance > 0).length
    const negativeMonths = monthlyData.filter(m => m.variance < 0).length
    const neutralMonths = monthlyData.filter(m => m.variance === 0).length
    
    analysis += `- **Monthly Performance:** ${positiveMonths} positive months, ${negativeMonths} negative months, ${neutralMonths} neutral months\n`
    
    // Identifier les séquences
    const sequences = this.findSequences(monthlyData.map(m => m.variance))
    if (sequences.longestPositive > 2) {
      analysis += `- **Pattern Detected:** ${sequences.longestPositive}-month positive streak\n`
    }
    if (sequences.longestNegative > 2) {
      analysis += `- **Pattern Detected:** ${sequences.longestNegative}-month negative streak\n`
    }

    analysis += `\n`

    // 5. Recommandations
    analysis += `## 💡 Recommendations\n\n`
    
    if (abcClass === 'A') {
      analysis += `**High Priority Product (A-class):**\n`
      analysis += `- Maintain current strategies for this high-value product\n`
      analysis += `- Monitor closely for any deviation from plan\n`
    } else if (abcClass === 'B') {
      analysis += `**Medium Priority Product (B-class):**\n`
      analysis += `- Review performance drivers for optimization opportunities\n`
      analysis += `- Consider targeted promotions if variance remains negative\n`
    } else {
      analysis += `**Standard Priority Product (C-class):**\n`
      analysis += `- Focus on cost efficiency and operational improvements\n`
      analysis += `- Evaluate product lifecycle and potential for phase-out if consistently underperforming\n`
    }

    if (ytdVariance < -5) {
      analysis += `\n**Corrective Actions Required:**\n`
      analysis += `- Investigate root causes for underperformance\n`
      if (priceEffect < 0) {
        analysis += `- Review pricing strategy and competitive positioning\n`
      }
      if (quantityEffect < 0) {
        analysis += `- Assess demand forecasting and inventory management\n`
      }
      if (volumeEffect < 0) {
        analysis += `- Evaluate distribution channels and market coverage\n`
      }
    } else if (ytdVariance > 5) {
      analysis += `\n**Growth Opportunities:**\n`
      analysis += `- Scale successful strategies to similar products\n`
      analysis += `- Consider expanding market presence\n`
      analysis += `- Review capacity planning for increased demand\n`
    }

    analysis += `\n`

    // 6. Prévisions et outlook
    analysis += `## 🔮 Outlook & Forecast\n\n`
    
    const forecast = this.generateForecast(metrics)
    analysis += forecast

    // 7. Données détaillées (optionnel)
    analysis += `\n## 📋 Detailed Metrics\n\n`
    analysis += `| Metric | Value |\n|--------|-------|\n`
    analysis += `| **YTD Actual** | ${this.formatCurrency(totalAnaYtd)} |\n`
    analysis += `| **YTD Plan** | ${this.formatCurrency(totalRefYtd)} |\n`
    analysis += `| **Variance %** | ${this.formatPercentage(ytdVariance)} |\n`
    analysis += `| **ABC Class** | ${abcClass} |\n`
    analysis += `| **Price Effect** | ${this.formatCurrency(priceEffect)} |\n`
    analysis += `| **Quantity Effect** | ${this.formatCurrency(quantityEffect)} |\n`
    analysis += `| **Volume Effect** | ${this.formatCurrency(volumeEffect)} |\n`

    return analysis
  }

  // Trouver les séquences
  findSequences(variances) {
    let currentSequence = 0
    let currentSign = 0
    let longestPositive = 0
    let longestNegative = 0
    
    for (const variance of variances) {
      if (variance > 0) {
        if (currentSign === 1) {
          currentSequence++
        } else {
          currentSequence = 1
          currentSign = 1
        }
        longestPositive = Math.max(longestPositive, currentSequence)
      } else if (variance < 0) {
        if (currentSign === -1) {
          currentSequence++
        } else {
          currentSequence = 1
          currentSign = -1
        }
        longestNegative = Math.max(longestNegative, currentSequence)
      } else {
        currentSequence = 0
        currentSign = 0
      }
    }
    
    return { longestPositive, longestNegative }
  }

  // Générer des prévisions
  generateForecast(metrics) {
    const { trend, lastMa3, lastMa12, ytdVariance } = metrics
    
    let forecast = ''
    
    if (trend > 5) {
      forecast += `- **Short-term Outlook:** Positive momentum expected to continue\n`
      forecast += `- **Projected Growth:** ${Math.abs(trend).toFixed(1)}% month-over-month trend\n`
    } else if (trend < -5) {
      forecast += `- **Short-term Outlook:** Continued pressure expected\n`
      forecast += `- **Warning:** Negative trend requires intervention\n`
    } else {
      forecast += `- **Short-term Outlook:** Stable performance expected\n`
    }
    
    // Basé sur les moyennes mobiles
    if (lastMa3 > 0 && lastMa12 > 0) {
      const maRatio = lastMa3 / lastMa12
      if (maRatio > 1.1) {
        forecast += `- **Trend Indicator:** 3-month average significantly above 12-month average (bullish signal)\n`
      } else if (maRatio < 0.9) {
        forecast += `- **Trend Indicator:** 3-month average below 12-month average (bearish signal)\n`
      }
    }
    
    forecast += `- **Recommendation:** `
    if (ytdVariance > 10) {
      forecast += `Maintain current trajectory`
    } else if (ytdVariance > 0) {
      forecast += `Continue monitoring with current strategy`
    } else if (ytdVariance > -5) {
      forecast += `Implement minor adjustments as needed`
    } else {
      forecast += `Immediate corrective action recommended`
    }
    
    return forecast
  }
}

// Fonction principale exportée
async function generateProductAnalysis(productId, productData, filters) {
  const generator = new NLGGenerator()
  
  // Calculer les métriques
  const metrics = generator.calculateMetrics(productData)
  
  if (!metrics) {
    return {
      text: "Unable to generate analysis due to insufficient data.",
      metrics: null,
      summary: "Data insufficient"
    }
  }
  
  // Générer le texte d'analyse
  const text = generator.generateAnalysis(productId, metrics, filters)
  
  // Créer un résumé
  const summary = {
    productId,
    variance: metrics.ytdVariance,
    classification: metrics.abcClass,
    status: metrics.ytdVariance > 0 ? 'above_plan' : 'below_plan',
    confidence: 'high', // À raffiner avec plus de logique
    keyInsight: metrics.ytdVariance > 0 
      ? `Product performing ${generator.formatPercentage(metrics.ytdVariance)} above plan`
      : `Product underperforming by ${generator.formatPercentage(Math.abs(metrics.ytdVariance))}`
  }
  
  return {
    text,
    metrics,
    summary
  }
}

module.exports = {
  generateProductAnalysis,
  NLGGenerator
}