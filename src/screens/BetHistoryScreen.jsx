import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, Pressable, Modal, TextInput, Alert, ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getTousLesParis, mettreAJourResultat } from '../services/pocketbase'
import { useTheme } from '../context/ThemeContext'

const CONFIG_STATUT = {
  en_attente: { icon: 'time-outline',           iconColor: '#d97706', label: 'En attente', couleur: 'text-yellow-600', fond: 'bg-yellow-50 border-yellow-200',         fondSombre: 'dark:bg-yellow-900/30 dark:border-yellow-800' },
  gagne:      { icon: 'checkmark-circle',       iconColor: '#16a34a', label: 'Gagné',      couleur: 'text-green-600',  fond: 'bg-green-50 border-green-200',           fondSombre: 'dark:bg-green-900/30 dark:border-green-800' },
  perdu:      { icon: 'close-circle',           iconColor: '#dc2626', label: 'Perdu',      couleur: 'text-red-600',    fond: 'bg-red-50 border-red-200',               fondSombre: 'dark:bg-red-900/30 dark:border-red-800' },
  nul:        { icon: 'remove-circle-outline',  iconColor: '#6b7280', label: 'Nul/Annulé', couleur: 'text-gray-500',   fond: 'bg-gray-50 border-gray-200',             fondSombre: 'dark:bg-gray-700 dark:border-gray-600' },
  cashout:    { icon: 'cash-outline',           iconColor: '#2563eb', label: 'Remboursé',  couleur: 'text-blue-600',   fond: 'bg-blue-50 border-blue-200',             fondSombre: 'dark:bg-blue-900/30 dark:border-blue-800' },
}

const LABEL_SPORT = {
  football:   'FOOT',
  tennis:     'TEN',
  basketball: 'BASK',
  rugby:      'RUGBY',
  hockey:     'HOCK',
  autre:      'SPORT',
}

const labelSportCompose = (sport) =>
  sport ? sport.split(',').map(s => LABEL_SPORT[s] ?? 'SPORT').join('+') : 'SPORT'

function ModaleResultat({ pari, visible, onFermer, onSauvegarde }) {
  const { c } = useTheme()
  const [statut, setStatut] = useState(pari?.statut !== 'en_attente' ? pari?.statut : 'gagne')
  const [score, setScore] = useState(pari?.score_final ?? '')
  const [chargement, setChargement] = useState(false)

  useEffect(() => {
    if (pari) {
      setStatut(pari.statut !== 'en_attente' ? pari.statut : 'gagne')
      setScore(pari.score_final ?? '')
    }
  }, [pari])

  const handleSauvegarder = async () => {
    setChargement(true)
    try {
      await mettreAJourResultat(pari.id, statut, score)
      onSauvegarde()
      onFermer()
    } catch (error) {
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
          <View className="flex-row gap-2 mb-4">
            {['gagne', 'perdu', 'nul', 'cashout'].map(s => (
              <Pressable
                key={s}
                onPress={() => setStatut(s)}
                className={`flex-1 py-2 rounded-xl border items-center ${statut === s ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}
                style={statut !== s ? { backgroundColor: c.fondCarte } : undefined}
              >
                <View className="flex-row items-center gap-1">
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
              marginBottom: 24,
              color: c.texte,
            }}
            placeholder="2-1"
            placeholderTextColor={c.textePlaceholder}
            value={score}
            onChangeText={setScore}
          />

          <View className="flex-row gap-3">
            <Pressable
              onPress={onFermer}
              style={{ flex: 1, backgroundColor: c.fondBadge, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: c.texte, fontWeight: 'bold' }}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={handleSauvegarder}
              disabled={chargement}
              className={`flex-1 rounded-xl py-4 items-center ${chargement ? 'bg-gray-400' : 'bg-blue-600'}`}
            >
              <Text className="text-white font-bold">{chargement ? 'Sauvegarde...' : 'Confirmer'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function LignePari({ pari, onResultat }) {
  const { c } = useTheme()
  const cfg = CONFIG_STATUT[pari.statut] ?? CONFIG_STATUT.en_attente
  const labelSport = labelSportCompose(pari.sport)
  const dateMatch = new Date(pari.date_match).toLocaleDateString('fr-FR')
  const profitPerte = pari.profit_perte ?? 0

  return (
    <View className={`rounded-xl border mb-3 p-4 ${cfg.fond} ${cfg.fondSombre}`}>
      <View className="flex-row justify-between items-start mb-1">
        <View className="flex-row items-center flex-1 mr-2 gap-2">
          <View style={{ backgroundColor: c.fondBadge, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: c.texteBadge }}>{labelSport}</Text>
          </View>
          <Text style={{ fontWeight: 'bold', color: c.texte, flex: 1 }}>{pari.rencontre}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name={cfg.icon} size={14} color={cfg.iconColor} />
          <Text className={`text-sm font-semibold ${cfg.couleur}`}>{cfg.label}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 12, color: c.texteSecondaire, marginBottom: 8 }}>
        {pari.competition} — {dateMatch}
      </Text>
      <View className="flex-row justify-between items-center">
        <Text style={{ fontSize: 14, color: c.texteTertiaire }}>
          {pari.valeur_pari} @ {pari.cote} — {pari.mise}€
        </Text>
        {pari.statut !== 'en_attente' && (
          <Text className={`text-sm font-bold ${profitPerte >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {profitPerte >= 0 ? '+' : ''}{profitPerte.toFixed(2)}€
          </Text>
        )}
      </View>
      <Pressable
        onPress={() => onResultat(pari)}
        className="mt-3 rounded-lg py-2 items-center"
        style={{
          backgroundColor: pari.statut === 'en_attente' ? '#2563eb' : 'transparent',
          borderWidth: pari.statut === 'en_attente' ? 0 : 1,
          borderColor: c.bordure,
        }}
      >
        <View className="flex-row items-center gap-1">
          {pari.statut !== 'en_attente' && (
            <Ionicons name="create-outline" size={13} color={c.texteSecondaire} />
          )}
          <Text style={{
            fontSize: 13,
            fontWeight: '600',
            color: pari.statut === 'en_attente' ? '#ffffff' : c.texteSecondaire,
          }}>
            {pari.statut === 'en_attente' ? 'Entrer le résultat' : 'Modifier le résultat'}
          </Text>
        </View>
      </Pressable>
    </View>
  )
}

export default function HistoriqueParis({ route }) {
  const { c } = useTheme()
  const [paris, setParis] = useState([])
  const [chargement, setChargement] = useState(true)
  const [pariSelectionne, setPariSelectionne] = useState(null)
  const [modaleVisible, setModaleVisible] = useState(false)
  const [filtre, setFiltre] = useState(route?.params?.filtreInitial ?? 'tous')

  const chargerParis = useCallback(async () => {
    setChargement(true)
    try {
      const donnees = await getTousLesParis()
      setParis(donnees)
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les paris.')
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => { chargerParis() }, [chargerParis])

  const handleResultat = (pari) => {
    setPariSelectionne(pari)
    setModaleVisible(true)
  }

  const parisFiltres = filtre === 'tous' ? paris : paris.filter(p => p.statut === filtre)

  if (chargement) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fond }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.fond, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: c.texte, marginBottom: 16 }}>
        Historique des paris
      </Text>

      {/* Filtres */}
      <View className="flex-row gap-2 mb-4 flex-wrap">
        {[
          { label: 'Tous',        value: 'tous' },
          { label: 'En attente',  value: 'en_attente' },
          { label: 'Gagnés',      value: 'gagne' },
          { label: 'Perdus',      value: 'perdu' },
        ].map(f => (
          <Pressable
            key={f.value}
            onPress={() => setFiltre(f.value)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              borderWidth: 1,
              backgroundColor: filtre === f.value ? '#2563eb' : c.fondCarte,
              borderColor: filtre === f.value ? '#2563eb' : c.bordure,
            }}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: filtre === f.value ? '#ffffff' : c.texte,
            }}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {parisFiltres.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: c.texteSecondaire, fontSize: 16 }}>Aucun pari trouvé</Text>
        </View>
      ) : (
        <FlatList
          data={parisFiltres}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <LignePari pari={item} onResultat={handleResultat} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {pariSelectionne && (
        <ModaleResultat
          pari={pariSelectionne}
          visible={modaleVisible}
          onFermer={() => setModaleVisible(false)}
          onSauvegarde={chargerParis}
        />
      )}
    </View>
  )
}
