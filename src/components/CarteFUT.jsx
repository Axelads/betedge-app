import React, { useRef, useEffect } from 'react'
import { View, Text, Image, Animated } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { TYPES_CARTES } from '../services/cartesFut'

// ─── Constantes visuelles ─────────────────────────────────────────────────────

const CARD_W = 220
const CARD_H = 330

const GRADIENTS = {
  or: {
    fond:    ['#1a0f00', '#6b4400', '#c49200', '#ffe566', '#c49200', '#6b4400', '#1a0f00'],
    bordure: '#ffd740',
    accent:  '#ffd740',
    texte:   '#fff8d6',
    stat:    '#fff3a8',
    label:   '#b8900a',
    shimmer: 'rgba(255, 245, 150, 0.35)',
  },
  argent: {
    fond:    ['#0d0d1a', '#3a3a55', '#8080a0', '#d8d8f0', '#8080a0', '#3a3a55', '#0d0d1a'],
    bordure: '#c8c8e8',
    accent:  '#c8c8e8',
    texte:   '#eeeeff',
    stat:    '#dcdcf8',
    label:   '#7070a8',
    shimmer: 'rgba(200, 200, 255, 0.30)',
  },
  bronze: {
    fond:    ['#1a0800', '#5c2c00', '#a06020', '#d48040', '#a06020', '#5c2c00', '#1a0800'],
    bordure: '#d48040',
    accent:  '#d48040',
    texte:   '#f8d8a0',
    stat:    '#f0c880',
    label:   '#a05820',
    shimmer: 'rgba(255, 190, 100, 0.30)',
  },
}

// ─── Sous-composant stat ──────────────────────────────────────────────────────

function StatItem({ label, valeur, scale, couleurValeur, couleurLabel }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{
        color:      couleurValeur,
        fontSize:   13 * scale,
        fontWeight: '800',
        lineHeight: 16 * scale,
      }}>
        {valeur}
      </Text>
      <Text style={{
        color:       couleurLabel,
        fontSize:    8 * scale,
        fontWeight:  '600',
        letterSpacing: 0.6,
        marginTop:   1 * scale,
      }}>
        {label}
      </Text>
    </View>
  )
}

function Separateur({ scale, couleur }) {
  return (
    <View style={{
      width:           1 * scale,
      marginVertical:  2 * scale,
      backgroundColor: couleur,
      opacity:         0.35,
    }} />
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CarteFUT({ carte, avatarUrl, scale = 1, animer = true }) {
  const w = CARD_W * scale
  const h = CARD_H * scale

  const def    = TYPES_CARTES[carte?.type] ?? {}
  const couleur = carte?.couleur ?? def.couleur ?? 'bronze'
  const titre   = carte?.titre   ?? def.titre   ?? 'Trophée'
  const emoji   = carte?.emoji   ?? def.emoji   ?? '🏆'
  const palette = GRADIENTS[couleur] ?? GRADIENTS.bronze

  const shimmerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!animer) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.delay(2800),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [animer])

  const shimmerX = shimmerAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-w, w * 2],
  })

  // Désérialiser les stats si stockées en JSON string
  const rawStats = carte?.statistiques
  const stats = typeof rawStats === 'string' ? (JSON.parse(rawStats) || {}) : (rawStats ?? {})
  const { roi = 0, winRate = 0, serie = 0, coteMoyenne = 0, profit = 0, nbParis = 0 } = stats

  const roiLabel   = `${roi >= 0 ? '+' : ''}${Math.round(roi)}%`
  const profitLabel = `${profit >= 0 ? '+' : ''}${Math.round(profit)}€`

  const statsLigne1 = [
    { label: 'ROI',  valeur: roiLabel },
    { label: 'V%',   valeur: `${Math.round(winRate)}%` },
    { label: 'SÉR',  valeur: `${serie}` },
  ]
  const statsLigne2 = [
    { label: 'PAR',  valeur: `${nbParis}` },
    { label: 'COT',  valeur: coteMoyenne > 0 ? coteMoyenne.toFixed(2) : '—' },
    { label: 'PRO',  valeur: profitLabel },
  ]

  return (
    <View style={{
      width:        w,
      height:       h,
      borderRadius: 14 * scale,
      overflow:     'hidden',
      shadowColor:  palette.accent,
      shadowOffset: { width: 0, height: 5 * scale },
      shadowOpacity: 0.65,
      shadowRadius: 14 * scale,
      elevation:    14,
    }}>
      <LinearGradient
        colors={palette.fond}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* ─── Bordure intérieure lumineuse ─── */}
        <View style={{
          position:     'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: 14 * scale,
          borderWidth:  1.5 * scale,
          borderColor:  palette.accent,
          opacity:      0.35,
        }} />

        <View style={{ flex: 1, padding: 11 * scale }}>

          {/* ─── En-tête : note + emoji ─── */}
          <View style={{
            flexDirection:  'row',
            justifyContent: 'space-between',
            alignItems:     'flex-start',
            marginBottom:   4 * scale,
          }}>
            {/* Note (comme l'OVR FUT) */}
            <View>
              <Text style={{
                color:       palette.accent,
                fontSize:    42 * scale,
                fontWeight:  '900',
                lineHeight:  46 * scale,
                includeFontPadding: false,
              }}>
                {carte?.note ?? 60}
              </Text>
              <Text style={{
                color:         palette.accent,
                fontSize:      8 * scale,
                fontWeight:    '700',
                letterSpacing: 1.5,
                opacity:       0.75,
                marginTop:     -2 * scale,
              }}>
                {couleur.toUpperCase()}
              </Text>
            </View>

            {/* Emoji + label type */}
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 24 * scale, lineHeight: 30 * scale }}>{emoji}</Text>
              <Text style={{
                color:         palette.accent,
                fontSize:      7 * scale,
                fontWeight:    '700',
                letterSpacing: 1,
                opacity:       0.65,
                marginTop:     2 * scale,
              }}>
                BETEDGE
              </Text>
            </View>
          </View>

          {/* ─── Ligne séparatrice ─── */}
          <View style={{
            height:          1 * scale,
            backgroundColor: palette.accent,
            opacity:         0.4,
            marginBottom:    9 * scale,
          }} />

          {/* ─── Avatar circulaire ─── */}
          <View style={{ alignItems: 'center', marginBottom: 9 * scale }}>
            <View style={{
              width:        82 * scale,
              height:       82 * scale,
              borderRadius: 41 * scale,
              borderWidth:  2.5 * scale,
              borderColor:  palette.accent,
              overflow:     'hidden',
              backgroundColor: '#0a0a18',
              shadowColor:  palette.accent,
              shadowOpacity: 0.75,
              shadowRadius: 8 * scale,
              shadowOffset: { width: 0, height: 0 },
            }}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={['#1e3a5f', '#0a0a18']}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 32 * scale }}>{emoji}</Text>
                </LinearGradient>
              )}
            </View>
          </View>

          {/* ─── Titre et raison ─── */}
          <Text style={{
            color:          palette.texte,
            fontSize:       12 * scale,
            fontWeight:     '900',
            textAlign:      'center',
            letterSpacing:  1.8,
            textTransform:  'uppercase',
            marginBottom:   3 * scale,
          }} numberOfLines={1}>
            {titre}
          </Text>

          <Text style={{
            color:          palette.accent,
            fontSize:       8.5 * scale,
            fontWeight:     '600',
            textAlign:      'center',
            opacity:        0.85,
            marginBottom:   8 * scale,
            lineHeight:     12 * scale,
          }} numberOfLines={2}>
            {carte?.raison ?? ''}
          </Text>

          {/* ─── Ligne séparatrice ─── */}
          <View style={{
            height:          1 * scale,
            backgroundColor: palette.accent,
            opacity:         0.25,
            marginBottom:    8 * scale,
          }} />

          {/* ─── Stats ligne 1 ─── */}
          <View style={{ flexDirection: 'row', marginBottom: 4 * scale }}>
            {statsLigne1.map((s, i) => (
              <React.Fragment key={s.label}>
                <StatItem
                  {...s}
                  scale={scale}
                  couleurValeur={palette.stat}
                  couleurLabel={palette.label}
                />
                {i < 2 && <Separateur scale={scale} couleur={palette.accent} />}
              </React.Fragment>
            ))}
          </View>

          {/* ─── Séparateur horizontal fin entre les deux lignes de stats ─── */}
          <View style={{
            height:          0.5 * scale,
            backgroundColor: palette.accent,
            opacity:         0.2,
            marginVertical:  3 * scale,
            marginHorizontal: 8 * scale,
          }} />

          {/* ─── Stats ligne 2 ─── */}
          <View style={{ flexDirection: 'row', marginBottom: 6 * scale }}>
            {statsLigne2.map((s, i) => (
              <React.Fragment key={s.label}>
                <StatItem
                  {...s}
                  scale={scale}
                  couleurValeur={palette.stat}
                  couleurLabel={palette.label}
                />
                {i < 2 && <Separateur scale={scale} couleur={palette.accent} />}
              </React.Fragment>
            ))}
          </View>

          {/* ─── Footer BetEdge ─── */}
          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 * scale }}>
              <View style={{
                width:           18 * scale,
                height:          0.8 * scale,
                backgroundColor: palette.accent,
                opacity:         0.4,
              }} />
              <Text style={{
                color:         palette.accent,
                fontSize:      6.5 * scale,
                fontWeight:    '700',
                letterSpacing: 2.5,
                opacity:       0.6,
              }}>
                BET EDGE
              </Text>
              <View style={{
                width:           18 * scale,
                height:          0.8 * scale,
                backgroundColor: palette.accent,
                opacity:         0.4,
              }} />
            </View>
          </View>

        </View>

        {/* ─── Shimmer animé ─── */}
        {animer && (
          <Animated.View
            pointerEvents="none"
            style={{
              position:  'absolute',
              top:       0,
              left:      0,
              width:     w,
              height:    h,
              transform: [{ translateX: shimmerX }],
            }}
          >
            <LinearGradient
              colors={['transparent', palette.shimmer, 'transparent']}
              start={{ x: 0, y: 0.15 }}
              end={{ x: 1, y: 0.85 }}
              style={{ width: w, height: h }}
            />
          </Animated.View>
        )}

      </LinearGradient>
    </View>
  )
}
