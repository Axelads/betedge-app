import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, TextInput, Pressable, ScrollView, Modal,
  SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { captureRef } from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import { useTheme } from '../context/ThemeContext'
import { getTousLesParis } from '../services/pocketbase'
import { calculerROI, calculerTauxReussite, calculerMeilleureSerieVictoires } from '../services/stats'
import CarteFUTPerso, { EQUIPES_PERSO } from '../components/CarteFUTPerso'

// ─── Stats disponibles pour la carte ─────────────────────────────────────────

const STATS_DISPONIBLES = [
  { cle: 'roi',         label: 'ROI (%)'         },
  { cle: 'winRate',     label: 'Taux de victoire' },
  { cle: 'profit',      label: 'Profit total (€)' },
  { cle: 'nbParis',     label: 'Nb. paris'        },
  { cle: 'serie',       label: 'Meilleure série'  },
  { cle: 'coteMoyenne', label: 'Cote moyenne'     },
  { cle: 'nbGagnes',    label: 'Victoires'        },
  { cle: 'miseMoyenne', label: 'Mise moyenne'     },
]

const STATS_DEFAUT = ['roi', 'winRate', 'profit', 'nbParis', 'serie', 'coteMoyenne']
const MAX_STATS = 6

// ─── Calcul de la note globale (50-99) ───────────────────────────────────────

const calculerNote = (stats) => {
  if (!stats || !stats.nbParis) return 60
  return Math.min(99, Math.max(50, Math.round(
    50
    + (stats.winRate ?? 0) * 0.3
    + Math.max(0, (stats.roi ?? 0) * 0.15)
    + Math.min(10, (stats.nbParis ?? 0) * 0.1)
  )))
}

// ─── Extraction des stats depuis les paris ───────────────────────────────────

const extraireStats = (paris) => {
  const termines = paris.filter(p => p.statut === 'gagne' || p.statut === 'perdu')
  if (termines.length === 0) {
    return { roi: 0, winRate: 0, profit: 0, nbParis: 0, serie: 0, coteMoyenne: 0, nbGagnes: 0, miseMoyenne: 0 }
  }
  const gagnes       = termines.filter(p => p.statut === 'gagne')
  const profit       = termines.reduce((s, p) => s + (p.profit_perte || 0), 0)
  const coteMoyenne  = termines.reduce((s, p) => s + (p.cote || 0), 0) / termines.length
  const miseMoyenne  = termines.reduce((s, p) => s + (p.mise || 0), 0) / termines.length
  return {
    roi:         calculerROI(termines),
    winRate:     calculerTauxReussite(termines),
    profit:      parseFloat(profit.toFixed(2)),
    nbParis:     termines.length,
    serie:       calculerMeilleureSerieVictoires(paris),
    coteMoyenne: parseFloat(coteMoyenne.toFixed(2)),
    nbGagnes:    gagnes.length,
    miseMoyenne: parseFloat(miseMoyenne.toFixed(2)),
  }
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function CartePersoScreen({ visible, onFermer, avatarUrl }) {
  const { estSombre } = useTheme()

  const [titre, setTitre]                  = useState('')
  const [equipeSelectionnee, setEquipe]    = useState(null)
  const [statsSelectionnees, setStats]     = useState(STATS_DEFAUT)
  const [statsCalculees, setStatsCalculees] = useState(null)
  const [chargement, setChargement]        = useState(true)
  const [partageEnCours, setPartageEnCours] = useState(false)

  const refCarte = useRef(null)

  const c = {
    fond:      estSombre ? '#0f172a' : '#f8fafc',
    carte:     estSombre ? '#1e293b' : '#ffffff',
    texte:     estSombre ? '#f1f5f9' : '#1e293b',
    sec:       estSombre ? '#94a3b8' : '#64748b',
    bordure:   estSombre ? '#334155' : '#e2e8f0',
    accent:    '#3b82f6',
    chip:      estSombre ? '#334155' : '#e2e8f0',
    chipActif: estSombre ? '#1d4ed8' : '#dbeafe',
    chipTexte: estSombre ? '#93c5fd' : '#1d4ed8',
    champ:     estSombre ? '#0f172a' : '#f8fafc',
  }

  const chargerStats = useCallback(async () => {
    setChargement(true)
    try {
      const paris = await getTousLesParis()
      setStatsCalculees(extraireStats(paris))
    } catch {
      setStatsCalculees({ roi: 0, winRate: 0, profit: 0, nbParis: 0, serie: 0, coteMoyenne: 0, nbGagnes: 0, miseMoyenne: 0 })
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    if (visible) chargerStats()
  }, [visible, chargerStats])

  const handleChangeTitre = (val) => {
    const mots = val.trim().split(/\s+/).filter(Boolean)
    if (mots.length > 3) return
    setTitre(val)
  }

  const basculerStat = (cle) => {
    setStats(prev => {
      if (prev.includes(cle)) return prev.filter(s => s !== cle)
      if (prev.length >= MAX_STATS) return prev
      return [...prev, cle]
    })
  }

  const partager = async () => {
    setPartageEnCours(true)
    try {
      const uri = await captureRef(refCarte, { format: 'png', quality: 1.0, pixelRatio: 3 })
      const disponible = await Sharing.isAvailableAsync()
      if (!disponible) {
        Alert.alert('Partage non disponible', 'Le partage n\'est pas disponible sur cet appareil.')
        return
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Partager ma carte BetEdge' })
    } catch {
      Alert.alert('Erreur', 'Impossible de générer l\'image. Fais défiler jusqu\'à l\'aperçu et réessaie.')
    } finally {
      setPartageEnCours(false)
    }
  }

  const note = statsCalculees ? calculerNote(statsCalculees) : 60
  const nbMotsTitre = titre.trim().split(/\s+/).filter(Boolean).length

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.fond }}>

        {/* ── Header ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 14,
          borderBottomWidth: 1, borderBottomColor: c.bordure,
        }}>
          <Pressable onPress={onFermer} hitSlop={12} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color={c.texte} />
          </Pressable>
          <Text style={{ color: c.texte, fontSize: 18, fontWeight: '800', flex: 1 }}>
            Ma carte personnalisée
          </Text>
        </View>

        {chargement ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={c.accent} />
          </View>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>

                {/* ── Titre ── */}
                <View style={{
                  backgroundColor: c.carte, borderRadius: 16, padding: 16,
                  marginBottom: 14, borderWidth: 1, borderColor: c.bordure,
                }}>
                  <Text style={{ color: c.sec, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                    TITRE DE LA CARTE (3 MOTS MAX.)
                  </Text>
                  <TextInput
                    value={titre}
                    onChangeText={handleChangeTitre}
                    placeholder="Ex : Expert But Sûr"
                    placeholderTextColor={c.sec}
                    maxLength={30}
                    style={{
                      backgroundColor: c.champ, borderWidth: 1, borderColor: c.bordure,
                      borderRadius: 8, padding: 12, color: c.texte, fontSize: 15,
                    }}
                  />
                  <Text style={{ color: c.sec, fontSize: 11, marginTop: 6 }}>
                    {nbMotsTitre} / 3 mot{nbMotsTitre !== 1 ? 's' : ''}
                  </Text>
                </View>

                {/* ── Équipe ── */}
                <View style={{
                  backgroundColor: c.carte, borderRadius: 16, padding: 16,
                  marginBottom: 14, borderWidth: 1, borderColor: c.bordure,
                }}>
                  <Text style={{ color: c.sec, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>
                    ÉQUIPE FAVORITE
                  </Text>
                  <Text style={{ color: c.sec, fontSize: 12, marginBottom: 12 }}>
                    La carte prend le dégradé des couleurs officielles de ton équipe.
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {Object.keys(EQUIPES_PERSO).map((nom) => {
                      const actif = equipeSelectionnee === nom
                      return (
                        <Pressable
                          key={nom}
                          onPress={() => setEquipe(actif ? null : nom)}
                          style={{
                            paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                            backgroundColor: actif ? c.chipActif : c.chip,
                            borderWidth: 1, borderColor: actif ? c.accent : 'transparent',
                          }}
                        >
                          <Text style={{
                            color: actif ? c.chipTexte : c.sec,
                            fontSize: 12,
                            fontWeight: actif ? '700' : '400',
                          }}>
                            {nom}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>

                {/* ── Stats ── */}
                <View style={{
                  backgroundColor: c.carte, borderRadius: 16, padding: 16,
                  marginBottom: 16, borderWidth: 1, borderColor: c.bordure,
                }}>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 4,
                  }}>
                    <Text style={{ color: c.sec, fontSize: 12, fontWeight: '600' }}>
                      STATS À AFFICHER
                    </Text>
                    <Text style={{
                      color: statsSelectionnees.length >= MAX_STATS ? '#f59e0b' : c.sec,
                      fontSize: 11,
                    }}>
                      {statsSelectionnees.length} / {MAX_STATS} max.
                    </Text>
                  </View>
                  <Text style={{ color: c.sec, fontSize: 12, marginBottom: 12 }}>
                    Sélectionne jusqu'à 6 statistiques à afficher sur ta carte.
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {STATS_DISPONIBLES.map(({ cle, label }) => {
                      const actif = statsSelectionnees.includes(cle)
                      const desactive = !actif && statsSelectionnees.length >= MAX_STATS
                      return (
                        <Pressable
                          key={cle}
                          onPress={() => basculerStat(cle)}
                          disabled={desactive}
                          style={{
                            paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                            backgroundColor: actif ? c.chipActif : c.chip,
                            borderWidth: 1, borderColor: actif ? c.accent : 'transparent',
                            opacity: desactive ? 0.4 : 1,
                          }}
                        >
                          <Text style={{
                            color: actif ? c.chipTexte : c.sec,
                            fontSize: 12,
                            fontWeight: actif ? '700' : '400',
                          }}>
                            {label}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>

                {/* ── Aperçu ── */}
                <Text style={{
                  color: c.sec, fontSize: 12, fontWeight: '600',
                  marginBottom: 12, letterSpacing: 0.5,
                }}>
                  APERÇU DE LA CARTE
                </Text>
                <View style={{ alignItems: 'center', marginBottom: 8 }}>
                  <View ref={refCarte} collapsable={false} style={{ padding: 12 }}>
                    <CarteFUTPerso
                      titre={titre || 'MA CARTE'}
                      nomEquipe={equipeSelectionnee}
                      stats={statsCalculees ?? {}}
                      statsAffichees={statsSelectionnees}
                      avatarUrl={avatarUrl}
                      note={note}
                      scale={1.1}
                      animer
                    />
                  </View>
                </View>
                <Text style={{ color: c.sec, fontSize: 11, textAlign: 'center', marginBottom: 4 }}>
                  Les statistiques affichées sont calculées sur l'ensemble de tes paris.
                </Text>

              </ScrollView>

              {/* ── Bouton Partager ── */}
              <View style={{
                padding: 16,
                borderTopWidth: 1, borderTopColor: c.bordure,
                backgroundColor: c.fond,
              }}>
                <Pressable
                  onPress={partager}
                  disabled={partageEnCours}
                  style={({ pressed }) => ({
                    backgroundColor: c.accent,
                    borderRadius: 14, padding: 16,
                    alignItems: 'center', flexDirection: 'row',
                    justifyContent: 'center', gap: 10,
                    opacity: partageEnCours ? 0.7 : pressed ? 0.88 : 1,
                  })}
                >
                  {partageEnCours ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="share-outline" size={20} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                        Partager ma carte
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}

      </SafeAreaView>
    </Modal>
  )
}
