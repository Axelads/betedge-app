/**
 * Calcule le ROI (Retour sur Investissement) sur un ensemble de paris.
 * @param {Array} paris
 * @returns {number} ROI en %
 */
export const calculerROI = (paris) => {
  const totalMises = paris.reduce((sum, p) => sum + p.mise, 0)
  const totalProfitPerte = paris.reduce((sum, p) => sum + p.profit_perte, 0)
  if (totalMises === 0) return 0
  return (totalProfitPerte / totalMises) * 100
}

/**
 * Calcule le taux de réussite sur les paris terminés (gagné ou perdu).
 * @param {Array} paris
 * @returns {number} Taux de réussite en %
 */
export const calculerTauxReussite = (paris) => {
  const termines = paris.filter(p => p.statut === 'gagne' || p.statut === 'perdu')
  if (termines.length === 0) return 0
  const gagnes = termines.filter(p => p.statut === 'gagne').length
  return (gagnes / termines.length) * 100
}

/**
 * Calcule l'espérance de valeur (EV).
 * Si ev > 0 → pari de valeur.
 * @param {number} probabiliteVictoire - probabilité estimée (0 à 1)
 * @param {number} cote - cote décimale
 * @returns {number} EV
 */
export const calculerEV = (probabiliteVictoire, cote) => {
  return (probabiliteVictoire * (cote - 1)) - (1 - probabiliteVictoire)
}

/**
 * ROI par sport.
 * @param {Array} paris
 * @returns {Object} { football: 12.5, tennis: -3.2, ... }
 */
export const calculerROIParSport = (paris) => {
  const sports = [...new Set(paris.map(p => p.sport))]
  const resultat = {}
  for (const sport of sports) {
    resultat[sport] = calculerROI(paris.filter(p => p.sport === sport))
  }
  return resultat
}

/**
 * ROI par type de pari.
 * @param {Array} paris
 * @returns {Object} { victoire: 8.0, over_under: 15.2, ... }
 */
export const calculerROIParTypePari = (paris) => {
  const types = [...new Set(paris.map(p => p.type_pari))]
  const resultat = {}
  for (const type of types) {
    resultat[type] = calculerROI(paris.filter(p => p.type_pari === type))
  }
  return resultat
}

/**
 * Taux de réussite par niveau de confiance (1 à 5).
 * @param {Array} paris
 * @returns {Object} { 1: 40, 2: 50, 3: 58, 4: 70, 5: 75 }
 */
export const calculerTauxReussiteParConfiance = (paris) => {
  const resultat = {}
  for (let i = 1; i <= 5; i++) {
    resultat[i] = calculerTauxReussite(paris.filter(p => p.confiance === i))
  }
  return resultat
}

/**
 * Tags les plus rentables (classés par ROI décroissant).
 * @param {Array} paris
 * @returns {Array} [{ tag, roi, nombre }]
 */
export const calculerMeilleurssTags = (paris) => {
  const mapTags = {}
  for (const pari of paris) {
    if (!pari.tags_raisonnement) continue
    for (const tag of pari.tags_raisonnement) {
      if (!mapTags[tag]) mapTags[tag] = []
      mapTags[tag].push(pari)
    }
  }
  return Object.entries(mapTags)
    .map(([tag, parisDuTag]) => ({
      tag,
      roi: calculerROI(parisDuTag),
      nombre: parisDuTag.length,
    }))
    .sort((a, b) => b.roi - a.roi)
}

/**
 * Meilleure série de victoires consécutives all-time.
 * @param {Array} paris
 * @returns {number}
 */
export const calculerMeilleureSerieVictoires = (paris) => {
  const termines = paris
    .filter(p => p.statut === 'gagne' || p.statut === 'perdu')
    .sort((a, b) => new Date(a.created) - new Date(b.created))

  let meilleure = 0
  let courante = 0
  for (const pari of termines) {
    if (pari.statut === 'gagne') {
      courante++
      if (courante > meilleure) meilleure = courante
    } else {
      courante = 0
    }
  }
  return meilleure
}

/**
 * Meilleure cote passée sur un pari gagné.
 * @param {Array} paris
 * @returns {number|null}
 */
export const trouverMeilleureCoteGagnee = (paris) => {
  const gagnes = paris.filter(p => p.statut === 'gagne')
  if (gagnes.length === 0) return null
  return Math.max(...gagnes.map(p => p.cote))
}

/**
 * Évolution de la bankroll dans le temps (triée par date).
 * @param {Array} paris - paris triés par date croissante
 * @param {number} bankrollInitiale
 * @returns {Array} [{ date, bankroll }]
 */
export const calculerHistoriqueBankroll = (paris, bankrollInitiale = 0) => {
  const termines = paris
    .filter(p => p.statut !== 'en_attente')
    .sort((a, b) => new Date(a.created) - new Date(b.created))

  let courante = bankrollInitiale
  return termines.map(pari => {
    courante += pari.profit_perte
    return { date: pari.created, bankroll: courante }
  })
}
