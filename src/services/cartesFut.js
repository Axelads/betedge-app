import { pb } from './pocketbase'
import { calculerROI, calculerTauxReussite, calculerMeilleureSerieVictoires } from './stats'

// ─── Définitions des types de cartes ─────────────────────────────────────────

export const TYPES_CARTES = {
  // ── Or Brillant ──
  serie_or:     { couleur: 'or',     titre: 'Série Légendaire',   emoji: '🔥' },
  sniper:       { couleur: 'or',     titre: 'Sniper d\'Élite',    emoji: '🎯' },
  value_hunter: { couleur: 'or',     titre: 'Value Hunter',       emoji: '💎' },
  roi_or:       { couleur: 'or',     titre: 'ROI Légendaire',     emoji: '📈' },
  centurion:    { couleur: 'or',     titre: 'Centurion',          emoji: '💯' },
  // ── Argent Brillant ──
  serie_argent: { couleur: 'argent', titre: 'Belle Série',        emoji: '⚡' },
  roi_argent:   { couleur: 'argent', titre: 'Expert Rentable',    emoji: '💹' },
  analyste:     { couleur: 'argent', titre: 'Analyste du Mois',   emoji: '📊' },
  bonne_semaine:{ couleur: 'argent', titre: 'Bonne Semaine',      emoji: '🎖️' },
  // ── Bronze Brillant ──
  premier_gain: { couleur: 'bronze', titre: 'Première Victoire',  emoji: '⭐' },
  serie_bronze: { couleur: 'bronze', titre: 'Première Série',     emoji: '🎮' },
  explorateur:  { couleur: 'bronze', titre: 'Explorateur Sportif',emoji: '🌍' },
  regulier:     { couleur: 'bronze', titre: 'Parieur Régulier',   emoji: '📅' },
  dix_paris:    { couleur: 'bronze', titre: 'Dix Paris !',        emoji: '🏆' },
  // ── Niveaux de compte ──
  recrue:           { couleur: 'bronze', titre: 'Recrue BetEdge',   emoji: '🎽' },
  parieur_20:       { couleur: 'bronze', titre: 'Parieur',          emoji: '🃏' },
  cinquante_paris:  { couleur: 'argent', titre: 'Cap des 50',       emoji: '🏅' },
  maitre_paris:     { couleur: 'or',     titre: 'Maître des Paris', emoji: '👑' },
  legende:          { couleur: 'or',     titre: 'Légende BetEdge',  emoji: '🌟' },
  // ── Performance spéciale ──
  bankroll_positive:{ couleur: 'bronze', titre: 'Bankroll au Vert', emoji: '📗' },
  multisport:       { couleur: 'argent', titre: 'Polyvalent',       emoji: '🏟️' },
  gros_coup:        { couleur: 'or',     titre: 'Gros Coup',        emoji: '💥' },
  invaincu_dix:     { couleur: 'argent', titre: 'Invaincu',         emoji: '🛡️' },
}

// ─── Niveaux de compte ───────────────────────────────────────────────────────

export const NIVEAUX_COMPTE = [
  { niveau: 1, label: 'Recrue',    seuil: 1,   couleur: 'bronze', typeCarte: 'recrue' },
  { niveau: 2, label: 'Parieur',   seuil: 20,  couleur: 'bronze', typeCarte: 'parieur_20' },
  { niveau: 3, label: 'Initié',    seuil: 50,  couleur: 'argent', typeCarte: 'cinquante_paris' },
  { niveau: 4, label: 'Centurion', seuil: 100, couleur: 'or',     typeCarte: 'centurion' },
  { niveau: 5, label: 'Maître',    seuil: 200, couleur: 'or',     typeCarte: 'maitre_paris' },
  { niveau: 6, label: 'Légende',   seuil: 500, couleur: 'or',     typeCarte: 'legende' },
]

export const calculerNiveauCompte = (nbParis) => {
  let niveauActuel = NIVEAUX_COMPTE[0]
  for (const niv of NIVEAUX_COMPTE) {
    if (nbParis >= niv.seuil) niveauActuel = niv
    else break
  }
  const indexActuel = NIVEAUX_COMPTE.indexOf(niveauActuel)
  const niveauSuivant = NIVEAUX_COMPTE[indexActuel + 1] ?? null
  const progression = niveauSuivant
    ? Math.min(1, (nbParis - niveauActuel.seuil) / (niveauSuivant.seuil - niveauActuel.seuil))
    : 1
  return { niveauActuel, niveauSuivant, progression, nbParis }
}

// ─── Helpers de période ───────────────────────────────────────────────────────

const cleMois = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const dateLundi = () => {
  const now = new Date()
  const lundi = new Date(now)
  const jour = now.getDay()
  const diff = jour === 0 ? -6 : 1 - jour
  lundi.setDate(now.getDate() + diff)
  return lundi.toISOString().substring(0, 10)
}

const debutMoisStr = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10)
}

const debutSemaineStr = () => {
  const now = new Date()
  const lundi = new Date(now)
  const jour = now.getDay()
  const diff = jour === 0 ? -6 : 1 - jour
  lundi.setDate(now.getDate() + diff)
  return lundi.toISOString().substring(0, 10)
}

const estDansPeriode = (dateStr, debut) => {
  if (!dateStr || !debut) return false
  return String(dateStr).substring(0, 10) >= debut
}

// Série en cours (du dernier pari vers le passé, jusqu'à la première défaite)
const serieActuelle = (paris) => {
  const termines = [...paris]
    .filter(p => p.statut === 'gagne' || p.statut === 'perdu')
    .sort((a, b) => {
      const d = new Date(b.date_match) - new Date(a.date_match)
      return d !== 0 ? d : new Date(b.created) - new Date(a.created)
    })
  let s = 0
  for (const p of termines) {
    if (p.statut === 'gagne') s++
    else break
  }
  return s
}

// Construire les stats condensées pour une liste de paris
const construireStats = (paris) => {
  const termines = paris.filter(p => p.statut === 'gagne' || p.statut === 'perdu')
  const coteMoyenne = termines.length > 0
    ? termines.reduce((s, p) => s + (p.cote || 0), 0) / termines.length
    : 0
  const profit = termines.reduce((s, p) => s + (p.profit_perte || 0), 0)
  return {
    roi:          calculerROI(termines),
    winRate:      calculerTauxReussite(termines),
    serie:        calculerMeilleureSerieVictoires(paris),
    coteMoyenne:  parseFloat(coteMoyenne.toFixed(2)),
    profit:       parseFloat(profit.toFixed(2)),
    nbParis:      termines.length,
  }
}

// Vérifie si une carte de ce type (+ période) existe déjà
const aCarte = (cartesExistantes, type, periode = null) => {
  return cartesExistantes.some(c => {
    if (c.type !== type) return false
    if (periode === null) return true
    return c.periode === periode
  })
}

// ─── Moteur d'évaluation ──────────────────────────────────────────────────────

export const evaluerNouvellesCartes = (allParis, cartesExistantes) => {
  const nouvelles = []

  const mois        = cleMois()
  const lundi       = dateLundi()
  const debutMois   = debutMoisStr()
  const debutSemaine = debutSemaineStr()

  const gagnes        = allParis.filter(p => p.statut === 'gagne')
  const parisMois     = allParis.filter(p => estDansPeriode(p.date_match, debutMois))
  const parisSemaine  = allParis.filter(p => estDansPeriode(p.date_match, debutSemaine))

  const serie = serieActuelle(allParis)
  const terminesMois = parisMois.filter(p => p.statut === 'gagne' || p.statut === 'perdu')
  const roiMois = calculerROI(terminesMois)

  // ── Bronze: premier_gain (unique) ────────────────────────────────────────────
  if (gagnes.length >= 1 && !aCarte(cartesExistantes, 'premier_gain')) {
    const premier = [...gagnes].sort((a, b) => new Date(a.created) - new Date(b.created))[0]
    nouvelles.push({
      type: 'premier_gain',
      raison: `Premier pari gagné · ${premier.rencontre || 'Félicitations !'}`,
      statistiques: {
        roi: parseFloat(((premier.cote - 1) * 100).toFixed(1)),
        winRate: 100,
        serie: 1,
        coteMoyenne: premier.cote,
        profit: parseFloat((premier.profit_perte || 0).toFixed(2)),
        nbParis: 1,
      },
      note: 65,
    })
  }

  // ── Bronze: dix_paris (unique, 10 paris total) ────────────────────────────────
  if (allParis.length >= 10 && !aCarte(cartesExistantes, 'dix_paris')) {
    nouvelles.push({
      type: 'dix_paris',
      raison: `${allParis.length} paris enregistrés sur la plateforme !`,
      statistiques: construireStats(allParis),
      note: 66,
    })
  }

  // ── Bronze: explorateur (unique, 3 sports différents) ─────────────────────────
  if (!aCarte(cartesExistantes, 'explorateur')) {
    const sports = new Set(
      allParis.map(p => p.sport?.split(',')[0]?.trim()).filter(Boolean)
    )
    if (sports.size >= 3) {
      const listeSports = [...sports].slice(0, 3).join(', ')
      nouvelles.push({
        type: 'explorateur',
        raison: `Paris sur ${sports.size} sports : ${listeSports}`,
        statistiques: construireStats(allParis),
        note: 63,
      })
    }
  }

  // ── Bronze: serie_bronze (3 victoires consécutives, 1 max/semaine) ──────────
  if (serie >= 3 && !aCarte(cartesExistantes, 'serie_bronze', lundi)) {
    nouvelles.push({
      type: 'serie_bronze',
      raison: `${serie} victoires d'affilée !`,
      statistiques: { ...construireStats(allParis), serie },
      note: Math.min(69, 63 + (serie - 3)),
    })
  }

  // ── Bronze: regulier (10 paris ce mois, 1 max/mois) ──────────────────────────
  if (parisMois.length >= 10 && !aCarte(cartesExistantes, 'regulier', mois)) {
    const labelMois = new Date().toLocaleString('fr-FR', { month: 'long' })
    nouvelles.push({
      type: 'regulier',
      raison: `${parisMois.length} paris en ${labelMois} — régularité exemplaire !`,
      statistiques: construireStats(parisMois),
      note: 64,
      periode: mois,
    })
  }

  // ── Argent: serie_argent (5 victoires consécutives, 1 max/semaine) ──────────
  if (serie >= 5 && !aCarte(cartesExistantes, 'serie_argent', lundi)) {
    nouvelles.push({
      type: 'serie_argent',
      raison: `Belle série de ${serie} victoires consécutives !`,
      statistiques: { ...construireStats(allParis), serie },
      note: Math.min(84, 75 + (serie - 5)),
      periode: lundi,
    })
  }

  // ── Argent: bonne_semaine (≥5 paris terminés + ≥70% victoires, 1 max/semaine)
  const terminesSemaine = parisSemaine.filter(p => p.statut === 'gagne' || p.statut === 'perdu')
  const gagneesSemaine  = terminesSemaine.filter(p => p.statut === 'gagne')
  const winRateSemaine  = terminesSemaine.length > 0
    ? (gagneesSemaine.length / terminesSemaine.length) * 100
    : 0
  if (terminesSemaine.length >= 5 && winRateSemaine >= 70 && !aCarte(cartesExistantes, 'bonne_semaine', lundi)) {
    nouvelles.push({
      type: 'bonne_semaine',
      raison: `${Math.round(winRateSemaine)}% de victoires cette semaine — impressionnant !`,
      statistiques: construireStats(parisSemaine),
      note: 75,
      periode: lundi,
    })
  }

  // ── Argent: analyste (15 paris avec ≥2 tags dans le mois, 1 max/mois) ──────
  const parisAnalyste = parisMois.filter(
    p => Array.isArray(p.tags_raisonnement) && p.tags_raisonnement.length >= 2
  )
  if (parisAnalyste.length >= 15 && !aCarte(cartesExistantes, 'analyste', mois)) {
    const labelMois = new Date().toLocaleString('fr-FR', { month: 'long' })
    nouvelles.push({
      type: 'analyste',
      raison: `${parisAnalyste.length} paris analysés en détail en ${labelMois}`,
      statistiques: construireStats(parisMois),
      note: 77,
      periode: mois,
    })
  }

  // ── Argent: roi_argent (ROI > 15% ce mois + ≥8 paris terminés, 1 max/mois) ─
  if (terminesMois.length >= 8 && roiMois > 15 && !aCarte(cartesExistantes, 'roi_argent', mois)) {
    nouvelles.push({
      type: 'roi_argent',
      raison: `ROI de +${Math.round(roiMois)}% ce mois — tu maîtrises !`,
      statistiques: construireStats(parisMois),
      note: Math.min(84, Math.round(75 + roiMois * 0.15)),
      periode: mois,
    })
  }

  // ── Or: serie_or (7 victoires consécutives, 1 max/semaine) ──────────────────
  if (serie >= 7 && !aCarte(cartesExistantes, 'serie_or', lundi)) {
    nouvelles.push({
      type: 'serie_or',
      raison: `Série légendaire de ${serie} victoires d'affilée !`,
      statistiques: { ...construireStats(allParis), serie },
      note: Math.min(99, 88 + (serie - 7)),
      periode: lundi,
    })
  }

  // ── Or: value_hunter (3 victoires consécutives cote ≥ 2.50, 1 max/mois) ────
  const parisHauteCote   = allParis.filter(p => (p.cote ?? 0) >= 2.50)
  const serieHauteCote   = serieActuelle(parisHauteCote)
  if (serieHauteCote >= 3 && !aCarte(cartesExistantes, 'value_hunter', mois)) {
    nouvelles.push({
      type: 'value_hunter',
      raison: `3 victoires consécutives à cote ≥ 2.50 — tu trouves la valeur !`,
      statistiques: construireStats(parisHauteCote),
      note: 90,
      periode: mois,
    })
  }

  // ── Or: sniper (5 victoires consécutives confiance 5/5, 1 max/mois) ─────────
  const parisHighConf  = allParis.filter(p => (p.confiance ?? 0) >= 5)
  const serieHighConf  = serieActuelle(parisHighConf)
  if (serieHighConf >= 5 && !aCarte(cartesExistantes, 'sniper', mois)) {
    nouvelles.push({
      type: 'sniper',
      raison: `${serieHighConf} victoires consécutives avec confiance maximale !`,
      statistiques: { ...construireStats(parisHighConf), serie: serieHighConf },
      note: 94,
      periode: mois,
    })
  }

  // ── Or: roi_or (ROI > 30% ce mois + ≥10 paris terminés, 1 max/mois) ────────
  if (terminesMois.length >= 10 && roiMois > 30 && !aCarte(cartesExistantes, 'roi_or', mois)) {
    nouvelles.push({
      type: 'roi_or',
      raison: `ROI légendaire de +${Math.round(roiMois)}% ce mois — du jamais vu !`,
      statistiques: construireStats(parisMois),
      note: Math.min(99, Math.round(85 + roiMois * 0.1)),
      periode: mois,
    })
  }

  // ── Or: centurion (100+ paris total, unique) ──────────────────────────────────
  if (allParis.length >= 100 && !aCarte(cartesExistantes, 'centurion')) {
    nouvelles.push({
      type: 'centurion',
      raison: `${allParis.length} paris enregistrés — tu es un centurion !`,
      statistiques: construireStats(allParis),
      note: 95,
    })
  }

  // ── Niveau 1 — Recrue (1er pari enregistré, unique) ───────────────────────────
  if (allParis.length >= 1 && !aCarte(cartesExistantes, 'recrue')) {
    nouvelles.push({
      type: 'recrue',
      raison: `Premier pari enregistré — bienvenue dans l'arène !`,
      statistiques: construireStats(allParis),
      note: 60,
    })
  }

  // ── Niveau 2 — Parieur (20 paris total, unique) ───────────────────────────────
  if (allParis.length >= 20 && !aCarte(cartesExistantes, 'parieur_20')) {
    nouvelles.push({
      type: 'parieur_20',
      raison: `${allParis.length} paris — tu prends tes marques !`,
      statistiques: construireStats(allParis),
      note: 68,
    })
  }

  // ── Niveau 3 — Initié (50 paris total, unique) ────────────────────────────────
  if (allParis.length >= 50 && !aCarte(cartesExistantes, 'cinquante_paris')) {
    nouvelles.push({
      type: 'cinquante_paris',
      raison: `Cap des 50 paris — l'expérience commence à parler !`,
      statistiques: construireStats(allParis),
      note: 78,
    })
  }

  // ── Niveau 5 — Maître (200 paris total, unique) ───────────────────────────────
  if (allParis.length >= 200 && !aCarte(cartesExistantes, 'maitre_paris')) {
    nouvelles.push({
      type: 'maitre_paris',
      raison: `${allParis.length} paris — tu domines le jeu !`,
      statistiques: construireStats(allParis),
      note: 97,
    })
  }

  // ── Niveau 6 — Légende (500 paris total, unique) ──────────────────────────────
  if (allParis.length >= 500 && !aCarte(cartesExistantes, 'legende')) {
    nouvelles.push({
      type: 'legende',
      raison: `${allParis.length} paris — une légende est née !`,
      statistiques: construireStats(allParis),
      note: 99,
    })
  }

  // ── Bankroll au Vert (1er mois rentable, unique) ──────────────────────────────
  if (!aCarte(cartesExistantes, 'bankroll_positive')) {
    const terminesAll = allParis.filter(p => p.statut === 'gagne' || p.statut === 'perdu')
    const profitParMois = {}
    for (const p of terminesAll) {
      const cleP = String(p.date_match || p.created).substring(0, 7)
      if (!profitParMois[cleP]) profitParMois[cleP] = 0
      profitParMois[cleP] += (p.profit_perte || 0)
    }
    const entreePositive = Object.entries(profitParMois).find(([, v]) => v > 0)
    if (entreePositive) {
      const [moisPositif, profitMois] = entreePositive
      nouvelles.push({
        type: 'bankroll_positive',
        raison: `Premier mois rentable (${moisPositif}) : +${Math.round(profitMois)}€ !`,
        statistiques: construireStats(
          terminesAll.filter(p => String(p.date_match || p.created).startsWith(moisPositif))
        ),
        note: 67,
      })
    }
  }

  // ── Polyvalent (victoires sur ≥5 sports différents, unique) ──────────────────
  if (!aCarte(cartesExistantes, 'multisport')) {
    const sportsGagnes = new Set(
      gagnes.map(p => p.sport?.split(',')[0]?.trim()).filter(Boolean)
    )
    if (sportsGagnes.size >= 5) {
      nouvelles.push({
        type: 'multisport',
        raison: `Victoires sur ${sportsGagnes.size} sports différents — quel polyvalent !`,
        statistiques: construireStats(allParis),
        note: 79,
      })
    }
  }

  // ── Gros Coup (victoire à cote ≥ 5.0, unique) ────────────────────────────────
  if (!aCarte(cartesExistantes, 'gros_coup')) {
    const grosCoup = gagnes.find(p => (p.cote ?? 0) >= 5.0)
    if (grosCoup) {
      nouvelles.push({
        type: 'gros_coup',
        raison: `Victoire à la cote ${grosCoup.cote} — quel coup de maître !`,
        statistiques: {
          roi:         parseFloat(((grosCoup.cote - 1) * 100).toFixed(1)),
          winRate:     100,
          serie:       1,
          coteMoyenne: grosCoup.cote,
          profit:      parseFloat((grosCoup.profit_perte || 0).toFixed(2)),
          nbParis:     1,
        },
        note: 92,
      })
    }
  }

  // ── Invaincu (10 victoires consécutives, 1 max/semaine) ───────────────────────
  if (serie >= 10 && !aCarte(cartesExistantes, 'invaincu_dix', lundi)) {
    nouvelles.push({
      type: 'invaincu_dix',
      raison: `${serie} victoires d'affilée — tu es inarrêtable !`,
      statistiques: { ...construireStats(allParis), serie },
      note: Math.min(96, 86 + (serie - 10)),
      periode: lundi,
    })
  }

  return nouvelles
}

// ─── PocketBase CRUD ──────────────────────────────────────────────────────────

export const getCartesUtilisateur = async () => {
  try {
    const userId = pb.authStore.record?.id
    if (!userId) return []
    return await pb.collection('cartes_fut').getFullList({
      filter: `user = "${userId}"`,
      sort: '-created',
    })
  } catch {
    return []
  }
}

export const getCartesNonVues = async () => {
  try {
    const userId = pb.authStore.record?.id
    if (!userId) return []
    return await pb.collection('cartes_fut').getFullList({
      filter: `user = "${userId}" && vue = false`,
      sort: 'created',
    })
  } catch {
    return []
  }
}

export const sauvegarderCarte = async (carte) => {
  try {
    const userId = pb.authStore.record?.id
    if (!userId) return null
    const def = TYPES_CARTES[carte.type]
    return await pb.collection('cartes_fut').create({
      user:         userId,
      type:         carte.type,
      couleur:      def?.couleur   ?? 'bronze',
      titre:        def?.titre     ?? carte.type,
      emoji:        def?.emoji     ?? '🏆',
      raison:       carte.raison,
      statistiques: JSON.stringify(carte.statistiques),
      note:         carte.note,
      vue:          false,
      periode:      carte.periode ?? null,
    })
  } catch (error) {
    console.error('sauvegarderCarte erreur:', error)
    return null
  }
}

export const marquerCarteVue = async (id) => {
  try {
    return await pb.collection('cartes_fut').update(id, { vue: true })
  } catch (error) {
    console.error('marquerCarteVue erreur:', error)
  }
}

// Supprime les doublons : garde le plus récent par combinaison type+période
export const nettoyerCartesDupliquees = async () => {
  try {
    const userId = pb.authStore.record?.id
    if (!userId) return
    const toutes = await pb.collection('cartes_fut').getFullList({
      filter: `user = "${userId}"`,
      sort: '-created',
    })
    const vues = new Map()
    const aSupprimer = []
    for (const c of toutes) {
      const cle = `${c.type}_${c.periode ?? ''}`
      if (vues.has(cle)) {
        aSupprimer.push(c.id)
      } else {
        vues.set(cle, c.id)
      }
    }
    if (aSupprimer.length > 0) {
      await Promise.all(aSupprimer.map(id => pb.collection('cartes_fut').delete(id)))
      console.log(`nettoyerCartesDupliquees: ${aSupprimer.length} doublon(s) supprimé(s)`)
    }
  } catch (error) {
    console.error('nettoyerCartesDupliquees erreur:', error)
  }
}
