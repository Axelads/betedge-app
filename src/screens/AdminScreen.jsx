import React, { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  Modal, Image,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { getToutesLesDonneesAdmin, pb } from '../services/pocketbase'
import { calculerROI, calculerTauxReussite } from '../services/stats'
import { useTheme } from '../context/ThemeContext'

const EMOJI_SPORT = {
  football: '⚽', tennis: '🎾', basketball: '🏀', rugby: '🏉', hockey: '🏒', autre: '🏆',
}

const emojiSportCompose = (sport) =>
  sport ? sport.split(',').map(s => EMOJI_SPORT[s] ?? '🏆').join('') : '🏆'

const CONFIG_STATUT = {
  en_attente: { icon: 'time-outline',          couleur: '#d97706', label: 'En attente' },
  gagne:      { icon: 'checkmark-circle',      couleur: '#16a34a', label: 'Gagné' },
  perdu:      { icon: 'close-circle',          couleur: '#dc2626', label: 'Perdu' },
  nul:        { icon: 'remove-circle-outline', couleur: '#6b7280', label: 'Nul' },
  cashout:    { icon: 'cash-outline',          couleur: '#2563eb', label: 'Cashout' },
}

const CONFIG_DECISION = {
  en_attente: { couleur: '#d97706', label: 'En attente' },
  place:      { couleur: '#16a34a', label: 'Placé' },
  refuse:     { couleur: '#dc2626', label: 'Refusé' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getUrlAvatarUser = (user) => {
  if (!user?.avatar) return null
  try {
    return pb.files.getURL(user, user.avatar)
  } catch {
    return null
  }
}

const resolveUser = (item) => {
  if (item.expand?.user) return item.expand.user
  if (item.user) return { id: item.user, name: 'Utilisateur', email: '' }
  return null
}

const grouperParUtilisateur = (tousLesParis, toutesLesAlertes, tousProfils) => {
  const map = {}

  tousLesParis.forEach(pari => {
    const user = resolveUser(pari)
    if (!user) return
    if (!map[user.id]) {
      map[user.id] = {
        user,
        profil: tousProfils.find(p => p.user === user.id) ?? null,
        paris: [],
        alertes: [],
      }
    }
    map[user.id].paris.push(pari)
  })

  toutesLesAlertes.forEach(alerte => {
    const user = resolveUser(alerte)
    if (!user) return
    if (!map[user.id]) {
      map[user.id] = {
        user,
        profil: tousProfils.find(p => p.user === user.id) ?? null,
        paris: [],
        alertes: [],
      }
    }
    map[user.id].alertes.push(alerte)
  })

  return Object.values(map)
}

// ─── Composants ──────────────────────────────────────────────────────────────

function CarteKPI({ titre, valeur, icone, couleurIcone, c }) {
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
        <Text style={{ fontSize: 11, color: c.texteSecondaire, fontWeight: '500' }}>{titre}</Text>
        <View style={{ backgroundColor: couleurIcone + '22', borderRadius: 8, padding: 5 }}>
          <Ionicons name={icone} size={14} color={couleurIcone} />
        </View>
      </View>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: c.texte }}>{valeur}</Text>
    </View>
  )
}

function CarteUtilisateur({ donnees, onPress, c }) {
  const { user, paris, alertes } = donnees
  const parisTermines = paris.filter(p => p.statut !== 'en_attente')
  const roi = calculerROI(parisTermines)
  const urlAvatar = getUrlAvatarUser(user)

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: c.fondCarte,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: c.bordure,
        opacity: pressed ? 0.85 : 1,
        overflow: 'hidden',
      })}
    >
      {/* En-tête utilisateur */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <View style={{
          width: 48, height: 48, borderRadius: 24,
          backgroundColor: '#3b82f622',
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {urlAvatar ? (
            <Image source={{ uri: urlAvatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
          ) : (
            <Ionicons name="person" size={24} color="#3b82f6" />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 15, color: c.texte }}>{user.name || 'Utilisateur'}</Text>
          <Text style={{ fontSize: 12, color: c.texteSecondaire, marginTop: 1 }}>{user.email}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 11, color: c.texteSecondaire }}>Détail</Text>
          <Ionicons name="chevron-forward" size={16} color={c.texteSecondaire} />
        </View>
      </View>

      {/* Pied de carte — stats visuellement contenues dans la carte */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: c.fondBadge,
        borderTopWidth: 1,
        borderTopColor: c.bordure,
        paddingVertical: 10,
      }}>
        <StatMini label="Paris" valeur={paris.length} couleur="#3b82f6" />
        <View style={{ width: 1, backgroundColor: c.bordure, marginVertical: 4 }} />
        <StatMini label="Terminés" valeur={parisTermines.length} couleur="#8b5cf6" />
        <View style={{ width: 1, backgroundColor: c.bordure, marginVertical: 4 }} />
        <StatMini
          label="ROI"
          valeur={`${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`}
          couleur={roi >= 0 ? '#16a34a' : '#dc2626'}
        />
        <View style={{ width: 1, backgroundColor: c.bordure, marginVertical: 4 }} />
        <StatMini label="Alertes" valeur={alertes.length} couleur="#f59e0b" />
      </View>
    </Pressable>
  )
}

function StatMini({ label, valeur, couleur }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: couleur }}>{valeur}</Text>
      <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, letterSpacing: 0.3 }}>{label}</Text>
    </View>
  )
}

function LigneDetail({ icone, label, valeur, c, pleine }) {
  return (
    <View style={{ flex: pleine ? undefined : 1 }}>
      <Text style={{ fontSize: 10, color: c.texteSecondaire, marginBottom: 2 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name={icone} size={11} color={c.texteSecondaire} />
        <Text style={{ fontSize: 12, color: c.texte, fontWeight: '500', flexShrink: 1 }}>{valeur}</Text>
      </View>
    </View>
  )
}

// ─── Labels ──────────────────────────────────────────────────────────────────

const LABEL_TYPE_PARI = {
  victoire_domicile: 'Victoire domicile', victoire_exterieur: 'Victoire extérieur',
  nul: 'Match nul', double_chance: 'Double chance', mi_temps_resultat: 'Mi-temps résultat',
  mi_temps_final: 'Mi-temps / final', plus_de: 'Plus de', moins_de: 'Moins de',
  les_deux_marquent: 'Les deux marquent', score_exact: 'Score exact',
  buteur_a_tout_moment: 'Buteur à tout moment', premier_buteur: 'Premier buteur',
  dernier_buteur: 'Dernier buteur', nombre_buts_joueur: 'Buts joueur',
  handicap: 'Handicap', nombre_corners: 'Corners', nombre_cartons: 'Cartons',
  qualification: 'Qualification', vainqueur_tournoi: 'Vainqueur tournoi',
  top_n: 'Top N', relegation: 'Relégation', combiné: 'Combiné',
}

const LABEL_TAG = {
  forme_domicile_forte: 'Domicile en forme', forme_domicile_faible: 'Domicile en difficulté',
  forme_exterieur_forte: 'Visiteur en forme', forme_exterieur_faible: 'Visiteur en difficulté',
  equipe_motivee: 'Équipe motivée', equipe_sans_enjeu: 'Sans enjeu',
  blessures_adversaire: 'Blessures adversaire', fatigue_calendrier: 'Fatigue calendrier',
  style_defensif: 'Style défensif', over_equipes_offensives: 'Équipes offensives',
  under_conditions_meteo: 'Conditions météo', cote_value: 'Cote value',
  stat_domination: 'Stats domination', instinct: 'Instinct',
}

const LABEL_FORME = {
  domicile_fort: 'Domicile fort', exterieur_faible: 'Visiteur faible',
  neutre: 'Neutre', les_deux_en_forme: 'Les deux en forme',
}

// ─── Modal détail utilisateur ─────────────────────────────────────────────────

function ModalDetailUtilisateur({ donnees, visible, onFermer, c, estSombre }) {
  const [onglet, setOnglet] = useState('paris')
  const [pariElargiId, setPariElargiId] = useState(null)

  if (!donnees) return null
  const { user, profil, paris, alertes } = donnees
  const parisTermines = paris.filter(p => p.statut !== 'en_attente')
  const roi = calculerROI(parisTermines)
  const tauxReussite = calculerTauxReussite(parisTermines)
  const profitTotal = parisTermines.reduce((sum, p) => sum + (p.profit_perte ?? 0), 0)
  const urlAvatar = getUrlAvatarUser(user)

  const renderPari = ({ item: pari }) => {
    const cfg = CONFIG_STATUT[pari.statut] ?? CONFIG_STATUT.en_attente
    const emoji = emojiSportCompose(pari.sport)
    const date = new Date(pari.date_match).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    const estElargi = pariElargiId === pari.id
    const tags = Array.isArray(pari.tags_raisonnement) ? pari.tags_raisonnement : []
    const profit = pari.profit_perte ?? 0

    return (
      <Pressable
        onPress={() => setPariElargiId(estElargi ? null : pari.id)}
        style={({ pressed }) => ({
          backgroundColor: c.fondCarte,
          borderRadius: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: estElargi ? '#3b82f6' : c.bordure,
          overflow: 'hidden',
          opacity: pressed ? 0.92 : 1,
        })}
      >
        {/* Ligne résumé */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
          <View style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: c.fondBadge,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 18 }}>{emoji}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontWeight: '600', color: c.texte, fontSize: 13 }} numberOfLines={1}>
              {pari.rencontre}
            </Text>
            <Text style={{ fontSize: 11, color: c.texteSecondaire, marginTop: 1 }}>
              {pari.valeur_pari} @ {pari.cote} · {date}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 3 }}>
            <Ionicons name={cfg.icon} size={16} color={cfg.couleur} />
            {pari.statut !== 'en_attente' && (
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: profit >= 0 ? '#16a34a' : '#dc2626' }}>
                {profit >= 0 ? '+' : ''}{profit.toFixed(2)}€
              </Text>
            )}
          </View>
          <Ionicons
            name={estElargi ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={c.texteSecondaire}
            style={{ marginLeft: 2 }}
          />
        </View>

        {/* Détails accordion */}
        {estElargi && (
          <View style={{
            paddingHorizontal: 12, paddingBottom: 14,
            borderTopWidth: 1, borderTopColor: c.bordure,
            gap: 10,
          }}>
            {/* Ligne 1 : compétition + bookmaker */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <LigneDetail icone="trophy-outline" label="Compétition" valeur={pari.competition || '—'} c={c} />
              <LigneDetail icone="business-outline" label="Bookmaker" valeur={pari.bookmaker || '—'} c={c} />
            </View>

            {/* Ligne 2 : type pari + mise */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <LigneDetail
                icone="layers-outline"
                label="Type de pari"
                valeur={LABEL_TYPE_PARI[pari.type_pari] ?? pari.type_pari ?? '—'}
                c={c}
              />
              <LigneDetail
                icone="cash-outline"
                label="Mise"
                valeur={pari.mise != null ? `${pari.mise} €` : '—'}
                c={c}
              />
            </View>

            {/* Confiance + cote boostée */}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: c.texteSecondaire, marginBottom: 3 }}>Confiance</Text>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Ionicons
                      key={i}
                      name={i <= (pari.confiance ?? 0) ? 'star' : 'star-outline'}
                      size={14}
                      color={i <= (pari.confiance ?? 0) ? '#f59e0b' : c.texteSecondaire}
                    />
                  ))}
                </View>
              </View>
              {pari.cote_boostee && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: '#f59e0b22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
                }}>
                  <Ionicons name="flash" size={12} color="#f59e0b" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#f59e0b' }}>Cote boostée</Text>
                </View>
              )}
              {pari.score_final ? (
                <View style={{
                  backgroundColor: c.fondBadge, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: c.texte }}>⚽ {pari.score_final}</Text>
                </View>
              ) : null}
            </View>

            {/* Forme équipes */}
            {pari.forme_equipes ? (
              <LigneDetail
                icone="fitness-outline"
                label="Forme équipes"
                valeur={LABEL_FORME[pari.forme_equipes] ?? pari.forme_equipes}
                c={c}
                pleine
              />
            ) : null}

            {/* Tags raisonnement */}
            {tags.length > 0 && (
              <View>
                <Text style={{ fontSize: 10, color: c.texteSecondaire, marginBottom: 5 }}>Tags raisonnement</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                  {tags.map(tag => (
                    <View key={tag} style={{
                      backgroundColor: '#3b82f622', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
                    }}>
                      <Text style={{ fontSize: 10, color: '#3b82f6', fontWeight: '600' }}>
                        {LABEL_TAG[tag] ?? tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Raisonnement libre */}
            {pari.raisonnement_libre ? (
              <View>
                <Text style={{ fontSize: 10, color: c.texteSecondaire, marginBottom: 3 }}>Raisonnement</Text>
                <Text style={{ fontSize: 12, color: c.texte, fontStyle: 'italic', lineHeight: 18 }}>
                  "{pari.raisonnement_libre}"
                </Text>
              </View>
            ) : null}

            {/* Contexte blessures */}
            {pari.contexte_blessures && pari.contexte_blessures !== 'RAS' ? (
              <LigneDetail
                icone="medkit-outline"
                label="Blessures"
                valeur={pari.contexte_blessures}
                c={c}
                pleine
              />
            ) : null}
          </View>
        )}
      </Pressable>
    )
  }

  const renderAlerte = ({ item: alerte }) => {
    const cfg = CONFIG_DECISION[alerte.decision_expert] ?? CONFIG_DECISION.en_attente
    const date = new Date(alerte.date_match).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    const score = alerte.score_similarite ?? 0

    return (
      <View style={{
        backgroundColor: c.fondCarte,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: c.bordure,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <Text style={{ fontWeight: '600', color: c.texte, fontSize: 13, flex: 1 }} numberOfLines={1}>
            {alerte.rencontre}
          </Text>
          <View style={{
            backgroundColor: cfg.couleur + '22',
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
            marginLeft: 8,
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: cfg.couleur }}>{cfg.label}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: c.texteSecondaire, marginBottom: 4 }}>
          {alerte.valeur_pari} · Cote {alerte.cote_marche} · {date}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            height: 6, flex: 1, backgroundColor: estSombre ? '#374151' : '#e5e7eb', borderRadius: 3,
          }}>
            <View style={{
              height: 6, width: `${score}%`, borderRadius: 3,
              backgroundColor: score >= 80 ? '#16a34a' : score >= 60 ? '#f59e0b' : '#dc2626',
            }} />
          </View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: c.texteSecondaire, minWidth: 36 }}>
            {score}/100
          </Text>
        </View>
        {alerte.raisonnement_bot ? (
          <Text style={{ fontSize: 11, color: c.texteSecondaire, marginTop: 6, fontStyle: 'italic' }} numberOfLines={2}>
            {alerte.raisonnement_bot}
          </Text>
        ) : null}
      </View>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onFermer}>
      <View style={{ flex: 1, backgroundColor: c.fond }}>
        {/* Header */}
        <View style={{
          backgroundColor: '#0f172a',
          paddingTop: 56,
          paddingBottom: 16,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <Pressable onPress={onFermer} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          {urlAvatar ? (
            <Image source={{ uri: urlAvatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
          ) : (
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: '#3b82f622',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="person" size={18} color="#3b82f6" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{user.name || 'Utilisateur'}</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>{user.email}</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Profil chips */}
          {(profil?.sport_favori || profil?.plateforme_favorite || profil?.equipe_favorite) && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {profil.sport_favori && (
                <View style={{ backgroundColor: '#3b82f622', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '600' }}>
                    {EMOJI_SPORT[profil.sport_favori] ?? '🏆'} {profil.sport_favori}
                  </Text>
                </View>
              )}
              {profil.plateforme_favorite && (
                <View style={{ backgroundColor: '#8b5cf622', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: '#8b5cf6', fontSize: 12, fontWeight: '600' }}>{profil.plateforme_favorite}</Text>
                </View>
              )}
              {profil.equipe_favorite && (
                <View style={{ backgroundColor: '#f59e0b22', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '600' }}>❤️ {profil.equipe_favorite}</Text>
                </View>
              )}
            </View>
          )}

          {/* Stats gradient */}
          <LinearGradient
            colors={roi >= 0 ? ['#1e3a8a', '#2563eb'] : ['#7f1d1d', '#dc2626']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 20, marginBottom: 16 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>ROI</Text>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>
                  {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Taux réussite</Text>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>{tauxReussite.toFixed(0)}%</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Profit</Text>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>
                  {profitTotal >= 0 ? '+' : ''}{profitTotal.toFixed(0)}€
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Paris</Text>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>{paris.length}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Onglets */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: c.fondCarte,
            borderRadius: 12,
            padding: 4,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: c.bordure,
          }}>
            {[
              { id: 'paris', label: `Paris (${paris.length})`, icone: 'list-outline' },
              { id: 'alertes', label: `Alertes bot (${alertes.length})`, icone: 'notifications-outline' },
            ].map(tab => (
              <Pressable
                key={tab.id}
                onPress={() => setOnglet(tab.id)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: onglet === tab.id ? '#3b82f6' : 'transparent',
                }}
              >
                <Ionicons
                  name={tab.icone}
                  size={14}
                  color={onglet === tab.id ? '#fff' : c.texteSecondaire}
                />
                <Text style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: onglet === tab.id ? '#fff' : c.texteSecondaire,
                }}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Liste */}
          {onglet === 'paris' ? (
            paris.length === 0 ? (
              <Text style={{ color: c.texteSecondaire, textAlign: 'center', marginTop: 24 }}>Aucun pari enregistré</Text>
            ) : (
              paris.map(pari => renderPari({ item: pari }))
            )
          ) : (
            alertes.length === 0 ? (
              <Text style={{ color: c.texteSecondaire, textAlign: 'center', marginTop: 24 }}>Aucune alerte bot</Text>
            ) : (
              alertes.map(alerte => renderAlerte({ item: alerte }))
            )
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function AdminScreen() {
  const { c, estSombre } = useTheme()
  const [chargement, setChargement] = useState(true)
  const [utilisateurs, setUtilisateurs] = useState([])
  const [statsGlobales, setStatsGlobales] = useState({ nbParis: 0, nbAlertes: 0, roiMoyen: 0 })
  const [userSelectionne, setUserSelectionne] = useState(null)

  const chargerDonnees = useCallback(async () => {
    setChargement(true)
    try {
      const { tousLesParis, toutesLesAlertes, tousProfils } = await getToutesLesDonneesAdmin()
      const liste = grouperParUtilisateur(tousLesParis, toutesLesAlertes, tousProfils)
      setUtilisateurs(liste)

      const parisTermines = tousLesParis.filter(p => p.statut !== 'en_attente')
      const roiMoyen = calculerROI(parisTermines)
      setStatsGlobales({
        nbParis: tousLesParis.length,
        nbAlertes: toutesLesAlertes.length,
        roiMoyen,
      })
    } catch (_) {}
    finally {
      setChargement(false)
    }
  }, [])

  useFocusEffect(chargerDonnees)

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
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Bannière admin */}
        <LinearGradient
          colors={['#1e1b4b', '#4338ca']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 20, marginBottom: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Ionicons name="shield-checkmark" size={22} color="#a5b4fc" />
            <Text style={{ color: '#a5b4fc', fontSize: 13, fontWeight: '600' }}>Vue superadmin</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>
            {utilisateurs.length} utilisateur{utilisateurs.length > 1 ? 's' : ''}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 }}>
            {statsGlobales.nbParis} paris · ROI global {statsGlobales.roiMoyen >= 0 ? '+' : ''}{statsGlobales.roiMoyen.toFixed(1)}%
          </Text>
        </LinearGradient>

        {/* KPIs */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <CarteKPI c={c} titre="Total paris" valeur={statsGlobales.nbParis} icone="stats-chart-outline" couleurIcone="#3b82f6" />
          <CarteKPI c={c} titre="Alertes bot" valeur={statsGlobales.nbAlertes} icone="notifications-outline" couleurIcone="#f59e0b" />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          <CarteKPI
            c={c}
            titre="ROI global"
            valeur={`${statsGlobales.roiMoyen >= 0 ? '+' : ''}${statsGlobales.roiMoyen.toFixed(1)}%`}
            icone="trending-up-outline"
            couleurIcone={statsGlobales.roiMoyen >= 0 ? '#16a34a' : '#dc2626'}
          />
          <CarteKPI c={c} titre="Utilisateurs" valeur={utilisateurs.length} icone="people-outline" couleurIcone="#8b5cf6" />
        </View>

        {/* Liste utilisateurs */}
        <Text style={{ fontSize: 17, fontWeight: 'bold', color: c.texte, marginBottom: 12 }}>
          Utilisateurs
        </Text>

        {utilisateurs.length === 0 ? (
          <View style={{
            backgroundColor: c.fondCarte,
            borderRadius: 16,
            padding: 32,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: c.bordure,
          }}>
            <Text style={{ fontSize: 32, marginBottom: 10 }}>👥</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: c.texte }}>Aucun utilisateur actif</Text>
            <Text style={{ fontSize: 13, color: c.texteSecondaire, marginTop: 4, textAlign: 'center' }}>
              Les utilisateurs apparaîtront ici dès qu'ils auront enregistré un pari.
            </Text>
          </View>
        ) : (
          utilisateurs.map(donnees => (
            <CarteUtilisateur
              key={donnees.user.id}
              donnees={donnees}
              onPress={() => setUserSelectionne(donnees)}
              c={c}
            />
          ))
        )}
      </ScrollView>

      <ModalDetailUtilisateur
        donnees={userSelectionne}
        visible={userSelectionne !== null}
        onFermer={() => setUserSelectionne(null)}
        c={c}
        estSombre={estSombre}
      />
    </View>
  )
}
