import { useState, useRef } from 'react'
import {
  View, Text, TextInput, ScrollView, Pressable, Alert, Platform, Modal,
  FlatList, useWindowDimensions
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import DateTimePicker from '@react-native-community/datetimepicker'
import { creerPari } from '../services/pocketbase'
import { useTheme } from '../context/ThemeContext'

const SPORTS = [
  { label: 'Football',  value: 'football',   gradient: ['#16a34a', '#15803d'], icon: 'soccer' },
  { label: 'Tennis',    value: 'tennis',      gradient: ['#f59e0b', '#d97706'], icon: 'tennis' },
  { label: 'Basket',    value: 'basketball',  gradient: ['#ea580c', '#c2410c'], icon: 'basketball' },
  { label: 'Rugby',     value: 'rugby',       gradient: ['#9f1239', '#881337'], icon: 'rugby' },
  { label: 'Hockey',    value: 'hockey',      gradient: ['#0ea5e9', '#0369a1'], icon: 'hockey-sticks' },
  { label: 'Autre',     value: 'autre',       gradient: ['#475569', '#1e293b'], icon: 'trophy-outline' },
]

function SportPill({ sport, selected, onPress }) {
  const { estSombre } = useTheme()
  const opaciteInactive = estSombre ? 0.85 : 0.45
  return (
    <Pressable onPress={onPress} style={{ width: '30%', marginBottom: 8 }}>
      <LinearGradient
        colors={sport.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 12,
          overflow: 'hidden',
          position: 'relative',
          opacity: selected ? 1 : opaciteInactive,
          borderWidth: selected ? 2.5 : 0,
          borderColor: 'rgba(255,255,255,0.6)',
        }}
      >
        <MaterialCommunityIcons
          name={sport.icon}
          size={48}
          color="rgba(255,255,255,0.2)"
          style={{ position: 'absolute', bottom: -6, right: -4 }}
        />
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff', zIndex: 1 }}>
          {sport.label}
        </Text>
      </LinearGradient>
    </Pressable>
  )
}

const TYPES_PARI = [
  // ─── Résultat du match ───────────────────────────────────────────────────
  { label: 'Victoire domicile',          value: 'victoire_domicile',      icon: 'home',                 groupe: 'Résultat' },
  { label: 'Victoire extérieur',         value: 'victoire_exterieur',     icon: 'airplane',             groupe: 'Résultat' },
  { label: 'Match nul',                  value: 'nul',                    icon: 'remove-circle-outline',groupe: 'Résultat' },
  { label: 'Double chance',              value: 'double_chance',          icon: 'shield-half',          groupe: 'Résultat' },
  { label: 'Résultat mi-temps',          value: 'mi_temps_resultat',      icon: 'time-outline',         groupe: 'Résultat' },
  { label: 'Mi-temps / Fin de match',    value: 'mi_temps_final',         icon: 'git-compare-outline',  groupe: 'Résultat' },
  // ─── Buts ────────────────────────────────────────────────────────────────
  { label: 'Plus de X buts',             value: 'plus_de',                icon: 'trending-up',          groupe: 'Buts' },
  { label: 'Moins de X buts',            value: 'moins_de',               icon: 'trending-down',        groupe: 'Buts' },
  { label: 'Les deux équipes marquent',  value: 'les_deux_marquent',      icon: 'checkmark-circle',     groupe: 'Buts' },
  { label: 'Score exact',                value: 'score_exact',            icon: 'calculator',           groupe: 'Buts' },
  // ─── Buteurs ─────────────────────────────────────────────────────────────
  { label: 'Buteur dans le match',       value: 'buteur_a_tout_moment',   icon: 'football',             groupe: 'Buteurs' },
  { label: 'Premier buteur',             value: 'premier_buteur',         icon: 'medal',                groupe: 'Buteurs' },
  { label: 'Dernier buteur',             value: 'dernier_buteur',         icon: 'flag',                 groupe: 'Buteurs' },
  { label: "Buts d'un joueur",           value: 'nombre_buts_joueur',     icon: 'person',               groupe: 'Buteurs' },
  // ─── Handicap & Spéciaux ─────────────────────────────────────────────────
  { label: 'Handicap',                   value: 'handicap',               icon: 'scale',                groupe: 'Spéciaux' },
  { label: 'Nombre de corners',          value: 'nombre_corners',         icon: 'flag-outline',         groupe: 'Spéciaux' },
  { label: 'Nombre de cartons',          value: 'nombre_cartons',         icon: 'card-outline',         groupe: 'Spéciaux' },
  // ─── Long terme / Compétition ────────────────────────────────────────────
  { label: 'Qualification',              value: 'qualification',          icon: 'arrow-forward-circle', groupe: 'Long terme' },
  { label: 'Vainqueur de compétition',   value: 'vainqueur_tournoi',      icon: 'trophy',               groupe: 'Long terme' },
  { label: 'Top N (podium, top 4…)',     value: 'top_n',                  icon: 'podium',               groupe: 'Long terme' },
  { label: 'Relégation / Promotion',     value: 'relegation',             icon: 'swap-vertical',        groupe: 'Long terme' },
  // ─── Autres ──────────────────────────────────────────────────────────────
  { label: 'Pari combiné',               value: 'combiné',                icon: 'layers',               groupe: 'Autres' },
]

const BOOKMAKERS = [
  { label: 'Winamax',      value: 'Winamax',      couleurPrincipale: '#E8342A', couleurSecondaire: '#c0281f', initiales: 'W',  couleurTexte: '#ffffff' },
  { label: 'Betclic',      value: 'Betclic',      couleurPrincipale: '#00A850', couleurSecondaire: '#007d3c', initiales: 'B',  couleurTexte: '#ffffff' },
  { label: 'Unibet',       value: 'Unibet',       couleurPrincipale: '#147B45', couleurSecondaire: '#0d5c32', initiales: 'U',  couleurTexte: '#ffffff' },
  { label: 'Parions Sport', value: 'Parions Sport', couleurPrincipale: '#003399', couleurSecondaire: '#002277', initiales: 'PS', couleurTexte: '#ffffff' },
]

const AIDE_VALEUR_PARI = {
  // Résultat du match
  victoire_domicile:   { placeholder: 'Ex : PSG',                              explication: "Écris le nom de l'équipe à domicile sur laquelle tu paries." },
  victoire_exterieur:  { placeholder: 'Ex : Lyon',                             explication: "Écris le nom de l'équipe visiteuse sur laquelle tu paries." },
  nul:                 { placeholder: 'Match nul',                              explication: 'Tu paries que les deux équipes finissent à égalité. Rien à préciser, écris simplement "Match nul".' },
  double_chance:       { placeholder: 'Ex : 1X (PSG ou nul)',                   explication: 'La double chance couvre deux des trois issues possibles. "1X" = domicile gagne ou nul. "X2" = nul ou extérieur gagne. "12" = l\'un des deux gagne (pas de nul). Écris la combinaison et les équipes concernées.' },
  mi_temps_resultat:   { placeholder: 'Ex : PSG gagne à la mi-temps',           explication: 'Tu paries sur le score à la fin des 45 premières minutes uniquement, indépendamment du résultat final. Écris l\'équipe qui mène ou "Nul à la mi-temps".' },
  mi_temps_final:      { placeholder: 'Ex : Nul / PSG gagne',                   explication: 'Tu combines le résultat à la mi-temps ET le résultat final. Écris "Résultat mi-temps / Résultat final". Ex : "Nul / PSG gagne" = nul à la mi-temps, victoire PSG au final. Cotes très élevées car doublement précis.' },
  // Buts
  plus_de:             { placeholder: 'Ex : 2.5',                               explication: 'Tu paries qu\'il y aura plus de X buts dans le match. Écris uniquement le seuil. "2.5" veut dire qu\'il faut au minimum 3 buts pour gagner. Le ".5" évite l\'égalité : un match ne peut pas finir à 2,5 buts.' },
  moins_de:            { placeholder: 'Ex : 2.5',                               explication: 'Tu paries qu\'il y aura moins de X buts dans le match. Écris uniquement le seuil. "2.5" veut dire qu\'il faut 2 buts maximum pour gagner. Un 0-0, 1-0 ou 1-1 te font gagner. Un 2-1 te fait perdre.' },
  les_deux_marquent:   { placeholder: 'Oui',                                    explication: 'Tu paries que chaque équipe marque au moins un but. Écris "Oui" si tu paries que les deux marquent, "Non" si tu paries qu\'au moins une équipe ne marque pas.' },
  score_exact:         { placeholder: 'Ex : 2-1',                               explication: 'Écris le score exact que tu anticipes, équipe domicile en premier. Ex : "2-1" signifie 2 buts pour l\'équipe à domicile, 1 but pour l\'équipe visiteuse.' },
  // Buteurs
  buteur_a_tout_moment:{ placeholder: 'Ex : Mbappé',                            explication: 'Écris le nom du joueur que tu penses voir marquer au moins un but dans le match, peu importe à quel moment.' },
  premier_buteur:      { placeholder: 'Ex : Mbappé',                            explication: 'Écris le nom du joueur que tu penses voir marquer le tout premier but du match. Cote plus élevée car plus difficile à prédire.' },
  dernier_buteur:      { placeholder: 'Ex : Giroud',                            explication: 'Écris le nom du joueur que tu penses voir marquer le dernier but du match. Aussi difficile que le premier buteur, cotes généralement élevées.' },
  nombre_buts_joueur:  { placeholder: 'Ex : Mbappé - 2 buts',                   explication: 'Écris le nom du joueur suivi du nombre de buts que tu anticipes. Sur Winamax/Betclic, c\'est souvent "plus de 0.5 buts" (= au moins 1 but) ou "plus de 1.5 buts" (= au moins 2 buts) pour un joueur précis.' },
  // Handicap & Spéciaux
  handicap:            { placeholder: 'Ex : PSG -1 but',                        explication: 'Écris l\'équipe et le nombre de buts de handicap. "PSG -1 but" veut dire que le PSG doit gagner par 2 buts d\'écart minimum pour que tu gagnes. Le handicap avantage l\'équipe la plus faible sur le papier.' },
  nombre_corners:      { placeholder: 'Ex : Plus de 9.5 corners',               explication: 'Tu paries sur le nombre total de corners dans le match. Écris "Plus de X.5" ou "Moins de X.5". Les matchs offensifs ont souvent plus de corners. Ex : "Plus de 9.5" = au moins 10 corners pour gagner.' },
  nombre_cartons:      { placeholder: 'Ex : Plus de 3.5 cartons jaunes',        explication: 'Tu paries sur le nombre de cartons (jaunes et/ou rouges). Écris le type (jaunes, rouges, total) et le seuil. Les derbies et les matchs tendus ont tendance à produire plus de cartons.' },
  // Long terme / Compétition
  qualification:       { placeholder: 'Ex : PSG se qualifie pour les quarts LDC', explication: 'Tu paries qu\'une équipe va passer au tour suivant d\'une compétition à élimination directe, ou se qualifier pour une compétition européenne en fin de saison. Écris l\'équipe et la compétition/phase visée. Ex : "Monaco en Ligue des Champions" ou "PSG qualifié pour la demi-finale".' },
  vainqueur_tournoi:   { placeholder: 'Ex : PSG vainqueur Ligue 1',              explication: 'Tu paries sur l\'équipe ou le joueur qui remportera l\'ensemble de la compétition. Place souvent en début de saison ou de tournoi. Écris l\'équipe/joueur et le nom de la compétition.' },
  top_n:               { placeholder: 'Ex : Monaco dans le top 4',               explication: 'Tu paries qu\'une équipe terminera dans un certain classement à la fin de la saison. "Top 4" = finit 1er, 2e, 3e ou 4e. "Top 6" = finit dans les 6 premiers. Utilisé pour les places qualificatives européennes. Écris l\'équipe et le rang visé.' },
  relegation:          { placeholder: 'Ex : Lorient relégué',                    explication: 'Tu paries sur le destin d\'une équipe en bas de tableau. "Relégué" = finit dans la zone de descente. "Promu" (pour la Ligue 2) = monte en Ligue 1. Écris l\'équipe et son destin anticipé.' },
  // Autres
  combiné:             { placeholder: 'Ex : PSG gagne + plus de 2.5 buts',       explication: 'Tu combines plusieurs paris en un seul. Écris chaque sélection séparée par "+". Toutes les sélections doivent être gagnantes pour que le pari soit gagné. La cote finale est la multiplication de toutes les cotes.' },
}

const FORMES_EQUIPE = [
  { label: 'Domicile fort',     value: 'domicile_fort' },
  { label: 'Extérieur faible',  value: 'exterieur_faible' },
  { label: 'Neutre',            value: 'neutre' },
  { label: 'Les deux en forme', value: 'les_deux_en_forme' },
]

const TAGS_RAISONNEMENT = [
  { cle: 'forme_domicile_forte',    label: 'Domicile fort' },
  { cle: 'forme_domicile_faible',   label: 'Domicile faible' },
  { cle: 'forme_exterieur_forte',   label: 'Extérieur fort' },
  { cle: 'forme_exterieur_faible',  label: 'Extérieur faible' },
  { cle: 'equipe_motivee',          label: 'Équipe motivée' },
  { cle: 'equipe_sans_enjeu',       label: 'Équipe sans enjeu' },
  { cle: 'blessures_adversaire',    label: 'Blessures adversaire' },
  { cle: 'fatigue_calendrier',      label: 'Fatigue calendrier' },
  { cle: 'style_defensif',          label: 'Style défensif' },
  { cle: 'over_equipes_offensives', label: 'Équipes offensives' },
  { cle: 'under_conditions_meteo',  label: 'Météo → Peu de buts' },
  { cle: 'cote_value',              label: 'Cote sous-évaluée' },
  { cle: 'stat_domination',         label: 'Domination statistique' },
  { cle: 'instinct',                label: 'Instinct' },
]

const ETAPE1_INIT = {
  sports: [], competition: '', rencontre: '', dateMatch: new Date(),
  typePari: '', valeurPari: '', cote: '', mise: '', bookmaker: '',
}

const ETAPE2_INIT = {
  tagsRaisonnement: [], confiance: 0, raisonnementLibre: '',
  formeEquipes: '', contexteBlessures: '',
  tagAutreActif: false, tagAutreTexte: '',
  coteBoostee: false,
}

const FICHES = TYPES_PARI.map((t, index) => ({
  ...t, ...AIDE_VALEUR_PARI[t.value], index,
})).filter(t => t.explication)

// ─── Modale d'aide carousel ──────────────────────────────────────────────────
function ModaleAidePari({ visible, onFermer, typePariActuel }) {
  const { c } = useTheme()
  const { width } = useWindowDimensions()
  const flatListRef = useRef(null)
  const [indexActuel, setIndexActuel] = useState(0)

  const LARGEUR_MODALE = width - 40
  const LARGEUR_CARTE = LARGEUR_MODALE

  const ouvertureModale = () => {
    const i = Math.max(0, FICHES.findIndex(f => f.value === typePariActuel))
    setIndexActuel(i)
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: i, animated: false })
    }, 80)
  }

  const allerA = (i) => {
    flatListRef.current?.scrollToIndex({ index: i, animated: true })
    setIndexActuel(i)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onFermer}
      onShow={ouvertureModale}
    >
      <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: LARGEUR_MODALE, backgroundColor: c.fondModal, borderRadius: 24, paddingVertical: 24, overflow: 'hidden' }}>

          {/* En-tête */}
          <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: 'bold', color: c.texte, marginBottom: 4 }}>
              Comment remplir "Valeur du pari" ?
            </Text>
            <Text style={{ fontSize: 13, color: c.texteSecondaire }}>
              Glisse pour voir chaque type de pari
            </Text>
          </View>

          {/* Carousel */}
          <FlatList
            ref={flatListRef}
            data={FICHES}
            keyExtractor={item => item.value}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            getItemLayout={(_, index) => ({ length: LARGEUR_CARTE, offset: LARGEUR_CARTE * index, index })}
            onMomentumScrollEnd={e => {
              const i = Math.round(e.nativeEvent.contentOffset.x / LARGEUR_CARTE)
              setIndexActuel(Math.max(0, Math.min(i, FICHES.length - 1)))
            }}
            renderItem={({ item }) => {
              const estActuel = item.value === typePariActuel
              return (
                <View style={{ width: LARGEUR_CARTE, paddingHorizontal: 24 }}>
                  <View style={{
                    backgroundColor: estActuel ? c.fondCarteActive : c.fondCarteInactive,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: estActuel ? '#3b82f6' : c.bordure,
                    padding: 20,
                    minHeight: 200,
                    justifyContent: 'space-between',
                  }}>
                    <View>
                      <Text style={{ fontSize: 20, marginBottom: 8, color: c.texte }}>{item.label}</Text>
                      {estActuel && (
                        <View style={{ backgroundColor: '#3b82f6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 10 }}>
                          <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }}>Ton choix actuel</Text>
                        </View>
                      )}
                      <Text style={{ fontSize: 14, color: c.texteTertiaire, lineHeight: 22 }}>{item.explication}</Text>
                    </View>
                    <View style={{ marginTop: 16, backgroundColor: estActuel ? c.fondExempleActive : c.fondExempleInactif, borderRadius: 10, padding: 12 }}>
                      <Text style={{ fontSize: 11, color: c.texteSecondaire, marginBottom: 2 }}>Exemple à écrire :</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: estActuel ? c.texteExempleActive : c.texteTertiaire }}>{item.placeholder}</Text>
                    </View>
                  </View>
                </View>
              )
            }}
          />

          {/* Points de navigation */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 6 }}>
            {FICHES.map((_, i) => (
              <Pressable key={i} onPress={() => allerA(i)}>
                <View style={{
                  width: indexActuel === i ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: indexActuel === i ? '#3b82f6' : c.bordure,
                }} />
              </Pressable>
            ))}
          </View>

          {/* Compteur + Fermer */}
          <View style={{ paddingHorizontal: 24, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ color: c.texteSecondaire, fontSize: 13, flex: 1 }}>{indexActuel + 1} / {FICHES.length}</Text>
            <Pressable
              onPress={onFermer}
              style={{ flex: 1, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ─── Écran principal ─────────────────────────────────────────────────────────
export default function NouveauPariEcran({ navigation }) {
  const { c } = useTheme()
  const [etape, setEtape] = useState(1)
  const [etape1, setEtape1] = useState(ETAPE1_INIT)
  const [etape2, setEtape2] = useState(ETAPE2_INIT)
  const [afficherDatePicker, setAfficherDatePicker] = useState(false)
  const [modeDatePicker, setModeDatePicker] = useState('date') // 'date' puis 'time' sur Android
  const [chargement, setChargement] = useState(false)
  const [modaleAideVisible, setModaleAideVisible] = useState(false)
  const [selectTypePariVisible, setSelectTypePariVisible] = useState(false)

  const basculerSport = (valeur) => {
    setEtape1(p => ({
      ...p,
      sports: p.sports.includes(valeur)
        ? p.sports.filter(s => s !== valeur)
        : [...p.sports, valeur],
    }))
  }

  const basculerTag = (cle) => {
    setEtape2(prev => ({
      ...prev,
      tagsRaisonnement: prev.tagsRaisonnement.includes(cle)
        ? prev.tagsRaisonnement.filter(t => t !== cle)
        : [...prev.tagsRaisonnement, cle],
    }))
  }

  const validerEtape1 = () => {
    const { sports, competition, rencontre, typePari, valeurPari, cote, mise, bookmaker } = etape1
    if (!sports.length || !competition || !rencontre || !typePari || !valeurPari || !cote || !mise || !bookmaker) {
      Alert.alert('Champs manquants', 'Remplis tous les champs obligatoires.')
      return false
    }
    const coteNorm = parseFloat(String(cote).replace(',', '.'))
    if (isNaN(coteNorm) || coteNorm <= 1) {
      Alert.alert('Cote invalide', 'La cote doit être un nombre supérieur à 1.')
      return false
    }
    const miseNorm = parseFloat(String(mise).replace(',', '.'))
    if (isNaN(miseNorm) || miseNorm <= 0) {
      Alert.alert('Mise invalide', 'La mise doit être un nombre positif.')
      return false
    }
    return true
  }

  const validerEtape2 = () => {
    if (etape2.tagsRaisonnement.length === 0) {
      Alert.alert('Tags manquants', 'Sélectionne au moins un tag de raisonnement.')
      return false
    }
    if (etape2.confiance === 0) {
      Alert.alert('Confiance manquante', 'Indique ton niveau de confiance (1-5 étoiles).')
      return false
    }
    return true
  }

  const handleEnregistrer = async () => {
    if (!validerEtape2()) return
    setChargement(true)
    try {
      await creerPari({
        sport: etape1.sports.join(','),
        competition: etape1.competition,
        rencontre: etape1.rencontre,
        date_match: etape1.dateMatch.toISOString(),
        type_pari: etape1.typePari,
        valeur_pari: etape1.valeurPari,
        cote: parseFloat(String(etape1.cote).replace(',', '.')),
        mise: parseFloat(String(etape1.mise).replace(',', '.')),
        bookmaker: etape1.bookmaker,
        tags_raisonnement: etape2.tagAutreActif && etape2.tagAutreTexte.trim()
          ? [...etape2.tagsRaisonnement, etape2.tagAutreTexte.trim()]
          : etape2.tagsRaisonnement,
        raisonnement_libre: etape2.raisonnementLibre,
        forme_equipes: etape2.formeEquipes,
        contexte_blessures: etape2.contexteBlessures || 'RAS',
        confiance: etape2.confiance,
        cote_boostee: etape2.coteBoostee,
        statut: 'en_attente',
        profit_perte: 0,
      })
      Alert.alert('Pari enregistré !', 'Ton pari a été sauvegardé.', [
        { text: 'OK', onPress: () => navigation?.goBack() }
      ])
      setEtape1(ETAPE1_INIT)
      setEtape2(ETAPE2_INIT)
      setEtape(1)
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le pari. Vérifie ta connexion PocketBase.')
    } finally {
      setChargement(false)
    }
  }

  // Styles partagés pour TextInput
  const styleInput = {
    backgroundColor: c.fondInputBordure,
    borderWidth: 1,
    borderColor: c.bordure,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    color: c.texte,
    fontSize: 15,
  }

  // ── ÉTAPE 1 ──────────────────────────────────────────────────────────────
  if (etape === 1) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: c.fond, padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: c.texte, marginBottom: 24 }}>
          Nouveau pari — Étape 1/2
        </Text>

        {/* Sport */}
        <View className="flex-row justify-between items-center mb-2">
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire }}>Sport *</Text>
          <Text style={{ fontSize: 11, color: c.texteSecondaire }}>Multi-sélection possible</Text>
        </View>
        <View className="flex-row flex-wrap justify-between mb-2">
          {SPORTS.map(s => (
            <SportPill
              key={s.value}
              sport={s}
              selected={etape1.sports.includes(s.value)}
              onPress={() => basculerSport(s.value)}
            />
          ))}
        </View>
        {etape1.sports.length > 1 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, backgroundColor: c.fondCarteActive, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Ionicons name="layers-outline" size={14} color={c.texteSecondaire} />
            <Text style={{ fontSize: 12, color: c.texteSecondaire }}>
              Combiné multisport : {etape1.sports.map(v => SPORTS.find(s => s.value === v)?.label).join(' + ')}
            </Text>
          </View>
        )}
        {etape1.sports.length === 0 && (
          <View style={{ marginBottom: 12 }} />
        )}

        {/* Compétition */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8 }}>Compétition *</Text>
        <TextInput
          style={styleInput}
          placeholder="Ligue 1, Premier League..."
          placeholderTextColor={c.textePlaceholder}
          value={etape1.competition}
          onChangeText={v => setEtape1(p => ({ ...p, competition: v }))}
        />

        {/* Rencontre */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8 }}>Rencontre *</Text>
        <TextInput
          style={styleInput}
          placeholder="PSG vs Lyon"
          placeholderTextColor={c.textePlaceholder}
          value={etape1.rencontre}
          onChangeText={v => setEtape1(p => ({ ...p, rencontre: v }))}
        />

        {/* Date du match */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8 }}>Date et heure *</Text>
        <Pressable
          onPress={() => {
            setModeDatePicker('date')
            setAfficherDatePicker(true)
          }}
          style={[styleInput, { marginBottom: 16 }]}
        >
          <Text style={{ color: c.texte }}>{etape1.dateMatch.toLocaleString('fr-FR')}</Text>
        </Pressable>
        {afficherDatePicker && Platform.OS === 'ios' && (
          <View style={{ backgroundColor: c.fondInput, borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
            <DateTimePicker
              value={etape1.dateMatch}
              mode="datetime"
              display="spinner"
              locale="fr-FR"
              onChange={(_, date) => {
                // iOS spinner : mettre à jour en continu, NE JAMAIS fermer ici
                if (date) setEtape1(p => ({ ...p, dateMatch: date }))
              }}
            />
            <Pressable
              onPress={() => setAfficherDatePicker(false)}
              style={{ backgroundColor: '#2563eb', margin: 12, borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>Confirmer</Text>
            </Pressable>
          </View>
        )}
        {afficherDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={etape1.dateMatch}
            mode={modeDatePicker}
            display="default"
            locale="fr-FR"
            onChange={(event, date) => {
              if (event.type === 'dismissed') {
                setAfficherDatePicker(false)
                setModeDatePicker('date')
                return
              }
              if (modeDatePicker === 'date') {
                const dateSelectionnee = date ?? etape1.dateMatch
                setEtape1(p => ({ ...p, dateMatch: dateSelectionnee }))
                setModeDatePicker('time')
              } else {
                setAfficherDatePicker(false)
                if (date) {
                  const dateAvec = new Date(etape1.dateMatch)
                  dateAvec.setHours(date.getHours(), date.getMinutes())
                  setEtape1(p => ({ ...p, dateMatch: dateAvec }))
                }
                setModeDatePicker('date')
              }
            }}
          />
        )}

        {/* Type de pari */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8 }}>Type de pari *</Text>
        <Pressable
          onPress={() => setSelectTypePariVisible(true)}
          style={{
            backgroundColor: c.fondInputBordure,
            borderWidth: 1,
            borderColor: etape1.typePari ? '#2563eb' : c.bordure,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Text style={{ color: etape1.typePari ? c.texte : c.textePlaceholder, fontSize: 15, fontWeight: etape1.typePari ? '500' : '400' }}>
            {etape1.typePari ? TYPES_PARI.find(t => t.value === etape1.typePari)?.label : 'Sélectionne un type de pari...'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={etape1.typePari ? '#2563eb' : c.textePlaceholder} />
        </Pressable>

        {/* Modale select type de pari */}
        <Modal
          visible={selectTypePariVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectTypePariVisible(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }}
            onPress={() => setSelectTypePariVisible(false)}
          >
            <Pressable onPress={() => {}} style={{ backgroundColor: c.fondModal, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 }}>
              <View style={{ alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.bordure }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.bordure, marginBottom: 12 }} />
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.texte }}>Type de pari</Text>
              </View>
              <ScrollView style={{ maxHeight: 480 }}>
                {(() => {
                  const elements = []
                  let groupeActuel = null
                  for (const t of TYPES_PARI) {
                    if (t.groupe !== groupeActuel) {
                      groupeActuel = t.groupe
                      elements.push(
                        <View key={`groupe-${t.groupe}`} style={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 6, backgroundColor: c.fond }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: c.texteSecondaire, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {t.groupe}
                          </Text>
                        </View>
                      )
                    }
                    const selectionne = etape1.typePari === t.value
                    elements.push(
                      <Pressable
                        key={t.value}
                        onPress={() => {
                          setEtape1(p => ({ ...p, typePari: t.value }))
                          setSelectTypePariVisible(false)
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 24,
                          paddingVertical: 13,
                          backgroundColor: selectionne ? c.fondCarteActive : c.fondModal,
                          borderBottomWidth: 1,
                          borderBottomColor: c.fond,
                        }}
                      >
                        <Text style={{ flex: 1, fontSize: 15, color: selectionne ? '#2563eb' : c.texte, fontWeight: selectionne ? '600' : '400' }}>
                          {t.label}
                        </Text>
                        <Ionicons
                          name={selectionne ? 'checkmark-circle' : t.icon}
                          size={20}
                          color={selectionne ? '#2563eb' : c.bordure}
                        />
                      </Pressable>
                    )
                  }
                  return elements
                })()}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Valeur du pari */}
        <View className="flex-row items-center justify-between mb-2">
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire }}>Valeur du pari *</Text>
          <Pressable
            onPress={() => setModaleAideVisible(true)}
            className="flex-row items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1"
          >
            <Text className="text-blue-600 text-xs font-semibold">? Explication</Text>
          </Pressable>
        </View>
        <TextInput
          style={styleInput}
          placeholder={AIDE_VALEUR_PARI[etape1.typePari]?.placeholder ?? 'Précise la valeur de ton pari...'}
          placeholderTextColor={c.textePlaceholder}
          value={etape1.valeurPari}
          onChangeText={v => setEtape1(p => ({ ...p, valeurPari: v }))}
        />

        {/* Modale d'aide */}
        <ModaleAidePari
          visible={modaleAideVisible}
          onFermer={() => setModaleAideVisible(false)}
          typePariActuel={etape1.typePari}
        />

        {/* Cote + Mise */}
        <View className="flex-row gap-3 mb-4">
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8 }}>Cote *</Text>
            <TextInput
              style={{ ...styleInput, marginBottom: 0 }}
              placeholder="1.85"
              placeholderTextColor={c.textePlaceholder}
              keyboardType="decimal-pad"
              value={etape1.cote}
              onChangeText={v => setEtape1(p => ({ ...p, cote: v }))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8 }}>Mise (€) *</Text>
            <TextInput
              style={{ ...styleInput, marginBottom: 0 }}
              placeholder="20"
              placeholderTextColor={c.textePlaceholder}
              keyboardType="decimal-pad"
              value={etape1.mise}
              onChangeText={v => setEtape1(p => ({ ...p, mise: v }))}
            />
          </View>
        </View>

        {/* Site de paris */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8, marginTop: 8 }}>Site de paris *</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {BOOKMAKERS.map(bk => {
            const selectionne = etape1.bookmaker === bk.value
            return (
              <Pressable
                key={bk.value}
                onPress={() => setEtape1(p => ({ ...p, bookmaker: bk.value }))}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 10,
                  paddingRight: 16,
                  paddingLeft: 6,
                  borderRadius: 14,
                  borderWidth: selectionne ? 2 : 1.5,
                  borderColor: selectionne ? bk.couleurPrincipale : c.bordure,
                  backgroundColor: selectionne ? bk.couleurPrincipale + '12' : c.fondCarte,
                  minWidth: '45%',
                  flex: 1,
                }}
              >
                <LinearGradient
                  colors={[bk.couleurPrincipale, bk.couleurSecondaire]}
                  style={{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: bk.couleurTexte, fontSize: bk.initiales.length > 1 ? 11 : 15, fontWeight: '900', letterSpacing: bk.initiales.length > 1 ? -0.5 : 0 }}>
                    {bk.initiales}
                  </Text>
                </LinearGradient>
                <Text style={{ fontSize: 14, fontWeight: selectionne ? '700' : '500', color: selectionne ? bk.couleurPrincipale : c.texte, flex: 1 }}>
                  {bk.label}
                </Text>
                {selectionne && <Ionicons name="checkmark-circle" size={18} color={bk.couleurPrincipale} />}
              </Pressable>
            )
          })}
        </View>

        <Pressable
          onPress={() => validerEtape1() && setEtape(2)}
          className="bg-blue-600 rounded-xl py-4 items-center mb-8"
        >
          <Text className="text-white font-bold text-base">Suivant →</Text>
        </Pressable>
      </ScrollView>
    )
  }

  // ── ÉTAPE 2 ──────────────────────────────────────────────────────────────
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.fond, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: c.texte, marginBottom: 24 }}>
        Nouveau pari — Étape 2/2
      </Text>

      {/* Tags raisonnement */}
      <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8 }}>
        Tags de raisonnement * (multi-sélection)
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-2">
        {TAGS_RAISONNEMENT.map(t => {
          const selectionne = etape2.tagsRaisonnement.includes(t.cle)
          return (
            <Pressable
              key={t.cle}
              onPress={() => basculerTag(t.cle)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                backgroundColor: selectionne ? '#16a34a' : c.fondCarte,
                borderColor: selectionne ? '#16a34a' : c.bordure,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: selectionne ? '600' : '400', color: selectionne ? '#ffffff' : c.texte }}>
                {t.label}
              </Text>
            </Pressable>
          )
        })}
        {/* Chip Autre */}
        <Pressable
          onPress={() => setEtape2(p => ({ ...p, tagAutreActif: !p.tagAutreActif, tagAutreTexte: p.tagAutreActif ? '' : p.tagAutreTexte }))}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            backgroundColor: etape2.tagAutreActif ? '#16a34a' : c.fondCarte,
            borderColor: etape2.tagAutreActif ? '#16a34a' : c.bordure,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: etape2.tagAutreActif ? '600' : '400', color: etape2.tagAutreActif ? '#ffffff' : c.texte }}>
            + Autre
          </Text>
        </Pressable>
      </View>
      {etape2.tagAutreActif && (
        <TextInput
          style={{ ...styleInput, marginBottom: 12 }}
          placeholder="Décris ton raisonnement..."
          placeholderTextColor={c.textePlaceholder}
          value={etape2.tagAutreTexte}
          onChangeText={v => setEtape2(p => ({ ...p, tagAutreTexte: v }))}
          autoFocus
        />
      )}

      {/* Cote boostée */}
      <Pressable
        onPress={() => setEtape2(p => ({ ...p, coteBoostee: !p.coteBoostee }))}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 14,
          borderWidth: etape2.coteBoostee ? 2 : 1.5,
          borderColor: etape2.coteBoostee ? '#f59e0b' : c.bordure,
          backgroundColor: etape2.coteBoostee ? '#fef3c7' : c.fondCarte,
          marginBottom: 16,
        }}
      >
        <Ionicons name="flash" size={20} color={etape2.coteBoostee ? '#d97706' : c.bordure} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: etape2.coteBoostee ? '700' : '500', color: etape2.coteBoostee ? '#92400e' : c.texte }}>
            Cote boostée
          </Text>
          <Text style={{ fontSize: 11, color: etape2.coteBoostee ? '#b45309' : c.texteSecondaire, marginTop: 1 }}>
            La cote a été augmentée par le bookmaker
          </Text>
        </View>
        <View style={{
          width: 24, height: 24, borderRadius: 12,
          backgroundColor: etape2.coteBoostee ? '#f59e0b' : c.fondBadge,
          alignItems: 'center', justifyContent: 'center',
        }}>
          {etape2.coteBoostee && <Ionicons name="checkmark" size={14} color="#ffffff" />}
        </View>
      </Pressable>

      {/* Confiance */}
      <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8 }}>
        Niveau de confiance *
      </Text>
      <View className="flex-row gap-3 mb-4">
        {[1, 2, 3, 4, 5].map(n => (
          <Pressable key={n} onPress={() => setEtape2(p => ({ ...p, confiance: n }))}>
            <Ionicons
              name={n <= etape2.confiance ? 'star' : 'star-outline'}
              size={32}
              color={n <= etape2.confiance ? '#f59e0b' : c.bordure}
            />
          </Pressable>
        ))}
      </View>

      {/* Forme des équipes */}
      <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8 }}>
        Forme des équipes
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {FORMES_EQUIPE.map(f => (
          <Pressable
            key={f.value}
            onPress={() => setEtape2(p => ({ ...p, formeEquipes: f.value }))}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              backgroundColor: etape2.formeEquipes === f.value ? '#2563eb' : c.fondCarte,
              borderColor: etape2.formeEquipes === f.value ? '#2563eb' : c.bordure,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: etape2.formeEquipes === f.value ? '600' : '400', color: etape2.formeEquipes === f.value ? '#ffffff' : c.texte }}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Contexte blessures */}
      <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8 }}>
        Contexte blessures
      </Text>
      <TextInput
        style={styleInput}
        placeholder="RAS / défenseur clé absent..."
        placeholderTextColor={c.textePlaceholder}
        value={etape2.contexteBlessures}
        onChangeText={v => setEtape2(p => ({ ...p, contexteBlessures: v }))}
      />

      {/* Raisonnement libre */}
      <Text style={{ fontSize: 13, fontWeight: '600', color: c.texteTertiaire, marginBottom: 8 }}>
        Précisions (optionnel)
      </Text>
      <TextInput
        style={[styleInput, { marginBottom: 24, minHeight: 80, textAlignVertical: 'top' }]}
        placeholder="Précisions supplémentaires..."
        placeholderTextColor={c.textePlaceholder}
        multiline
        numberOfLines={3}
        value={etape2.raisonnementLibre}
        onChangeText={v => setEtape2(p => ({ ...p, raisonnementLibre: v }))}
      />

      <View className="flex-row gap-3 mb-8">
        <Pressable
          onPress={() => setEtape(1)}
          style={{ flex: 1, backgroundColor: c.fondBadge, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
        >
          <Text style={{ color: c.texte, fontWeight: 'bold', fontSize: 16 }}>← Retour</Text>
        </Pressable>
        <Pressable
          onPress={handleEnregistrer}
          disabled={chargement}
          className={`flex-1 rounded-xl py-4 items-center ${chargement ? 'bg-gray-400' : 'bg-green-600'}`}
        >
          <Text className="text-white font-bold text-base">
            {chargement ? 'Enregistrement...' : 'Enregistrer le pari'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
