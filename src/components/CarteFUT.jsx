import React, { useRef, useEffect } from 'react'
import { View, Animated } from 'react-native'
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Rect,
  Circle,
  Path,
  Text as SvgText,
  Image as SvgImage,
  ClipPath,
} from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { TYPES_CARTES } from '../services/cartesFut'

// ─── Palettes par couleur ─────────────────────────────────────────────────────

const PALETTES = {
  or: {
    stops: [
      ['0%',   '#1a0f00'], ['22%', '#6b4400'], ['45%', '#c49200'],
      ['60%',  '#ffe566'], ['75%', '#c49200'], ['88%', '#6b4400'], ['100%', '#1a0f00'],
    ],
    accent:  '#ffd740',
    texte:   '#fff8d6',
    stat:    '#fff3a8',
    label:   '#b8900a',
    shimmer: 'rgba(255,245,150,0.38)',
    ombre:   '#ffd740',
  },
  argent: {
    stops: [
      ['0%',   '#0d0d1a'], ['22%', '#3a3a55'], ['45%', '#8080a0'],
      ['60%',  '#d8d8f0'], ['75%', '#8080a0'], ['88%', '#3a3a55'], ['100%', '#0d0d1a'],
    ],
    accent:  '#c8c8e8',
    texte:   '#eeeeff',
    stat:    '#dcdcf8',
    label:   '#7070a8',
    shimmer: 'rgba(200,200,255,0.32)',
    ombre:   '#c8c8e8',
  },
  bronze: {
    stops: [
      ['0%',   '#1a0800'], ['22%', '#5c2c00'], ['45%', '#a06020'],
      ['60%',  '#d48040'], ['75%', '#a06020'], ['88%', '#5c2c00'], ['100%', '#1a0800'],
    ],
    accent:  '#d48040',
    texte:   '#f8d8a0',
    stat:    '#f0c880',
    label:   '#a05820',
    shimmer: 'rgba(255,190,100,0.32)',
    ombre:   '#d48040',
  },
}

// ─── Forme écusson FUT (viewBox 220×330) ─────────────────────────────────────
// Reproduit fidèlement la silhouette des cartes FUT EA :
//   • Coins hauts arrondis (r≈22)
//   • Petite encoche décorative au centre du bord haut
//   • Côtés légèrement effilés vers le bas
//   • Bas bouclier héraldique : deux pieds arrondis + dépression centrale

const FORME_CARTE = [
  'M 22,0',
  'L 96,0 Q 104,0 110,7 Q 116,0 124,0',
  'L 198,0 Q 220,0 220,22',
  'L 220,255',
  'Q 218,282 209,298',
  'Q 196,316 176,322 Q 158,327 143,319',
  'Q 128,313 110,316',
  'Q 92,313 77,319 Q 62,327 44,322',
  'Q 24,316 11,298',
  'Q 2,282 0,255',
  'L 0,22 Q 0,0 22,0 Z',
].join(' ')

const BORDURE_CARTE = [
  'M 24.5,2.5',
  'L 96.5,2.5 Q 104,2.5 110,10 Q 116,2.5 123.5,2.5',
  'L 195.5,2.5 Q 217.5,2.5 217.5,24.5',
  'L 217.5,254',
  'Q 215.5,280 206,295',
  'Q 193.5,313.5 173.5,319.5 Q 156,324.5 141.5,316.5',
  'Q 128,311 110,313.5',
  'Q 92,311 78.5,316.5 Q 64,324.5 46.5,319.5',
  'Q 26.5,313.5 14,295',
  'Q 4.5,280 2.5,254',
  'L 2.5,24.5 Q 2.5,2.5 24.5,2.5 Z',
].join(' ')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tronquer = (str, max) => {
  if (!str) return ''
  if (str.length <= max) return str
  return str.substring(0, max - 1) + '…'
}

// ─── Composant ───────────────────────────────────────────────────────────────

const CARD_W = 220
const CARD_H = 330

export default function CarteFUT({ carte, avatarUrl, scale = 1, animer = true }) {
  const w = CARD_W * scale
  const h = CARD_H * scale

  const uid = useRef(`fut_${Math.random().toString(36).slice(2, 7)}`).current

  const def     = TYPES_CARTES[carte?.type] ?? {}
  const couleur = carte?.couleur ?? def.couleur ?? 'bronze'
  const titre   = (carte?.titre  ?? def.titre   ?? 'Trophée').toUpperCase()
  const emoji   = carte?.emoji   ?? def.emoji   ?? '🏆'
  const p       = PALETTES[couleur] ?? PALETTES.bronze

  const shimmerAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (!animer) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.delay(2600),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [animer])
  const shimmerX = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-w, w * 2] })

  const rawStats = carte?.statistiques
  const stats    = typeof rawStats === 'string' ? (JSON.parse(rawStats) || {}) : (rawStats ?? {})
  const { roi = 0, winRate = 0, serie = 0, coteMoyenne = 0, profit = 0, nbParis = 0 } = stats
  const roiStr    = `${roi >= 0 ? '+' : ''}${Math.round(roi)}%`
  const profitStr = `${profit >= 0 ? '+' : ''}${Math.round(profit)}€`
  const coteStr   = coteMoyenne > 0 ? coteMoyenne.toFixed(2) : '—'

  const AX = 110
  const AY = 138
  const AR = 40

  return (
    <View style={{
      width:         w,
      height:        h,
      shadowColor:   p.ombre,
      shadowOffset:  { width: 0, height: 6 * scale },
      shadowOpacity: 0.7,
      shadowRadius:  18 * scale,
      elevation:     16,
    }}>
      {/* overflow:hidden + borderRadius approx pour clipper le shimmer */}
      <View style={{ width: w, height: h, borderRadius: 18 * scale, overflow: 'hidden' }}>

        <Svg width={w} height={h} viewBox="0 0 220 330">
          <Defs>

            {/* Gradient de fond métal */}
            <SvgGradient id={`bg_${uid}`} x1="0.15" y1="0" x2="0.85" y2="1">
              {p.stops.map(([offset, color]) => (
                <Stop key={offset} offset={offset} stopColor={color} stopOpacity="1" />
              ))}
            </SvgGradient>

            {/* Clip bouclier pour le fond */}
            <ClipPath id={`forme_${uid}`}>
              <Path d={FORME_CARTE} />
            </ClipPath>

            {/* Clip circulaire pour l'avatar */}
            <ClipPath id={`clip_${uid}`}>
              <Circle cx={AX} cy={AY} r={AR} />
            </ClipPath>

          </Defs>

          {/* ── Fond bouclier ── */}
          <Path d={FORME_CARTE} fill={`url(#bg_${uid})`} />

          {/* ── Contenu clipé à la forme ── */}
          <Rect x="0" y="0" width="220" height="330"
            fill="transparent" clipPath={`url(#forme_${uid})`} />

          {/* ── Bordure intérieure lumineuse (forme bouclier) ── */}
          <Path d={BORDURE_CARTE}
            fill="none" stroke={p.accent} strokeWidth="1.8" strokeOpacity="0.45" />

          {/* Filet or décoratif supplémentaire (coin haut droit) */}
          <Path d="M 170,2 Q 218,2 218,20 L 218,50" fill="none" stroke={p.accent} strokeWidth="0.6" strokeOpacity="0.25" />
          <Path d="M 50,2 Q 2,2 2,20 L 2,50"        fill="none" stroke={p.accent} strokeWidth="0.6" strokeOpacity="0.25" />

          {/* ══ EN-TÊTE ══════════════════════════════════════════════════════ */}

          <SvgText x="14" y="50" fontSize="42" fontWeight="900" fill={p.accent}>
            {carte?.note ?? 60}
          </SvgText>
          <SvgText x="14" y="61" fontSize="7.5" fontWeight="700"
            fill={p.accent} opacity="0.72" letterSpacing="1.5">
            {couleur.toUpperCase()}
          </SvgText>

          <SvgText x="206" y="34" fontSize="24" textAnchor="end">{emoji}</SvgText>
          <SvgText x="206" y="47" fontSize="6.5" fontWeight="700"
            fill={p.accent} opacity="0.62" textAnchor="end" letterSpacing="1.2">
            BETEDGE
          </SvgText>

          <Rect x="12" y="68" width="196" height="0.8" fill={p.accent} opacity="0.38" />

          {/* ══ AVATAR ═══════════════════════════════════════════════════════ */}

          <Circle cx={AX} cy={AY} r="47" fill={p.accent} opacity="0.07" />
          <Circle cx={AX} cy={AY} r="44" fill={p.accent} opacity="0.09" />
          <Circle cx={AX} cy={AY} r={AR} fill="#080812" />

          {avatarUrl ? (
            <SvgImage
              href={avatarUrl}
              x={AX - AR} y={AY - AR}
              width={AR * 2} height={AR * 2}
              clipPath={`url(#clip_${uid})`}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            <SvgText x={AX} y={AY + 14} fontSize="34" textAnchor="middle">{emoji}</SvgText>
          )}

          <Circle cx={AX} cy={AY} r={AR} fill="none" stroke={p.accent} strokeWidth="2.5" />

          {/* ══ TITRE ════════════════════════════════════════════════════════ */}

          <SvgText x="110" y="200" fontSize="11.5" fontWeight="900"
            fill={p.texte} textAnchor="middle" letterSpacing="1.8">
            {tronquer(titre, 22)}
          </SvgText>

          <SvgText x="110" y="214" fontSize="8" fontWeight="600"
            fill={p.accent} opacity="0.88" textAnchor="middle">
            {tronquer(carte?.raison ?? '', 40)}
          </SvgText>

          {/* ══ ZONE STATS ═══════════════════════════════════════════════════ */}

          <Rect x="12" y="221" width="196" height="0.6" fill={p.accent} opacity="0.22" />

          <SvgText x="37"  y="239" fontSize="13" fontWeight="800" fill={p.stat} textAnchor="middle">{roiStr}</SvgText>
          <SvgText x="110" y="239" fontSize="13" fontWeight="800" fill={p.stat} textAnchor="middle">{Math.round(winRate)}%</SvgText>
          <SvgText x="183" y="239" fontSize="13" fontWeight="800" fill={p.stat} textAnchor="middle">{serie}</SvgText>

          <SvgText x="37"  y="249" fontSize="7.5" fontWeight="600" fill={p.label} textAnchor="middle" letterSpacing="0.4">ROI</SvgText>
          <SvgText x="110" y="249" fontSize="7.5" fontWeight="600" fill={p.label} textAnchor="middle" letterSpacing="0.4">V%</SvgText>
          <SvgText x="183" y="249" fontSize="7.5" fontWeight="600" fill={p.label} textAnchor="middle" letterSpacing="0.4">SÉR</SvgText>

          <Rect x="73"  y="226" width="0.8" height="26" fill={p.accent} opacity="0.28" />
          <Rect x="147" y="226" width="0.8" height="26" fill={p.accent} opacity="0.28" />

          <Rect x="20" y="254" width="180" height="0.5" fill={p.accent} opacity="0.16" />

          <SvgText x="37"  y="272" fontSize="13" fontWeight="800" fill={p.stat} textAnchor="middle">{nbParis}</SvgText>
          <SvgText x="110" y="272" fontSize="13" fontWeight="800" fill={p.stat} textAnchor="middle">{coteStr}</SvgText>
          <SvgText x="183" y="272" fontSize="12" fontWeight="800" fill={p.stat} textAnchor="middle">{profitStr}</SvgText>

          <SvgText x="37"  y="282" fontSize="7.5" fontWeight="600" fill={p.label} textAnchor="middle" letterSpacing="0.4">PAR</SvgText>
          <SvgText x="110" y="282" fontSize="7.5" fontWeight="600" fill={p.label} textAnchor="middle" letterSpacing="0.4">COT</SvgText>
          <SvgText x="183" y="282" fontSize="7.5" fontWeight="600" fill={p.label} textAnchor="middle" letterSpacing="0.4">PRO</SvgText>

          <Rect x="73"  y="258" width="0.8" height="28" fill={p.accent} opacity="0.28" />
          <Rect x="147" y="258" width="0.8" height="28" fill={p.accent} opacity="0.28" />

          {/* ══ FOOTER BET EDGE ══════════════════════════════════════════════ */}

          <Rect x="88"  y="295" width="14" height="0.8" fill={p.accent} opacity="0.38" />
          <SvgText x="110" y="304" fontSize="6.5" fontWeight="700"
            fill={p.accent} textAnchor="middle" opacity="0.58" letterSpacing="2.5">
            BET EDGE
          </SvgText>
          <Rect x="118" y="295" width="14" height="0.8" fill={p.accent} opacity="0.38" />

        </Svg>

        {/* ─── Shimmer overlay ─── */}
        {animer && (
          <Animated.View
            pointerEvents="none"
            style={{
              position:  'absolute',
              top: 0, left: 0,
              width:     w,
              height:    h,
              transform: [{ translateX: shimmerX }],
            }}
          >
            <LinearGradient
              colors={['transparent', p.shimmer, 'transparent']}
              start={{ x: 0, y: 0.15 }}
              end={{ x: 1, y: 0.85 }}
              style={{ width: w, height: h }}
            />
          </Animated.View>
        )}

      </View>
    </View>
  )
}
