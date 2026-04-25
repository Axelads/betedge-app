import React, { useRef, useState, useEffect } from 'react'
import {
  View, Text, Modal, Pressable, FlatList,
  Image, useWindowDimensions, Animated,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'

// ─── Confettis ────────────────────────────────────────────────────────────────

const COULEURS_CONFETTI = [
  '#fbbf24', '#3b82f6', '#a855f7', '#22c55e',
  '#ef4444', '#f97316', '#ec4899', '#ffffff', '#06b6d4',
]

function ConfettiPiece({ x, couleur, taille, delai, duree, estCercle, hauteur }) {
  const animY   = useRef(new Animated.Value(-20)).current
  const animRot = useRef(new Animated.Value(0)).current
  const animOp  = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delai),
      Animated.parallel([
        Animated.timing(animY, { toValue: hauteur + 20, duration: duree, useNativeDriver: true }),
        Animated.timing(animRot, { toValue: 5, duration: duree, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(duree * 0.60),
          Animated.timing(animOp, { toValue: 0, duration: duree * 0.40, useNativeDriver: true }),
        ]),
      ]),
    ])
    anim.start()
    return () => anim.stop()
  }, [])

  const rotate = animRot.interpolate({ inputRange: [0, 5], outputRange: ['0deg', '1800deg'] })

  return (
    <Animated.View style={{
      position: 'absolute',
      left: x,
      top: 0,
      width: taille,
      height: estCercle ? taille : taille * 0.55,
      backgroundColor: couleur,
      borderRadius: estCercle ? taille / 2 : 3,
      opacity: animOp,
      transform: [{ translateY: animY }, { rotate }],
    }} />
  )
}

function ConfettiSurface({ largeur, hauteur }) {
  const pieces = useRef(
    Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x: Math.random() * (largeur - 12),
      couleur: COULEURS_CONFETTI[i % COULEURS_CONFETTI.length],
      taille: 7 + Math.random() * 9,
      delai: Math.random() * 1000,
      duree: 3000 + Math.random() * 2500,
      estCercle: Math.random() > 0.45,
    }))
  ).current

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, width: largeur, height: hauteur, zIndex: 10 }}
    >
      {pieces.map(p => <ConfettiPiece key={p.id} {...p} hauteur={hauteur} />)}
    </View>
  )
}

// ─── Emoji avec rebond au démarrage ───────────────────────────────────────────

function EmojiRebond({ emoji }) {
  const scale = useRef(new Animated.Value(0.2)).current

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 60,
      friction: 5,
      useNativeDriver: true,
    }).start()
  }, [])

  return (
    <Animated.Text style={{ fontSize: 46, transform: [{ scale }] }}>
      {emoji}
    </Animated.Text>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function AvatarUtilisateur({ utilisateur, taille = 82 }) {
  const initiale = (utilisateur.nom || '?').charAt(0).toUpperCase()

  const ombre = {
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 12,
  }

  if (utilisateur.avatarUrl) {
    return (
      <View style={{ borderRadius: taille / 2 + 5, ...ombre }}>
        <Image
          source={{ uri: utilisateur.avatarUrl }}
          style={{
            width: taille, height: taille, borderRadius: taille / 2,
            borderWidth: 3, borderColor: '#fbbf24',
          }}
        />
      </View>
    )
  }
  return (
    <View style={{
      width: taille, height: taille, borderRadius: taille / 2,
      backgroundColor: '#1e3a8a',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: '#fbbf24',
      ...ombre,
    }}>
      <Text style={{ fontSize: taille * 0.4, fontWeight: '800', color: '#fff' }}>{initiale}</Text>
    </View>
  )
}

// ─── KPI ──────────────────────────────────────────────────────────────────────

function KPI({ label, valeur, couleur }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 11 }}>
      <Text style={{ fontSize: 14, fontWeight: '800', color: couleur }} numberOfLines={1}>
        {valeur}
      </Text>
      <Text style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{label}</Text>
    </View>
  )
}

// ─── Slide ────────────────────────────────────────────────────────────────────

function SlidePalmares({ slide, largeur, c, estSombre, currentUserId, cleAnim }) {
  const { type, data } = slide
  const estSemaine  = type === 'semaine'
  const estLeMemeUser = data?.utilisateur?.id === currentUserId

  if (!data) {
    return (
      <View style={{ width: largeur, flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
        <Text style={{ color: '#64748b', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
          Pas assez de données {estSemaine ? 'cette semaine' : 'ce mois'}.{'\n'}
          Continue d'enregistrer tes paris !
        </Text>
      </View>
    )
  }

  const roiPositif    = data.roi >= 0
  const roiCouleur    = roiPositif ? '#22c55e' : '#ef4444'
  const roiStr        = `${roiPositif ? '+' : ''}${data.roi.toFixed(1)}%`
  const profitStr     = `${data.profit >= 0 ? '+' : ''}${data.profit.toFixed(2)} €`
  const profitCouleur = data.profit >= 0 ? '#22c55e' : '#ef4444'
  const winRateStr    = `${Math.round(data.tauxReussite)}%`
  const scoreStr      = `${data.nbGagnes}W / ${data.nbTermines - data.nbGagnes}L`

  const gradients = estSemaine
    ? ['#0c0700', '#2a1c00', '#1a1200', '#0c0f1e']
    : ['#0c0020', '#220040', '#1a0030', '#0c0f1e']

  const fondKpi   = estSombre ? '#1e293b' : '#f1f5f9'
  const bordKpi   = estSombre ? '#334155' : '#e2e8f0'
  const emoji     = estSemaine ? '🏆' : '👑'
  const titre     = estSemaine ? 'MEILLEUR PARIEUR DE LA SEMAINE' : 'CHAMPION DU MOIS'
  const couleurTitre = estSemaine ? '#fbbf24' : '#d8b4fe'

  return (
    <View style={{ width: largeur, flex: 1 }}>
      {/* Confettis en overlay (uniquement slide 1) */}
      {estSemaine && cleAnim > 0 && (
        <ConfettiSurface key={cleAnim} largeur={largeur} hauteur={9999} />
      )}

      {/* Header gradient */}
      <LinearGradient colors={gradients} style={{
        paddingTop: 24, paddingBottom: 18, paddingHorizontal: 20, alignItems: 'center',
      }}>
        <EmojiRebond key={`${cleAnim}-${type}`} emoji={emoji} />
        <Text style={{ fontSize: 11, fontWeight: '900', color: couleurTitre, textAlign: 'center', marginTop: 10, letterSpacing: 1.5 }}>
          {titre}
        </Text>
        <Text style={{ fontSize: 11, color: '#64748b', marginTop: 5 }}>{data.label}</Text>
      </LinearGradient>

      {/* Corps */}
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 18, alignItems: 'center' }}>

        {/* Badge "C'est toi !" */}
        {estLeMemeUser && (
          <View style={{
            backgroundColor: '#fbbf24', borderRadius: 20,
            paddingHorizontal: 16, paddingVertical: 6,
            marginBottom: 14, flexDirection: 'row', alignItems: 'center',
          }}>
            <Text style={{ fontSize: 14, marginRight: 6 }}>🎉</Text>
            <Text style={{ color: '#000', fontWeight: '800', fontSize: 13 }}>C'est toi !</Text>
          </View>
        )}

        {/* Avatar + Nom */}
        <AvatarUtilisateur utilisateur={data.utilisateur} />
        <Text style={{ fontSize: 17, fontWeight: '700', color: c.texte, marginTop: 11, textAlign: 'center' }}>
          {data.utilisateur.nom}
        </Text>

        {/* ROI principal */}
        <View style={{
          backgroundColor: '#0a0f1e',
          borderRadius: 16, paddingVertical: 12, paddingHorizontal: 28,
          marginTop: 14, marginBottom: 14,
          borderWidth: 1.5, borderColor: roiCouleur + '60',
          shadowColor: roiCouleur, shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
        }}>
          <Text style={{ fontSize: 36, fontWeight: '900', color: roiCouleur, textAlign: 'center' }}>
            {roiStr}
          </Text>
          <Text style={{ color: '#475569', fontSize: 11, textAlign: 'center', marginTop: 2 }}>ROI</Text>
        </View>

        {/* KPIs ligne 1 : Profit | Win rate */}
        <View style={{
          flexDirection: 'row', width: '100%',
          backgroundColor: fondKpi, borderRadius: 12,
          borderWidth: 1, borderColor: bordKpi, marginBottom: 8,
        }}>
          <KPI label="Profit net" valeur={profitStr} couleur={profitCouleur} />
          <View style={{ width: 1, backgroundColor: bordKpi, marginVertical: 8 }} />
          <KPI label="Win rate" valeur={winRateStr} couleur="#3b82f6" />
        </View>

        {/* KPIs ligne 2 : Score | Alertes bot (mois) */}
        <View style={{
          flexDirection: 'row', width: '100%',
          backgroundColor: fondKpi, borderRadius: 12,
          borderWidth: 1, borderColor: bordKpi,
        }}>
          <KPI label="Victoires / Défaites" valeur={scoreStr} couleur={c.texte} />
          {!estSemaine && (
            <>
              <View style={{ width: 1, backgroundColor: bordKpi, marginVertical: 8 }} />
              <KPI label="Alertes bot reçues" valeur={data.nbAlertes ?? 0} couleur="#a855f7" />
            </>
          )}
        </View>
      </View>
    </View>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function MopalePalmares({ visible, onFermer, donnees, currentUserId }) {
  const { c, estSombre } = useTheme()
  const { width, height } = useWindowDimensions()
  const flatRef  = useRef(null)
  const [indexActuel, setIndexActuel] = useState(0)
  const [cleAnim, setCleAnim] = useState(0)

  const slides = []
  if (donnees?.semaine !== undefined) slides.push({ type: 'semaine', data: donnees.semaine })
  if (donnees?.mois    !== undefined) slides.push({ type: 'mois',    data: donnees.mois    })

  if (slides.length === 0) return null

  const LARGEUR        = width - 40
  const HAUTEUR_MODALE = Math.min(610, height * 0.87)
  const estDernier     = indexActuel === slides.length - 1

  const allerSlide = (index) => {
    flatRef.current?.scrollToIndex({ index, animated: true })
    setIndexActuel(index)
  }

  const reinitialiser = () => {
    setIndexActuel(0)
    flatRef.current?.scrollToIndex({ index: 0, animated: false })
    setCleAnim(prev => prev + 1)  // Relance confettis + rebond emoji
  }

  const labelBouton = estDernier
    ? 'Fermer'
    : slides[indexActuel + 1]?.type === 'mois'
      ? '👑 Champion du mois'
      : 'Suivant'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onFermer}
      onShow={reinitialiser}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.82)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          width: LARGEUR,
          height: HAUTEUR_MODALE,
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: c.fondModal,
        }}>
          <FlatList
            ref={flatRef}
            data={slides}
            keyExtractor={item => item.type}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: LARGEUR, offset: LARGEUR * index, index })}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / LARGEUR)
              setIndexActuel(index)
            }}
            renderItem={({ item }) => (
              <SlidePalmares
                slide={item}
                largeur={LARGEUR}
                c={c}
                estSombre={estSombre}
                currentUserId={currentUserId}
                cleAnim={cleAnim}
              />
            )}
            style={{ flex: 1 }}
          />

          {/* Footer */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 }}>
            {slides.length > 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
                {slides.map((_, i) => (
                  <View key={i} style={{
                    width: i === indexActuel ? 22 : 8, height: 8, borderRadius: 4,
                    backgroundColor: i === indexActuel ? '#fbbf24' : (estSombre ? '#374151' : '#d1d5db'),
                    marginRight: i < slides.length - 1 ? 6 : 0,
                  }} />
                ))}
              </View>
            )}

            <Pressable
              onPress={estDernier ? onFermer : () => allerSlide(indexActuel + 1)}
              style={({ pressed }) => ({
                backgroundColor: estDernier ? '#16a34a' : '#fbbf24',
                borderRadius: 12, padding: 15,
                alignItems: 'center', opacity: pressed ? 0.85 : 1,
                flexDirection: 'row', justifyContent: 'center',
              })}
            >
              <Text style={{
                color: estDernier ? '#ffffff' : '#000000',
                fontWeight: '700', fontSize: 15, marginRight: 6,
              }}>
                {labelBouton}
              </Text>
              <Ionicons
                name={estDernier ? 'checkmark-circle' : 'arrow-forward'}
                size={18}
                color={estDernier ? '#ffffff' : '#000000'}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
