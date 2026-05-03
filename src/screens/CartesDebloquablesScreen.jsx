import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, Pressable, Modal,
  ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { getCartesUtilisateur, TYPES_CARTES } from '../services/cartesFut'
import CarteFUT from '../components/CarteFUT'

// ─── Ordre d'affichage par rareté ─────────────────────────────────────────────

const ORDRE_COULEUR = { or: 0, argent: 1, bronze: 2 }

const SCALE_CARTE = 0.575

// ─── Conditions de déblocage (texte affiché au clic sur une carte verrouillée) ─

const CONDITIONS_CARTES = {
  serie_or:          'Enchaîner 7 victoires consécutives',
  sniper:            'Gagner 5 paris consécutifs avec confiance maximale (5/5) dans le mois',
  value_hunter:      'Gagner 3 paris consécutifs à cote ≥ 2,50 dans le mois',
  roi_or:            'Atteindre un ROI de +30 % sur au moins 10 paris terminés dans le mois',
  centurion:         'Atteindre 100 paris enregistrés au total',
  serie_argent:      'Enchaîner 5 victoires consécutives',
  roi_argent:        'Atteindre un ROI de +15 % sur au moins 8 paris terminés dans le mois',
  analyste:          'Utiliser au moins 2 tags de raisonnement sur 15 paris dans le mois',
  bonne_semaine:     'Obtenir 70 % de victoires ou plus sur au moins 5 paris dans la semaine',
  premier_gain:      'Gagner ton premier pari',
  serie_bronze:      'Enchaîner 3 victoires consécutives',
  explorateur:       'Parier sur au moins 3 sports différents',
  regulier:          'Enregistrer au moins 10 paris dans le mois',
  dix_paris:         'Atteindre 10 paris enregistrés au total',
  recrue:            'Enregistrer ton premier pari',
  parieur_20:        'Atteindre 20 paris enregistrés au total',
  cinquante_paris:   'Atteindre 50 paris enregistrés au total',
  maitre_paris:      'Atteindre 200 paris enregistrés au total',
  legende:           'Atteindre 500 paris enregistrés au total',
  bankroll_positive: 'Terminer un mois calendaire avec un profit positif',
  multisport:        'Remporter des victoires sur au moins 5 sports différents',
  gros_coup:         'Gagner un pari à cote ≥ 5,0',
  invaincu_dix:      'Enchaîner 10 victoires consécutives dans la semaine',
}

// ─── Carte fictive pour le rendu des cases verrouillées ───────────────────────

const carteBidon = (type, def) => ({
  id:           `locked_${type}`,
  type,
  couleur:      def.couleur,
  titre:        def.titre,
  emoji:        def.emoji,
  raison:       '???',
  note:         60,
  statistiques: { roi: 0, winRate: 0, serie: 0, coteMoyenne: 0, profit: 0, nbParis: 0 },
})

// ─── Couleurs badge par rareté ────────────────────────────────────────────────

const COULEUR_BADGE = { or: '#c49200', argent: '#8080a0', bronze: '#a06020' }

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CartesDebloquablesScreen({ visible, onFermer, avatarUrl }) {
  const { estSombre, c } = useTheme()

  const [cartesUtilisateur, setCartesUtilisateur] = useState([])
  const [chargement, setChargement]               = useState(true)
  const [typeFocal, setTypeFocal]                 = useState(null)

  const chargerCartes = useCallback(async () => {
    setChargement(true)
    const cartes = await getCartesUtilisateur()
    setCartesUtilisateur(cartes)
    setChargement(false)
  }, [])

  useEffect(() => {
    if (visible) chargerCartes()
  }, [visible, chargerCartes])

  const typesTries = Object.entries(TYPES_CARTES).sort(
    ([, a], [, b]) => (ORDRE_COULEUR[a.couleur] ?? 9) - (ORDRE_COULEUR[b.couleur] ?? 9)
  )

  const trouverCarteGagnee = (type) => cartesUtilisateur.find(cu => cu.type === type) ?? null

  const nbTotal    = typesTries.length
  const nbDebloque = typesTries.filter(([type]) => trouverCarteGagnee(type) !== null).length

  const cardW = Math.round(220 * SCALE_CARTE)
  const cardH = Math.round(330 * SCALE_CARTE)

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onFermer}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: c.fond }}>
        <StatusBar barStyle={estSombre ? 'light-content' : 'dark-content'} />

        {/* ── En-tête ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingVertical: 14,
          borderBottomWidth: 1, borderBottomColor: c.bordure,
        }}>
          <View>
            <Text style={{ color: c.texte, fontSize: 18, fontWeight: '800', letterSpacing: 0.2 }}>
              Cartes débloquables
            </Text>
            <Text style={{ color: c.texteSecondaire, fontSize: 12, marginTop: 2 }}>
              {nbDebloque} / {nbTotal} débloquées
            </Text>
          </View>
          <Pressable
            onPress={onFermer}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 6 })}
            hitSlop={8}
          >
            <Ionicons name="close" size={26} color={c.texte} />
          </Pressable>
        </View>

        {chargement ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={c.texte} size="large" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Légende couleurs ── */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
              {[
                { couleur: 'or',     label: 'Or'     },
                { couleur: 'argent', label: 'Argent' },
                { couleur: 'bronze', label: 'Bronze' },
              ].map(({ couleur, label }) => {
                const bg       = COULEUR_BADGE[couleur]
                const nbTot    = typesTries.filter(([, d]) => d.couleur === couleur).length
                const nbGagne  = typesTries.filter(([t, d]) => d.couleur === couleur && trouverCarteGagnee(t)).length
                return (
                  <View key={couleur} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: bg }} />
                    <Text style={{ color: c.texteSecondaire, fontSize: 12, fontWeight: '600' }}>
                      {nbGagne}/{nbTot} {label}
                    </Text>
                  </View>
                )
              })}
            </View>

            {/* ── Grille de cartes ── */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {typesTries.map(([type, def]) => {
                const carteGagnee   = trouverCarteGagnee(type)
                const debloquee     = carteGagnee !== null
                const carteAffichee = debloquee ? carteGagnee : carteBidon(type, def)

                return (
                  <Pressable
                    key={type}
                    onPress={() => { if (!debloquee) setTypeFocal(type) }}
                    style={({ pressed }) => ({
                      width: cardW, height: cardH,
                      opacity: pressed && !debloquee ? 0.82 : 1,
                    })}
                  >
                    <CarteFUT
                      carte={carteAffichee}
                      avatarUrl={debloquee ? avatarUrl : null}
                      scale={SCALE_CARTE}
                      animer={debloquee}
                    />

                    {/* Overlay verrouillé */}
                    {!debloquee && (
                      <View style={{
                        position: 'absolute', top: 0, left: 0,
                        width: cardW, height: cardH,
                        borderRadius: 10,
                        backgroundColor: estSombre
                          ? 'rgba(0,0,0,0.74)'
                          : 'rgba(20,20,20,0.66)',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Ionicons name="lock-closed" size={26} color="rgba(255,255,255,0.68)" />
                      </View>
                    )}

                    {/* Badge de validation */}
                    {debloquee && (
                      <View style={{
                        position: 'absolute', top: -4, right: -4,
                        width: 20, height: 20, borderRadius: 10,
                        backgroundColor: '#22c55e',
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 2, borderColor: c.fond,
                      }}>
                        <Ionicons name="checkmark" size={11} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                )
              })}
            </View>
          </ScrollView>
        )}

        {/* ── Modale de condition de déblocage ── */}
        <Modal
          visible={typeFocal !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setTypeFocal(null)}
        >
          <Pressable
            style={{
              flex: 1, backgroundColor: 'rgba(0,0,0,0.62)',
              alignItems: 'center', justifyContent: 'center', padding: 32,
            }}
            onPress={() => setTypeFocal(null)}
          >
            {/* Empêche la fermeture au clic sur le contenu */}
            <Pressable onPress={() => {}} style={{
              backgroundColor: c.fondModal,
              borderRadius: 20, padding: 24,
              width: '100%', maxWidth: 340,
            }}>
              {typeFocal && (() => {
                const def = TYPES_CARTES[typeFocal]
                const bg  = COULEUR_BADGE[def?.couleur] ?? '#a06020'
                return (
                  <>
                    <View style={{ alignItems: 'center', marginBottom: 16 }}>
                      <View style={{
                        width: 56, height: 56, borderRadius: 28,
                        backgroundColor: estSombre ? '#1f2937' : '#f3f4f6',
                        alignItems: 'center', justifyContent: 'center',
                        marginBottom: 10,
                        borderWidth: 2, borderColor: bg,
                      }}>
                        <Ionicons name="lock-closed" size={24} color={bg} />
                      </View>
                      <Text style={{ color: c.texte, fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
                        {def?.titre}
                      </Text>
                      <View style={{
                        backgroundColor: bg + '33',
                        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6,
                      }}>
                        <Text style={{ color: bg, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                          {def?.couleur}
                        </Text>
                      </View>
                    </View>

                    <View style={{
                      backgroundColor: estSombre ? '#111827' : '#f9fafb',
                      borderRadius: 12, padding: 16, marginBottom: 20,
                    }}>
                      <Text style={{
                        color: c.texteSecondaire, fontSize: 12, fontWeight: '600',
                        marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8,
                      }}>
                        Comment débloquer
                      </Text>
                      <Text style={{ color: c.texte, fontSize: 14, lineHeight: 22 }}>
                        {CONDITIONS_CARTES[typeFocal] ?? 'Condition non disponible'}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => setTypeFocal(null)}
                      style={({ pressed }) => ({
                        backgroundColor: pressed
                          ? (estSombre ? '#374151' : '#e5e7eb')
                          : (estSombre ? '#1f2937' : '#f3f4f6'),
                        borderRadius: 12, paddingVertical: 12, alignItems: 'center',
                      })}
                    >
                      <Text style={{ color: c.texte, fontWeight: '700', fontSize: 14 }}>
                        Fermer
                      </Text>
                    </Pressable>
                  </>
                )
              })()}
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </Modal>
  )
}
