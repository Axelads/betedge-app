import React, { useState, useCallback, useRef } from 'react'
import {
  View, Text, ScrollView, ActivityIndicator,
  Pressable, Modal, Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { captureRef } from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import { LinearGradient } from 'expo-linear-gradient'
import { getTousLesParis } from '../services/pocketbase'
import { useAbonnement } from '../context/AbonnementContext'
import {
  calculerROI,
  calculerTauxReussite,
  calculerROIParSport,
  calculerROIParTypePari,
  calculerTauxReussiteParConfiance,
  calculerMeilleurssTags,
  calculerHistoriqueBankroll,
} from '../services/stats'
import { useTheme } from '../context/ThemeContext'
import CarteStatsPartage from '../components/CarteStatsPartage'

const LABEL_SPORT = {
  football:   '⚽ Football',
  tennis:     '🎾 Tennis',
  basketball: '🏀 Basketball',
  rugby:      '🏉 Rugby',
  autre:      '🏆 Autre',
}

const LABEL_TYPE_PARI = {
  victoire_domicile:   'Victoire domicile',
  victoire_exterieur:  'Victoire extérieur',
  nul:                 'Nul',
  double_chance:       'Double chance',
  plus_de:             'Plus de X buts',
  moins_de:            'Moins de X buts',
  les_deux_marquent:   'Les deux marquent',
  score_exact:         'Score exact',
  buteur_a_tout_moment:'Buteur à tout moment',
  premier_buteur:      'Premier buteur',
  handicap:            'Handicap',
  nombre_corners:      'Corners',
  nombre_cartons:      'Cartons',
  qualification:       'Qualification',
  vainqueur_tournoi:   'Vainqueur tournoi',
  top_n:               'Top N',
  relegation:          'Relégation',
  combine:             'Combiné',
}

const LABEL_TAG = {
  forme_domicile_forte:    'Domicile fort',
  forme_domicile_faible:   'Domicile faible',
  forme_exterieur_forte:   'Extérieur fort',
  forme_exterieur_faible:  'Extérieur faible',
  equipe_motivee:          'Équipe motivée',
  equipe_sans_enjeu:       'Équipe sans enjeu',
  blessures_adversaire:    'Blessures adversaire',
  fatigue_calendrier:      'Fatigue calendrier',
  style_defensif:          'Style défensif',
  over_equipes_offensives: 'Équipes offensives',
  under_conditions_meteo:  'Conditions météo',
  cote_value:              'Cote value',
  stat_domination:         'Domination stats',
  instinct:                'Instinct',
}

const MOIS_LABELS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

// ─── Barre horizontale ───────────────────────────────────────────────────────

function BarreROI({ label, roi, nombreParis, maxAbsROI, c }) {
  const LARGEUR_MAX = 180
  const pct = maxAbsROI === 0 ? 0 : Math.abs(roi) / maxAbsROI
  const largeur = Math.max(pct * LARGEUR_MAX, 3)
  const couleur = roi >= 0 ? '#22c55e' : '#ef4444'

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ fontSize: 13, color: c.texte, fontWeight: '500', flex: 1 }} numberOfLines={1}>
          {label}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: couleur, marginLeft: 8 }}>
          {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{
          height: 8, width: largeur, borderRadius: 4,
          backgroundColor: couleur,
        }} />
        <Text style={{ fontSize: 11, color: c.texteSecondaire }}>
          {nombreParis} pari{nombreParis > 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  )
}

// ─── Section titre ───────────────────────────────────────────────────────────

function SectionTitre({ icone, titre, c }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <Ionicons name={icone} size={18} color="#3b82f6" />
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.texte }}>
        {titre}
      </Text>
    </View>
  )
}

// ─── Carte de section ────────────────────────────────────────────────────────

function Carte({ children, c }) {
  return (
    <View style={{
      backgroundColor: c.fondCarte,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.bordure,
    }}>
      {children}
    </View>
  )
}

// ─── Étoiles de confiance ────────────────────────────────────────────────────

function LigneConfiance({ niveau, taux, nombreParis, c }) {
  const couleur = taux >= 60 ? '#22c55e' : taux >= 45 ? '#f59e0b' : '#ef4444'
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: c.bordure,
    }}>
      {/* Étoiles */}
      <View style={{ flexDirection: 'row', width: 90, gap: 2 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Ionicons
            key={i}
            name={i <= niveau ? 'star' : 'star-outline'}
            size={14}
            color={i <= niveau ? '#f59e0b' : c.bordure}
          />
        ))}
      </View>
      {/* Barre de taux */}
      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <View style={{ height: 6, backgroundColor: c.fondBadge, borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ height: 6, width: `${taux}%`, backgroundColor: couleur, borderRadius: 3 }} />
        </View>
      </View>
      {/* Taux + nb */}
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: couleur, width: 44, textAlign: 'right' }}>
        {nombreParis === 0 ? '—' : `${taux.toFixed(0)}%`}
      </Text>
      <Text style={{ fontSize: 11, color: c.texteSecondaire, width: 36, textAlign: 'right' }}>
        {nombreParis > 0 ? `${nombreParis}p` : ''}
      </Text>
    </View>
  )
}

// ─── Miniature historique bankroll ───────────────────────────────────────────

function CourbeSimplifiee({ historique, c }) {
  if (historique.length < 2) return null

  const valeurs = historique.map(h => h.bankroll)
  const min = Math.min(...valeurs)
  const max = Math.max(...valeurs)
  const amplitude = max - min || 1
  const HAUTEUR = 56
  const NB_MAX = 20
  const points = historique.slice(-NB_MAX)

  return (
    <View style={{ height: HAUTEUR, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
      {points.map((point, idx) => {
        const pct = (point.bankroll - min) / amplitude
        const hauteur = Math.max(pct * HAUTEUR, 3)
        const couleur = point.bankroll >= 0 ? '#22c55e' : '#ef4444'
        return (
          <View
            key={idx}
            style={{
              flex: 1,
              height: hauteur,
              backgroundColor: couleur,
              borderRadius: 2,
              opacity: 0.8,
            }}
          />
        )
      })}
    </View>
  )
}

// ─── Écran principal ─────────────────────────────────────────────────────────

export default function StatsScreen() {
  const { c } = useTheme()
  const { estPremium, ouvrirPaywall } = useAbonnement()
  const [paris, setParis] = useState([])
  const [chargement, setChargement] = useState(true)
  const [modalePartageVisible, setModalePartageVisible] = useState(false)
  const [enCoursCapture, setEnCoursCapture] = useState(false)
  const [moisDebutHistorique, setMoisDebutHistorique] = useState(null)
  const carteRef = useRef(null)

  const chargerDonnees = useCallback(async () => {
    setChargement(true)
    try {
      const donnees = await getTousLesParis()
      setParis(donnees)
    } catch (_) {}
    finally {
      setChargement(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { chargerDonnees() }, [chargerDonnees]))

  const capturerEtPartager = async () => {
    try {
      setEnCoursCapture(true)
      const uri = await captureRef(carteRef, { format: 'png', quality: 1 })
      setEnCoursCapture(false)
      const disponible = await Sharing.isAvailableAsync()
      if (disponible) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Partager mes stats BetEdge',
        })
      } else {
        Alert.alert('Partage indisponible', 'Le partage n\'est pas supporté sur cet appareil.')
      }
    } catch (e) {
      setEnCoursCapture(false)
      console.error('capturerEtPartager erreur:', e)
      Alert.alert('Erreur', 'Impossible de capturer la carte.')
    }
  }

  if (chargement) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fond }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  const parisTermines = paris.filter(p => p.statut !== 'en_attente')

  if (parisTermines.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fond, padding: 32 }}>
        <Text style={{ fontSize: 40, marginBottom: 14 }}>📊</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.texte, marginBottom: 8, textAlign: 'center' }}>
          Pas encore de stats
        </Text>
        <Text style={{ fontSize: 14, color: c.texteSecondaire, textAlign: 'center' }}>
          Saisis tes paris et entre leurs résultats pour voir tes statistiques de performance.
        </Text>
      </View>
    )
  }

  // ── Calculs ────────────────────────────────────────────────────────────────
  const roiParSport    = calculerROIParSport(parisTermines)
  const roiParType     = calculerROIParTypePari(parisTermines)
  const tauxConfiance  = calculerTauxReussiteParConfiance(parisTermines)
  const topTags        = calculerMeilleurssTags(parisTermines).slice(0, 6)
  const historiqueBankroll = calculerHistoriqueBankroll(
    [...parisTermines].sort((a, b) => new Date(a.created) - new Date(b.created))
  )

  const optionsMoisHistorique = [null, ...[...new Set(
    parisTermines.map(p => p.date_match?.slice(0, 7)).filter(Boolean)
  )].sort()]
  const indexMoisActuel = optionsMoisHistorique.indexOf(moisDebutHistorique)
  const parisHistoriqueFiltre = moisDebutHistorique
    ? parisTermines.filter(p => p.date_match && p.date_match.slice(0, 7) >= moisDebutHistorique)
    : parisTermines
  const historiqueBankrollAffiche = moisDebutHistorique
    ? calculerHistoriqueBankroll([...parisHistoriqueFiltre].sort((a, b) => new Date(a.created) - new Date(b.created)))
    : historiqueBankroll

  // Calcul du nb de paris par sport/type pour les barres
  const nbParSport = {}
  const nbParType  = {}
  for (const p of parisTermines) {
    nbParSport[p.sport]     = (nbParSport[p.sport]     ?? 0) + 1
    nbParType[p.type_pari]  = (nbParType[p.type_pari]  ?? 0) + 1
  }

  const maxAbsROISport = Math.max(...Object.values(roiParSport).map(Math.abs), 1)
  const maxAbsROIType  = Math.max(...Object.values(roiParType).map(Math.abs), 1)

  // Trier par ROI décroissant
  const sportsTriés = Object.entries(roiParSport).sort((a, b) => b[1] - a[1])
  const typesTriés  = Object.entries(roiParType).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Taux de réussite par confiance + nb de paris par niveau
  const nbParConfiance = {}
  for (let i = 1; i <= 5; i++) {
    const p = parisTermines.filter(p => p.confiance === i)
    nbParConfiance[i] = p.length
  }

  // Résumé général
  const roiGlobal      = calculerROI(parisTermines)
  const tauxGlobal     = calculerTauxReussite(parisTermines)
  const profitTotal    = parisTermines.reduce((s, p) => s + (p.profit_perte ?? 0), 0)
  const miseTotal      = parisTermines.reduce((s, p) => s + (p.mise ?? 0), 0)
  const coteMoyenne    = parisTermines.reduce((s, p) => s + (p.cote ?? 0), 0) / parisTermines.length
  const nbGagnes       = parisTermines.filter(p => p.statut === 'gagne').length

  // Données pour la carte de partage
  const meileurSportEntry = sportsTriés[0]
  const meileurSport      = meileurSportEntry?.[0]
  const roiMeileurSport   = meileurSportEntry?.[1] ?? 0

  return (
    <View style={{ flex: 1, backgroundColor: c.fond }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Résumé en 4 cases ──────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <View style={{ flex: 1, backgroundColor: c.fondCarte, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.bordure }}>
          <Text style={{ fontSize: 11, color: c.texteSecondaire, marginBottom: 4 }}>ROI global</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: roiGlobal >= 0 ? '#22c55e' : '#ef4444' }}>
            {roiGlobal >= 0 ? '+' : ''}{roiGlobal.toFixed(1)}%
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: c.fondCarte, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.bordure }}>
          <Text style={{ fontSize: 11, color: c.texteSecondaire, marginBottom: 4 }}>Win rate</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: tauxGlobal >= 50 ? '#22c55e' : '#ef4444' }}>
            {tauxGlobal.toFixed(0)}%
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: c.fondCarte, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.bordure }}>
          <Text style={{ fontSize: 11, color: c.texteSecondaire, marginBottom: 4 }}>Profit net</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: profitTotal >= 0 ? '#22c55e' : '#ef4444' }}>
            {profitTotal >= 0 ? '+' : ''}{profitTotal.toFixed(0)}€
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <View style={{ flex: 1, backgroundColor: c.fondCarte, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.bordure }}>
          <Text style={{ fontSize: 11, color: c.texteSecondaire, marginBottom: 4 }}>Mises totales</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.texte }}>{miseTotal.toFixed(0)}€</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: c.fondCarte, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.bordure }}>
          <Text style={{ fontSize: 11, color: c.texteSecondaire, marginBottom: 4 }}>Paris joués</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.texte }}>{nbGagnes}W / {parisTermines.length - nbGagnes}L</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: c.fondCarte, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.bordure }}>
          <Text style={{ fontSize: 11, color: c.texteSecondaire, marginBottom: 4 }}>Cote moyenne</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.texte }}>{coteMoyenne.toFixed(2)}</Text>
        </View>
      </View>

      {/* ── Gate Premium — sections avancées ───────────────────────────────── */}
      {!estPremium && (
        <Pressable
          onPress={ouvrirPaywall}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#1e3a8a' : '#1e40af',
            borderRadius: 16, padding: 20, marginBottom: 14,
            alignItems: 'center', gap: 10,
            borderWidth: 1, borderColor: '#3b82f6',
          })}
        >
          <Ionicons name="lock-closed" size={28} color="#fbbf24" />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
            Stats avancées — Premium uniquement
          </Text>
          <Text style={{ color: '#93c5fd', fontSize: 13, textAlign: 'center' }}>
            ROI par sport · ROI par type de pari · Taux de réussite par confiance · Top tags · Courbe bankroll
          </Text>
          <View style={{ backgroundColor: '#fbbf24', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, marginTop: 4 }}>
            <Text style={{ color: '#1e3a8a', fontSize: 14, fontWeight: '800' }}>Débloquer — 9,99 €/mois</Text>
          </View>
        </Pressable>
      )}

      {/* ── Évolution bankroll ──────────────────────────────────────────────── */}
      {estPremium && historiqueBankroll.length >= 2 && (
        <Carte c={c}>
          <SectionTitre icone="trending-up-outline" titre="Évolution du profit" c={c} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Pressable
              onPress={() => {
                if (indexMoisActuel > 0) setMoisDebutHistorique(optionsMoisHistorique[indexMoisActuel - 1])
              }}
              disabled={indexMoisActuel <= 0}
              style={({ pressed }) => ({ opacity: indexMoisActuel <= 0 ? 0.3 : pressed ? 0.6 : 1, padding: 4 })}
            >
              <Ionicons name="chevron-back" size={18} color={c.texte} />
            </Pressable>
            <Text style={{ fontSize: 12, color: c.texteSecondaire, fontWeight: '500' }}>
              {!moisDebutHistorique
                ? 'Tout'
                : `Depuis ${MOIS_LABELS[parseInt(moisDebutHistorique.split('-')[1], 10) - 1]} ${moisDebutHistorique.split('-')[0]}`
              }
            </Text>
            <Pressable
              onPress={() => {
                if (indexMoisActuel < optionsMoisHistorique.length - 1) setMoisDebutHistorique(optionsMoisHistorique[indexMoisActuel + 1])
              }}
              disabled={indexMoisActuel >= optionsMoisHistorique.length - 1}
              style={({ pressed }) => ({ opacity: indexMoisActuel >= optionsMoisHistorique.length - 1 ? 0.3 : pressed ? 0.6 : 1, padding: 4 })}
            >
              <Ionicons name="chevron-forward" size={18} color={c.texte} />
            </Pressable>
          </View>
          {historiqueBankrollAffiche.length >= 2
            ? (
              <>
                <CourbeSimplifiee historique={historiqueBankrollAffiche} c={c} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: c.texteSecondaire }}>
                    Début : {historiqueBankrollAffiche[0].bankroll >= 0 ? '+' : ''}{historiqueBankrollAffiche[0].bankroll.toFixed(2)}€
                  </Text>
                  <Text style={{ fontSize: 11, color: c.texteSecondaire }}>
                    Maintenant : {historiqueBankrollAffiche.at(-1).bankroll >= 0 ? '+' : ''}{historiqueBankrollAffiche.at(-1).bankroll.toFixed(2)}€
                  </Text>
                </View>
              </>
            )
            : (
              <Text style={{ fontSize: 13, color: c.texteSecondaire, textAlign: 'center', paddingVertical: 16 }}>
                Pas assez de paris pour cette période
              </Text>
            )
          }
        </Carte>
      )}

      {/* ── ROI par sport ───────────────────────────────────────────────────── */}
      {estPremium && <Carte c={c}>
        <SectionTitre icone="football-outline" titre="ROI par sport" c={c} />
        {sportsTriés.map(([sport, roi]) => (
          <BarreROI
            key={sport}
            label={LABEL_SPORT[sport] ?? sport}
            roi={roi}
            nombreParis={nbParSport[sport] ?? 0}
            maxAbsROI={maxAbsROISport}
            c={c}
          />
        ))}
      </Carte>}

      {/* ── ROI par type de pari ────────────────────────────────────────────── */}
      {estPremium && <Carte c={c}>
        <SectionTitre icone="pricetag-outline" titre="ROI par type de pari" c={c} />
        {typesTriés.map(([type, roi]) => (
          <BarreROI
            key={type}
            label={LABEL_TYPE_PARI[type] ?? type}
            roi={roi}
            nombreParis={nbParType[type] ?? 0}
            maxAbsROI={maxAbsROIType}
            c={c}
          />
        ))}
      </Carte>}

      {/* ── Taux de réussite par confiance ──────────────────────────────────── */}
      {estPremium && <Carte c={c}>
        <SectionTitre icone="star-outline" titre="Win rate par confiance" c={c} />
        {[5, 4, 3, 2, 1].map(niveau => (
          <LigneConfiance
            key={niveau}
            niveau={niveau}
            taux={tauxConfiance[niveau] ?? 0}
            nombreParis={nbParConfiance[niveau] ?? 0}
            c={c}
          />
        ))}
        <View style={{ marginTop: 4 }} />
      </Carte>}

      {/* ── Top tags rentables ──────────────────────────────────────────────── */}
      {estPremium && topTags.length > 0 && (
        <Carte c={c}>
          <SectionTitre icone="bookmark-outline" titre="Tags les plus rentables" c={c} />
          {topTags.map(({ tag, roi, nombre }, idx) => (
            <View
              key={tag}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 9,
                borderBottomWidth: idx < topTags.length - 1 ? 1 : 0,
                borderBottomColor: c.bordure,
                gap: 10,
              }}
            >
              {/* Rang */}
              <View style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: idx === 0 ? '#f59e0b22' : c.fondBadge,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: idx === 0 ? '#f59e0b' : c.texteBadge }}>
                  {idx + 1}
                </Text>
              </View>
              {/* Nom tag */}
              <Text style={{ flex: 1, fontSize: 13, color: c.texte }} numberOfLines={1}>
                {LABEL_TAG[tag] ?? tag}
              </Text>
              {/* Nb paris */}
              <Text style={{ fontSize: 11, color: c.texteSecondaire }}>{nombre}p</Text>
              {/* ROI */}
              <Text style={{
                fontSize: 13, fontWeight: 'bold', minWidth: 56, textAlign: 'right',
                color: roi >= 0 ? '#22c55e' : '#ef4444',
              }}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
              </Text>
            </View>
          ))}
        </Carte>
      )}
    </ScrollView>

    {/* ── Bouton flottant Partager (Premium uniquement) ──────────────────── */}
    <Pressable
      onPress={() => estPremium ? setModalePartageVisible(true) : ouvrirPaywall()}
      style={({ pressed }) => ({
        position: 'absolute',
        bottom: 24,
        right: 20,
        borderRadius: 28,
        overflow: 'hidden',
        opacity: pressed ? 0.85 : 1,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      })}
    >
      <LinearGradient
        colors={['#3b82f6', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 20,
          paddingVertical: 14,
        }}
      >
        <Ionicons name="share-social-outline" size={18} color="#fff" />
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Partager mes stats</Text>
      </LinearGradient>
    </Pressable>

    {/* ── Modale de prévisualisation ─────────────────────────────────────── */}
    <Modal
      visible={modalePartageVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setModalePartageVisible(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
      }}>
        {/* Fond tappable pour fermer */}
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={() => setModalePartageVisible(false)}
        />

        <View style={{
          backgroundColor: '#0c0f1e',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 12,
          paddingBottom: 40,
          paddingHorizontal: 20,
        }}>
          {/* Handle */}
          <View style={{
            width: 40, height: 4, borderRadius: 2,
            backgroundColor: '#334155',
            alignSelf: 'center',
            marginBottom: 20,
          }} />

          <Text style={{ fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 20, textAlign: 'center' }}>
            Aperçu de ta carte
          </Text>

          {/* Carte centrée */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <CarteStatsPartage
              ref={carteRef}
              roiGlobal={roiGlobal}
              tauxGlobal={tauxGlobal}
              profitTotal={profitTotal}
              nbGagnes={nbGagnes}
              nbTotaux={parisTermines.length}
              coteMoyenne={coteMoyenne}
              meileurSport={meileurSport}
              roiMeileurSport={roiMeileurSport}
              topTags={topTags}
              historiqueBankroll={historiqueBankroll}
            />
          </View>

          {/* Boutons d'action */}
          <Pressable
            onPress={capturerEtPartager}
            disabled={enCoursCapture}
            style={({ pressed }) => ({
              borderRadius: 16,
              overflow: 'hidden',
              opacity: pressed || enCoursCapture ? 0.7 : 1,
              marginBottom: 12,
            })}
          >
            <LinearGradient
              colors={['#3b82f6', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingVertical: 16,
              }}
            >
              {enCoursCapture
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="share-social" size={20} color="#fff" />
              }
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>
                {enCoursCapture ? 'Génération...' : 'Partager l\'image'}
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => setModalePartageVisible(false)}
            style={({ pressed }) => ({
              paddingVertical: 14,
              alignItems: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ fontSize: 14, color: '#475569' }}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>

    </View>
  )
}
