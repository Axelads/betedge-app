import React, { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, Pressable, ActivityIndicator
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { getTousLesParis } from '../services/pocketbase'
import { calculerROI, calculerTauxReussite } from '../services/stats'
import { useTheme } from '../context/ThemeContext'

const EMOJI_SPORT = {
  football:   '⚽',
  tennis:     '🎾',
  basketball: '🏀',
  rugby:      '🏉',
  autre:      '🏆',
}

const CONFIG_STATUT = {
  en_attente: { icon: 'time-outline',          iconColor: '#d97706', label: 'En attente' },
  gagne:      { icon: 'checkmark-circle',      iconColor: '#16a34a', label: 'Gagné' },
  perdu:      { icon: 'close-circle',          iconColor: '#dc2626', label: 'Perdu' },
  nul:        { icon: 'remove-circle-outline', iconColor: '#6b7280', label: 'Nul' },
  cashout:    { icon: 'cash-outline',          iconColor: '#2563eb', label: 'Cashout' },
}

// Calcule la série en cours (victoires consécutives ou défaites consécutives)
const calculerSerieEnCours = (paris) => {
  const termines = paris
    .filter(p => p.statut === 'gagne' || p.statut === 'perdu')
    .sort((a, b) => new Date(b.created) - new Date(a.created))

  if (termines.length === 0) return { nb: 0, type: null }

  const premierStatut = termines[0].statut
  let nb = 0
  for (const pari of termines) {
    if (pari.statut === premierStatut) nb++
    else break
  }
  return { nb, type: premierStatut }
}

// Carte de stat rapide
function CarteStatRapide({ titre, valeur, sousTexte, couleurValeur, icone, couleurIcone, c }) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: c.fondCarte,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: c.bordure,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text style={{ fontSize: 12, color: c.texteSecondaire, fontWeight: '500' }}>{titre}</Text>
        <View style={{ backgroundColor: couleurIcone + '22', borderRadius: 8, padding: 5 }}>
          <Ionicons name={icone} size={14} color={couleurIcone} />
        </View>
      </View>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: couleurValeur ?? c.texte, marginBottom: 2 }}>
        {valeur}
      </Text>
      {sousTexte ? (
        <Text style={{ fontSize: 11, color: c.texteSecondaire }}>{sousTexte}</Text>
      ) : null}
    </View>
  )
}

// Mini card d'un pari récent
function CartePariRecent({ pari, c }) {
  const cfg = CONFIG_STATUT[pari.statut] ?? CONFIG_STATUT.en_attente
  const emoji = EMOJI_SPORT[pari.sport] ?? '🏆'
  const profitPerte = pari.profit_perte ?? 0
  const dateMatch = new Date(pari.date_match).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

  return (
    <View style={{
      backgroundColor: c.fondCarte,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.bordure,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    }}>
      {/* Emoji sport */}
      <View style={{
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: c.fondBadge,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>

      {/* Infos match */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ fontWeight: '600', color: c.texte, fontSize: 14 }}
          numberOfLines={1}
        >
          {pari.rencontre}
        </Text>
        <Text style={{ fontSize: 12, color: c.texteSecondaire, marginTop: 1 }}>
          {pari.valeur_pari} @ {pari.cote} — {dateMatch}
        </Text>
      </View>

      {/* Statut + profit */}
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Ionicons name={cfg.icon} size={18} color={cfg.iconColor} />
        {pari.statut !== 'en_attente' && (
          <Text style={{
            fontSize: 13, fontWeight: 'bold',
            color: profitPerte >= 0 ? '#16a34a' : '#dc2626',
          }}>
            {profitPerte >= 0 ? '+' : ''}{profitPerte.toFixed(2)}€
          </Text>
        )}
      </View>
    </View>
  )
}

export default function HomeScreen({ navigation }) {
  const { c, estSombre } = useTheme()
  const [paris, setParis] = useState([])
  const [chargement, setChargement] = useState(true)

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

  // Recharger à chaque fois que l'écran devient actif
  useFocusEffect(chargerDonnees)

  // ── Calculs ─────────────────────────────────────────────────────────────────
  const parisTermines = paris.filter(p => p.statut !== 'en_attente')
  const roi = calculerROI(parisTermines)
  const tauxReussite = calculerTauxReussite(parisTermines)
  const profitTotal = parisTermines.reduce((sum, p) => sum + (p.profit_perte ?? 0), 0)
  const serie = calculerSerieEnCours(paris)
  const parisEnAttente = paris.filter(p => p.statut === 'en_attente')
  const cinqDerniers = paris.slice(0, 5)

  if (chargement) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fond }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.fond }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Carte ROI principale ─────────────────────────────────────────── */}
        <LinearGradient
          colors={roi >= 0 ? ['#1e3a8a', '#2563eb'] : ['#7f1d1d', '#dc2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 24, marginBottom: 16 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
            ROI global
          </Text>
          <Text style={{ color: '#ffffff', fontSize: 48, fontWeight: 'bold', marginBottom: 2 }}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
            {parisTermines.length} paris terminés
            {profitTotal !== 0 && ` · ${profitTotal >= 0 ? '+' : ''}${profitTotal.toFixed(2)}€`}
          </Text>

          {/* Série en cours */}
          {serie.nb >= 2 && (
            <View style={{
              marginTop: 14,
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 8,
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}>
              <Text style={{ fontSize: 16 }}>
                {serie.type === 'gagne' ? '🔥' : '🥶'}
              </Text>
              <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 13 }}>
                {serie.nb} {serie.type === 'gagne' ? 'victoires' : 'défaites'} de suite
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* ── Stats rapides ─────────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <CarteStatRapide
            c={c}
            titre="Taux de réussite"
            valeur={`${tauxReussite.toFixed(0)}%`}
            sousTexte={`${parisTermines.filter(p => p.statut === 'gagne').length} gagnés`}
            couleurValeur={tauxReussite >= 50 ? '#16a34a' : '#dc2626'}
            icone="trophy-outline"
            couleurIcone="#f59e0b"
          />
          <CarteStatRapide
            c={c}
            titre="En attente"
            valeur={parisEnAttente.length}
            sousTexte={parisEnAttente.length > 0 ? 'résultats à saisir' : 'aucun en cours'}
            couleurIcone="#3b82f6"
            icone="time-outline"
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <CarteStatRapide
            c={c}
            titre="Total paris"
            valeur={paris.length}
            sousTexte={`dont ${parisTermines.length} terminés`}
            couleurIcone="#8b5cf6"
            icone="stats-chart-outline"
          />
          <CarteStatRapide
            c={c}
            titre="Profit / Perte"
            valeur={`${profitTotal >= 0 ? '+' : ''}${profitTotal.toFixed(2)}€`}
            couleurValeur={profitTotal >= 0 ? '#16a34a' : '#dc2626'}
            couleurIcone={profitTotal >= 0 ? '#16a34a' : '#dc2626'}
            icone={profitTotal >= 0 ? 'trending-up-outline' : 'trending-down-outline'}
          />
        </View>

        {/* ── 5 derniers paris ─────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 17, fontWeight: 'bold', color: c.texte }}>
            Derniers paris
          </Text>
          <Pressable onPress={() => navigation.navigate('Historique')}>
            <Text style={{ fontSize: 13, color: '#3b82f6', fontWeight: '600' }}>Voir tout</Text>
          </Pressable>
        </View>

        {cinqDerniers.length === 0 ? (
          <View style={{
            backgroundColor: c.fondCarte,
            borderRadius: 16,
            padding: 32,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: c.bordure,
          }}>
            <Text style={{ fontSize: 32, marginBottom: 10 }}>🎯</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: c.texte, marginBottom: 6 }}>
              Aucun pari enregistré
            </Text>
            <Text style={{ fontSize: 13, color: c.texteSecondaire, textAlign: 'center' }}>
              Commence par saisir ton premier pari pour voir tes stats ici.
            </Text>
          </View>
        ) : (
          cinqDerniers.map(pari => (
            <CartePariRecent key={pari.id} pari={pari} c={c} />
          ))
        )}
      </ScrollView>

      {/* ── Bouton flottant Nouveau pari ─────────────────────────────────── */}
      <Pressable
        onPress={() => navigation.navigate('NouveauPari')}
        style={({ pressed }) => ({
          position: 'absolute',
          bottom: 24,
          right: 20,
          backgroundColor: '#2563eb',
          borderRadius: 28,
          width: 56,
          height: 56,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#2563eb',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 6,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>
    </View>
  )
}
