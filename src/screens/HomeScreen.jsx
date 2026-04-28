import React, { useState, useCallback, useEffect } from 'react'
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput, Alert
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { getTousLesParis, mettreAJourResultat } from '../services/pocketbase'
import { calculerROI, calculerTauxReussite, calculerMeilleureSerieVictoires, trouverMeilleureCoteGagnee } from '../services/stats'
import { useTheme } from '../context/ThemeContext'

const ICONE_SPORT = {
  football:   'soccer',
  tennis:     'tennis',
  basketball: 'basketball',
  rugby:      'rugby',
  hockey:     'hockey-sticks',
  autre:      'trophy-outline',
}

const IcônesSport = ({ sport, taille, couleur }) => {
  const sports = sport ? sport.split(',') : ['autre']
  return sports.map((s, i) => (
    <MaterialCommunityIcons key={i} name={ICONE_SPORT[s] ?? 'trophy-outline'} size={taille} color={couleur} />
  ))
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
    .sort((a, b) => {
      const diffDate = new Date(b.date_match) - new Date(a.date_match)
      return diffDate !== 0 ? diffDate : new Date(b.created) - new Date(a.created)
    })

  if (termines.length === 0) return { nb: 0, type: null }

  const premierStatut = termines[0].statut
  let nb = 0
  for (const pari of termines) {
    if (pari.statut === premierStatut) nb++
    else break
  }
  return { nb, type: premierStatut }
}

// Modale saisie ou correction de résultat (depuis l'accueil)
function ModaleResultat({ pari, visible, onFermer, onSauvegarde }) {
  const { c } = useTheme()
  const [statut, setStatut] = useState(pari?.statut !== 'en_attente' ? pari?.statut : 'gagne')
  const [score, setScore] = useState(pari?.score_final ?? '')
  const [montantCashout, setMontantCashout] = useState('')
  const [chargement, setChargement] = useState(false)

  useEffect(() => {
    if (pari) {
      setStatut(pari.statut !== 'en_attente' ? pari.statut : 'gagne')
      setScore(pari.score_final ?? '')
      if (pari.statut === 'cashout' && pari.profit_perte != null && pari.mise != null) {
        setMontantCashout(String((pari.profit_perte + pari.mise).toFixed(2)))
      } else {
        setMontantCashout('')
      }
    }
  }, [pari])

  const handleSauvegarder = async () => {
    if (statut === 'cashout') {
      const montant = parseFloat(montantCashout)
      if (!montantCashout || isNaN(montant) || montant <= 0) {
        Alert.alert('Montant requis', 'Saisis le montant récupéré lors du cashout.')
        return
      }
    }
    setChargement(true)
    try {
      const montantCashoutNum = statut === 'cashout' ? parseFloat(montantCashout) : null
      await mettreAJourResultat(pari.id, statut, score, montantCashoutNum)
      onSauvegarde()
      onFermer()
    } catch (_) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le résultat.')
    } finally {
      setChargement(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer}>
      <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: c.fondModal, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.texte, marginBottom: 4 }}>
            {pari?.statut === 'en_attente' ? 'Entrer le résultat' : 'Modifier le résultat'}
          </Text>
          <Text style={{ fontSize: 14, color: c.texteSecondaire, marginBottom: 16 }}>
            {pari?.rencontre}
          </Text>

          <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8 }}>
            Résultat *
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {['gagne', 'perdu', 'nul', 'cashout'].map(s => (
              <Pressable
                key={s}
                onPress={() => setStatut(s)}
                style={{
                  flex: 1, paddingVertical: 8, borderRadius: 12, borderWidth: 1, alignItems: 'center',
                  backgroundColor: statut === s ? '#2563eb' : c.fondCarte,
                  borderColor: statut === s ? '#2563eb' : c.bordure,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons
                    name={CONFIG_STATUT[s].icon}
                    size={13}
                    color={statut === s ? '#ffffff' : CONFIG_STATUT[s].iconColor}
                  />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: statut === s ? '#ffffff' : c.texte }}>
                    {CONFIG_STATUT[s].label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8 }}>
            Score final
          </Text>
          <TextInput
            style={{
              backgroundColor: c.fondInput,
              borderWidth: 1,
              borderColor: c.bordure,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginBottom: statut === 'cashout' ? 12 : 24,
              color: c.texte,
            }}
            placeholder="2-1"
            placeholderTextColor={c.textePlaceholder}
            value={score}
            onChangeText={setScore}
          />

          {statut === 'cashout' && (
            <>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8 }}>
                Montant récupéré (€) *
              </Text>
              <TextInput
                style={{
                  backgroundColor: c.fondInput,
                  borderWidth: 1,
                  borderColor: c.bordure,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 24,
                  color: c.texte,
                }}
                placeholder="Ex : 8.50"
                placeholderTextColor={c.textePlaceholder}
                keyboardType="decimal-pad"
                value={montantCashout}
                onChangeText={setMontantCashout}
              />
            </>
          )}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={onFermer}
              style={{ flex: 1, backgroundColor: c.fondBadge, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: c.texte, fontWeight: 'bold' }}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={handleSauvegarder}
              disabled={chargement}
              style={{ flex: 1, borderRadius: 12, paddingVertical: 16, alignItems: 'center', backgroundColor: chargement ? '#9ca3af' : '#2563eb' }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{chargement ? 'Sauvegarde...' : 'Confirmer'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// Carte de stat rapide
function CarteStatRapide({ titre, valeur, sousTexte, couleurValeur, icone, couleurIcone, c, onPress }) {
  const contenu = (
    <View style={{
      flex: 1,
      backgroundColor: c.fondCarte,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: onPress ? '#3b82f6' : c.bordure,
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

  if (onPress) {
    return (
      <Pressable style={{ flex: 1 }} onPress={onPress}>
        {contenu}
      </Pressable>
    )
  }
  return contenu
}

// Carte d'un pari récent (header / body / footer résultat)
function CartePariRecent({ pari, c, onPress }) {
  const cfg = CONFIG_STATUT[pari.statut] ?? CONFIG_STATUT.en_attente
  const profitPerte = pari.profit_perte ?? 0
  const dateMatch = new Date(pari.date_match).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: c.fondCarte,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: c.bordure,
        overflow: 'hidden',
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {/* Corps */}
      <View style={{ padding: 14 }}>
        {/* Ligne sport + compétition + date */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <IcônesSport sport={pari.sport} taille={16} couleur={c.texteSecondaire} />
            </View>
            <Text style={{ fontSize: 12, color: c.texteSecondaire, fontWeight: '500' }} numberOfLines={1}>
              {pari.competition || pari.sport || '—'}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: c.texteSecondaire }}>{dateMatch}</Text>
        </View>

        {/* Rencontre */}
        <Text style={{ fontSize: 15, fontWeight: 'bold', color: c.texte, marginBottom: 6 }} numberOfLines={1}>
          {pari.rencontre}
        </Text>

        {/* Détails du pari */}
        <Text style={{ fontSize: 12, color: c.texteSecondaire }} numberOfLines={1}>
          {[pari.valeur_pari, `cote ${pari.cote}`, pari.mise != null ? `${pari.mise}€` : null]
            .filter(Boolean).join('  ·  ')}
        </Text>
      </View>

      {/* Footer résultat */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: cfg.iconColor + '18',
        borderTopWidth: 1,
        borderTopColor: c.bordure,
        paddingHorizontal: 14,
        paddingVertical: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={cfg.icon} size={15} color={cfg.iconColor} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: cfg.iconColor }}>
            {cfg.label}
          </Text>
        </View>

        {pari.statut !== 'en_attente' ? (
          pari.statut === 'cashout' ? (
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: profitPerte >= 0 ? '#16a34a' : '#dc2626' }}>
              Cashout : {(profitPerte + (pari.mise ?? 0)).toFixed(2)}€
            </Text>
          ) : (
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: profitPerte >= 0 ? '#16a34a' : '#dc2626' }}>
              {profitPerte >= 0 ? '+' : ''}{profitPerte.toFixed(2)}€
            </Text>
          )
        ) : (
          <Text style={{ fontSize: 12, color: c.texteSecondaire }}>Résultat à saisir</Text>
        )}
      </View>
    </Pressable>
  )
}

export default function HomeScreen({ navigation }) {
  const { c } = useTheme()
  const [paris, setParis] = useState([])
  const [chargement, setChargement] = useState(true)
  const [pariSelectionne, setPariSelectionne] = useState(null)
  const [modaleVisible, setModaleVisible] = useState(false)

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

  const ouvrirPari = (pari) => {
    setPariSelectionne(pari)
    setModaleVisible(true)
  }

  // Recharger à chaque fois que l'écran devient actif
  useFocusEffect(useCallback(() => { chargerDonnees() }, [chargerDonnees]))

  // ── Calculs ─────────────────────────────────────────────────────────────────
  const parisTermines = paris.filter(p => p.statut !== 'en_attente')
  const roi = calculerROI(parisTermines)
  const tauxReussite = calculerTauxReussite(parisTermines)
  const profitTotal = parisTermines.reduce((sum, p) => sum + (p.profit_perte ?? 0), 0)
  const serie = calculerSerieEnCours(paris)
  const meilleureSerieVictoires = calculerMeilleureSerieVictoires(paris)
  const meilleureCoteGagnee = trouverMeilleureCoteGagnee(paris)
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
            onPress={parisEnAttente.length > 0 ? () => navigation.navigate('Historique', { filtreInitial: 'en_attente' }) : undefined}
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

        {/* ── Records ──────────────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <CarteStatRapide
            c={c}
            titre="Meilleure série"
            valeur={meilleureSerieVictoires > 0 ? `${meilleureSerieVictoires}` : '—'}
            sousTexte={meilleureSerieVictoires > 0 ? 'victoires de suite' : 'aucune victoire'}
            couleurValeur="#f59e0b"
            couleurIcone="#f59e0b"
            icone="flame-outline"
          />
          <CarteStatRapide
            c={c}
            titre="Meilleure cote"
            valeur={meilleureCoteGagnee !== null ? meilleureCoteGagnee.toFixed(2) : '—'}
            sousTexte={meilleureCoteGagnee !== null ? 'sur un pari gagné' : 'aucune victoire'}
            couleurValeur="#8b5cf6"
            couleurIcone="#8b5cf6"
            icone="star-outline"
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
            <CartePariRecent key={pari.id} pari={pari} c={c} onPress={() => ouvrirPari(pari)} />
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

      {pariSelectionne && (
        <ModaleResultat
          pari={pariSelectionne}
          visible={modaleVisible}
          onFermer={() => setModaleVisible(false)}
          onSauvegarde={chargerDonnees}
        />
      )}
    </View>
  )
}
