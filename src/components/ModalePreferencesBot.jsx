import React, { useState, useEffect } from 'react'
import {
  View, Text, Pressable, Modal, ScrollView,
  ActivityIndicator, SafeAreaView,
} from 'react-native'
import Svg, { Path, Circle, Ellipse, Line, Polyline, Rect } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { sauvegarderPreferencesBot } from '../services/pocketbase'

// ─── Valeurs par défaut ───────────────────────────────────────────────────────

const PREFS_DEFAUT = {
  sports: ['football'],
  profil_risque: 'equilibre',
  types_analyse: ['patterns', 'anomalies'],
  format_pari: 'sec',
  source_donnees: 'perso',
  consentement_donnees: true,
}

// ─── Icônes SVG ───────────────────────────────────────────────────────────────

const IcFootball = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.5" />
    <Path d="M12 7.5 L14.5 9.5 L13.5 13 L10.5 13 L9.5 9.5 Z" fill={color} />
    <Line x1="9.5" y1="9.5" x2="7" y2="11" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <Line x1="14.5" y1="9.5" x2="17" y2="11" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <Line x1="10.5" y1="13" x2="9.5" y2="16" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <Line x1="13.5" y1="13" x2="14.5" y2="16" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </Svg>
)

const IcTennis = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.5" />
    <Path d="M4.5 9 C7 7 10 9 10 12 C10 15 7 17 4.5 15" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    <Path d="M19.5 9 C17 7 14 9 14 12 C14 15 17 17 19.5 15" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
  </Svg>
)

const IcBasketball = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.5" />
    <Line x1="12" y1="2.5" x2="12" y2="21.5" stroke={color} strokeWidth="1.2" />
    <Line x1="2.5" y1="12" x2="21.5" y2="12" stroke={color} strokeWidth="1.2" />
    <Path d="M6 5.5 C9 9 9 15 6 18.5" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    <Path d="M18 5.5 C15 9 15 15 18 18.5" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
  </Svg>
)

const IcRugby = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Ellipse cx="12" cy="12" rx="9" ry="5.5" stroke={color} strokeWidth="1.5" />
    <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1" />
    <Path d="M9.5 7.5 Q12 6.5 14.5 7.5" stroke={color} strokeWidth="1.1" fill="none" />
    <Path d="M9.5 16.5 Q12 17.5 14.5 16.5" stroke={color} strokeWidth="1.1" fill="none" />
  </Svg>
)

const IcHockey = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8 3 L8 17 Q8 20 12 20 L18 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Circle cx="5.5" cy="10" r="1.5" fill={color} />
  </Svg>
)

const IcShield = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2.5 L20.5 6.5 L20.5 13 C20.5 17.5 16.5 21 12 22.5 C7.5 21 3.5 17.5 3.5 13 L3.5 6.5 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <Path d="M9 12 L11 14 L15 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

const IcBalance = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M4 7 L7 14 L10 7" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 7 L17 14 L20 7" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="10" y1="21" x2="14" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
)

const IcRocket = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2 C16 5 17 10 17 14 L15.5 16 L8.5 16 L7 14 C7 10 8 5 12 2Z" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    <Path d="M8.5 16 L7 21 L12 19 L17 21 L15.5 16" stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
    <Circle cx="12" cy="10" r="2" stroke={color} strokeWidth="1.3" fill="none" />
  </Svg>
)

const IcDiamond = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2 L21 9 L12 22 L3 9 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.2" />
    <Line x1="8" y1="9" x2="12" y2="2" stroke={color} strokeWidth="1" opacity="0.5" />
    <Line x1="16" y1="9" x2="12" y2="2" stroke={color} strokeWidth="1" opacity="0.5" />
  </Svg>
)

const IcGraph = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3,17 8,11 13,14 18,7 21,9" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="8" cy="11" r="1.8" fill={color} />
    <Circle cx="13" cy="14" r="1.8" fill={color} />
    <Circle cx="18" cy="7" r="1.8" fill={color} />
  </Svg>
)

const IcLightning = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M13 2 L4 14 L11 14 L11 22 L20 10 L13 10 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
  </Svg>
)

const IcTarget = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.5" />
    <Circle cx="12" cy="12" r="5.5" stroke={color} strokeWidth="1.3" />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
)

const IcChain = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="4" width="9" height="6" rx="3" stroke={color} strokeWidth="1.5" />
    <Rect x="13" y="14" width="9" height="6" rx="3" stroke={color} strokeWidth="1.5" />
    <Path d="M11 7 L13 7 Q18 7 18 14 L13 14" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
  </Svg>
)

const IcStar = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2 L14.9 9.3 L22.5 9.3 L16.4 14 L18.8 21.5 L12 17 L5.2 21.5 L7.6 14 L1.5 9.3 L9.1 9.3 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
  </Svg>
)

const IcPerson = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="7" r="4.5" stroke={color} strokeWidth="1.5" />
    <Path d="M3.5 21 C3.5 16.5 7 13.5 12 13.5 C17 13.5 20.5 16.5 20.5 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </Svg>
)

const IcCommunity = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="8.5" cy="7" r="3.5" stroke={color} strokeWidth="1.3" />
    <Circle cx="15.5" cy="7" r="3.5" stroke={color} strokeWidth="1.3" />
    <Path d="M1.5 20 C1.5 16.5 4.5 14 8.5 14" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
    <Path d="M15.5 14 C19.5 14 22.5 16.5 22.5 20" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
    <Path d="M8.5 14 C9.8 13.4 10.9 13 12 13 C13.1 13 14.2 13.4 15.5 14" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
  </Svg>
)

const IcLock = ({ color, size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="11" width="16" height="12" rx="3" stroke={color} strokeWidth="1.5" />
    <Path d="M8 11 L8 7 C8 4.5 10 3 12 3 C14 3 16 4.5 16 7 L16 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Circle cx="12" cy="17" r="1.5" fill={color} />
    <Line x1="12" y1="18.5" x2="12" y2="20.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </Svg>
)

// ─── Composant carte option ───────────────────────────────────────────────────

const CarteOption = ({ Icone, titre, description, selectionne, onPress, c, couleurActive }) => {
  const cA = couleurActive ?? '#3b82f6'
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: selectionne ? (cA + '15') : c.carte,
        borderWidth: selectionne ? 2 : 1,
        borderColor: selectionne ? cA : c.bordure,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{
        width: 46, height: 46, borderRadius: 12,
        backgroundColor: selectionne ? (cA + '20') : c.chip,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Icone color={selectionne ? cA : c.sec} size={26} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: selectionne ? cA : c.texte, fontSize: 15, fontWeight: '700', marginBottom: 2 }}>
          {titre}
        </Text>
        {description ? (
          <Text style={{ color: c.sec, fontSize: 12, lineHeight: 17 }}>{description}</Text>
        ) : null}
      </View>
      {selectionne && (
        <View style={{
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: cA, alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="checkmark" size={13} color="#fff" />
        </View>
      )}
    </Pressable>
  )
}

// ─── Slides ───────────────────────────────────────────────────────────────────

const SlideConsentement = ({ c, estSombre }) => (
  <View style={{ alignItems: 'center', paddingTop: 16 }}>
    <View style={{
      width: 80, height: 80, borderRadius: 24,
      backgroundColor: estSombre ? '#1e3a5f' : '#dbeafe',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 24,
    }}>
      <IcLock color={c.accent} size={44} />
    </View>

    <Text style={{ color: c.texte, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10 }}>
      Tes données au service du bot
    </Text>
    <Text style={{ color: c.sec, fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 }}>
      BetEdge apprend de tes paris pour détecter des opportunités similaires sur le marché.
    </Text>

    <View style={{
      backgroundColor: c.carte, borderWidth: 1, borderColor: c.bordure,
      borderRadius: 12, padding: 16, marginBottom: 14, width: '100%',
    }}>
      <Text style={{ color: c.texte, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>
        Ce que ça signifie concrètement
      </Text>
      {[
        'Tes paris contribuent anonymement à enrichir le bot pour toute la communauté.',
        'Aucune donnée personnelle identifiable n\'est partagée avec d\'autres utilisateurs.',
        'Tu choisis si tu veux bénéficier des patterns communautaires ou uniquement des tiens.',
      ].map((texte, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent, marginTop: 7 }} />
          <Text style={{ color: c.sec, fontSize: 13, lineHeight: 20, flex: 1 }}>{texte}</Text>
        </View>
      ))}
    </View>

    <View style={{
      backgroundColor: estSombre ? '#0f2a1a' : '#f0fdf4',
      borderWidth: 1, borderColor: '#22c55e40',
      borderRadius: 10, padding: 12, width: '100%',
    }}>
      <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18 }}>
        En utilisant BetEdge, tu acceptes ce traitement des données conformément au RGPD.
      </Text>
    </View>
  </View>
)

const SlideSports = ({ prefs, toggle, c }) => (
  <View>
    <Text style={{ color: c.texte, fontSize: 20, fontWeight: '800', marginBottom: 6 }}>Sports à surveiller</Text>
    <Text style={{ color: c.sec, fontSize: 14, marginBottom: 20, lineHeight: 20 }}>
      Le bot analysera uniquement les matchs de ces sports. Tu peux en sélectionner plusieurs.
    </Text>
    {[
      { valeur: 'football',   Icone: IcFootball,   titre: 'Football',    description: 'Ligue 1, Premier League, Champions League…' },
      { valeur: 'tennis',     Icone: IcTennis,     titre: 'Tennis',      description: 'ATP, WTA, Grands Chelems…' },
      { valeur: 'basketball', Icone: IcBasketball, titre: 'Basketball',  description: 'NBA, Euroleague…' },
      { valeur: 'rugby',      Icone: IcRugby,      titre: 'Rugby',       description: 'Top 14, 6 Nations, Champions Cup…' },
      { valeur: 'hockey',     Icone: IcHockey,     titre: 'Hockey',      description: 'NHL, Championnat du Monde…' },
    ].map(({ valeur, Icone, titre, description }) => (
      <CarteOption
        key={valeur}
        Icone={Icone}
        titre={titre}
        description={description}
        selectionne={prefs.sports.includes(valeur)}
        onPress={() => toggle(valeur)}
        c={c}
      />
    ))}
  </View>
)

const SlideRisque = ({ prefs, setPrefs, c }) => (
  <View>
    <Text style={{ color: c.texte, fontSize: 20, fontWeight: '800', marginBottom: 6 }}>Profil de risque</Text>
    <Text style={{ color: c.sec, fontSize: 14, marginBottom: 20, lineHeight: 20 }}>
      Détermine la plage de cotes que le bot cible pour toi.
    </Text>
    {[
      { valeur: 'securite',    Icone: IcShield,  titre: 'Sécurité',          description: 'Cotes 1.10 – 1.80 · Paris très probables, gains modestes', couleur: '#22c55e' },
      { valeur: 'equilibre',   Icone: IcBalance, titre: 'Équilibré',          description: 'Cotes 1.50 – 2.50 · Bon compromis risque / gain', couleur: '#3b82f6' },
      { valeur: 'risque',      Icone: IcRocket,  titre: 'Audacieux',          description: 'Cotes 2.00 – 4.00 · Paris risqués à fort potentiel', couleur: '#f59e0b' },
      { valeur: 'tres_risque', Icone: IcDiamond, titre: 'Chasseur de valeur', description: 'Cotes 3.00+ · Gros coups ou anomalies de marché', couleur: '#a855f7' },
    ].map(({ valeur, Icone, titre, description, couleur }) => (
      <CarteOption
        key={valeur}
        Icone={Icone}
        titre={titre}
        description={description}
        selectionne={prefs.profil_risque === valeur}
        onPress={() => setPrefs(p => ({ ...p, profil_risque: valeur }))}
        c={c}
        couleurActive={couleur}
      />
    ))}
  </View>
)

const SlideAnalyse = ({ prefs, toggle, c }) => (
  <View>
    <Text style={{ color: c.texte, fontSize: 20, fontWeight: '800', marginBottom: 6 }}>Type d'analyse</Text>
    <Text style={{ color: c.sec, fontSize: 14, marginBottom: 20, lineHeight: 20 }}>
      Comment le bot détecte les opportunités. Tu peux activer les deux.
    </Text>
    {[
      { valeur: 'patterns',  Icone: IcGraph,     titre: 'Mes patterns gagnants', description: 'Le bot compare les matchs à venir avec tes critères de victoires passées.' },
      { valeur: 'anomalies', Icone: IcLightning, titre: 'Cotes anormales',       description: 'Le bot détecte quand un bookmaker propose une cote sous-évaluée par le marché.' },
    ].map(({ valeur, Icone, titre, description }) => (
      <CarteOption
        key={valeur}
        Icone={Icone}
        titre={titre}
        description={description}
        selectionne={prefs.types_analyse.includes(valeur)}
        onPress={() => toggle(valeur)}
        c={c}
      />
    ))}
  </View>
)

const SlideFormat = ({ prefs, setPrefs, c }) => (
  <View>
    <Text style={{ color: c.texte, fontSize: 20, fontWeight: '800', marginBottom: 6 }}>Format de pari</Text>
    <Text style={{ color: c.sec, fontSize: 14, marginBottom: 20, lineHeight: 20 }}>
      Le bot adaptera ses suggestions à ton style préféré.
    </Text>
    {[
      { valeur: 'sec',      Icone: IcTarget, titre: 'Paris secs',     description: 'Une seule sélection par alerte · Précis et maîtrisé.' },
      { valeur: 'combine',  Icone: IcChain,  titre: 'Paris combinés', description: 'Plusieurs sélections groupées · Cote globale plus élevée, risque accru.' },
      { valeur: 'les_deux', Icone: IcStar,   titre: 'Les deux',       description: 'Le bot propose selon l\'opportunité, sans restriction de format.' },
    ].map(({ valeur, Icone, titre, description }) => (
      <CarteOption
        key={valeur}
        Icone={Icone}
        titre={titre}
        description={description}
        selectionne={prefs.format_pari === valeur}
        onPress={() => setPrefs(p => ({ ...p, format_pari: valeur }))}
        c={c}
      />
    ))}
  </View>
)

const SlideSource = ({ prefs, setPrefs, c, estSombre }) => (
  <View>
    <Text style={{ color: c.texte, fontSize: 20, fontWeight: '800', marginBottom: 6 }}>Base d'analyse</Text>
    <Text style={{ color: c.sec, fontSize: 14, marginBottom: 20, lineHeight: 20 }}>
      Sur quoi le bot se base-t-il pour générer TES alertes ?
    </Text>
    {[
      {
        valeur: 'perso',
        Icone: IcPerson,
        titre: 'Mes paris uniquement',
        description: 'Le bot analyse exclusivement ton historique. Plus précis une fois que tu as accumulé des données.',
        note: null,
      },
      {
        valeur: 'communaute',
        Icone: IcCommunity,
        titre: 'Données de la communauté',
        description: 'Le bot s\'appuie sur les patterns de toute la communauté BetEdge. Utile si tu débutes ou veux une vision plus large.',
        note: 'Tes paris contribuent déjà au pool commun, quel que soit ton choix ici.',
      },
    ].map(({ valeur, Icone, titre, description, note }) => (
      <View key={valeur}>
        <CarteOption
          Icone={Icone}
          titre={titre}
          description={description}
          selectionne={prefs.source_donnees === valeur}
          onPress={() => setPrefs(p => ({ ...p, source_donnees: valeur }))}
          c={c}
        />
        {note && prefs.source_donnees === valeur && (
          <View style={{
            backgroundColor: estSombre ? '#1e3a5f' : '#eff6ff',
            borderRadius: 8, padding: 10,
            marginTop: -4, marginBottom: 10,
          }}>
            <Text style={{ color: c.sec, fontSize: 12, lineHeight: 18 }}>{note}</Text>
          </View>
        )}
      </View>
    ))}
  </View>
)

// ─── Composant principal ──────────────────────────────────────────────────────

const NB_QUESTIONS = 5

export default function ModalePreferencesBot({ visible, onFermer, preferencesInitiales }) {
  const { estSombre } = useTheme()
  const [etape, setEtape] = useState(0)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [prefs, setPrefs] = useState({ ...PREFS_DEFAUT })

  const c = {
    fond:    estSombre ? '#0f172a' : '#f8fafc',
    carte:   estSombre ? '#1e293b' : '#ffffff',
    texte:   estSombre ? '#f1f5f9' : '#1e293b',
    sec:     estSombre ? '#94a3b8' : '#64748b',
    bordure: estSombre ? '#334155' : '#e2e8f0',
    chip:    estSombre ? '#334155' : '#f1f5f9',
    accent:  '#3b82f6',
  }

  useEffect(() => {
    if (!visible) return
    if (preferencesInitiales) {
      setPrefs({ ...PREFS_DEFAUT, ...preferencesInitiales })
      setEtape(1) // skip consentement si déjà configuré
    } else {
      setPrefs({ ...PREFS_DEFAUT })
      setEtape(0)
    }
  }, [visible])

  const toggleSport = (sport) => {
    setPrefs(p => {
      const sports = p.sports.includes(sport)
        ? p.sports.filter(s => s !== sport)
        : [...p.sports, sport]
      return { ...p, sports: sports.length > 0 ? sports : [sport] }
    })
  }

  const toggleTypeAnalyse = (type) => {
    setPrefs(p => {
      const types = p.types_analyse.includes(type)
        ? p.types_analyse.filter(t => t !== type)
        : [...p.types_analyse, type]
      return { ...p, types_analyse: types.length > 0 ? types : [type] }
    })
  }

  const handleValider = async () => {
    setSauvegarde(true)
    try {
      const prefsFinales = { ...prefs, consentement_donnees: true }
      await sauvegarderPreferencesBot(prefsFinales)
      onFermer(prefsFinales)
    } catch {
      onFermer(null)
    } finally {
      setSauvegarde(false)
    }
  }

  const reculer = () => {
    if (etape === 0 || etape === 1) {
      onFermer(null)
    } else {
      setEtape(e => e - 1)
    }
  }

  const progressionVisible = etape > 0

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.fond }}>

        {/* ── Header ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 20, paddingVertical: 14,
          borderBottomWidth: 1, borderBottomColor: c.bordure,
        }}>
          <Pressable onPress={reculer} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name={etape === 0 ? 'close' : 'arrow-back'} size={22} color={c.texte} />
          </Pressable>
          <Text style={{ color: c.texte, fontSize: 17, fontWeight: '700', flex: 1 }}>
            Configurer mon bot
          </Text>
          {progressionVisible && (
            <Text style={{ color: c.sec, fontSize: 13, fontWeight: '600' }}>
              {etape} / {NB_QUESTIONS}
            </Text>
          )}
        </View>

        {/* ── Barre de progression ── */}
        {progressionVisible && (
          <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 20, paddingTop: 12 }}>
            {Array.from({ length: NB_QUESTIONS }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1, height: 3, borderRadius: 2,
                  backgroundColor: i < etape ? c.accent : c.chip,
                }}
              />
            ))}
          </View>
        )}

        {/* ── Contenu de la slide ── */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 8 }}>
          {etape === 0 && <SlideConsentement c={c} estSombre={estSombre} />}
          {etape === 1 && <SlideSports prefs={prefs} toggle={toggleSport} c={c} />}
          {etape === 2 && <SlideRisque prefs={prefs} setPrefs={setPrefs} c={c} />}
          {etape === 3 && <SlideAnalyse prefs={prefs} toggle={toggleTypeAnalyse} c={c} />}
          {etape === 4 && <SlideFormat prefs={prefs} setPrefs={setPrefs} c={c} />}
          {etape === 5 && <SlideSource prefs={prefs} setPrefs={setPrefs} c={c} estSombre={estSombre} />}
        </ScrollView>

        {/* ── Footer navigation ── */}
        <View style={{ padding: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.bordure }}>
          {etape === 0 ? (
            <Pressable
              onPress={() => setEtape(1)}
              style={{ backgroundColor: c.accent, borderRadius: 12, padding: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                J'ai compris — Configurer mon bot
              </Text>
            </Pressable>
          ) : etape < NB_QUESTIONS ? (
            <Pressable
              onPress={() => setEtape(e => e + 1)}
              style={{ backgroundColor: c.accent, borderRadius: 12, padding: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Suivant</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleValider}
              disabled={sauvegarde}
              style={{
                backgroundColor: '#22c55e', borderRadius: 12,
                padding: 16, alignItems: 'center',
                opacity: sauvegarde ? 0.6 : 1,
              }}
            >
              {sauvegarde
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Enregistrer mes préférences</Text>
              }
            </Pressable>
          )}
        </View>

      </SafeAreaView>
    </Modal>
  )
}
