import React, { useRef, useEffect } from 'react'
import { View, Animated } from 'react-native'
import Svg, {
  Defs, LinearGradient as SvgGradient, Stop, Rect, Circle,
  Path, Text as SvgText, Image as SvgImage, ClipPath,
} from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'

// ─── Couleurs officielles des équipes ────────────────────────────────────────

export const EQUIPES_PERSO = {
  'PSG':         { sombre: '#000e2a', moyen: '#002a5c', vive: '#004d8a', accent: '#da291c' },
  'Marseille':   { sombre: '#052a36', moyen: '#0e7494', vive: '#2cbfeb', accent: '#ffffff' },
  'Real Madrid': { sombre: '#00133a', moyen: '#003080', vive: '#004db8', accent: '#d4af37' },
  'Barcelone':   { sombre: '#1a0020', moyen: '#5a0020', vive: '#a50044', accent: '#004d98' },
  'Man. City':   { sombre: '#0d2236', moyen: '#1a4d7a', vive: '#6cabdd', accent: '#ffffff' },
  'Man. United': { sombre: '#3d0008', moyen: '#8a0010', vive: '#da291c', accent: '#fbe122' },
  'Liverpool':   { sombre: '#3d0008', moyen: '#8b0014', vive: '#c8102e', accent: '#00b2a9' },
  'Arsenal':     { sombre: '#3d0000', moyen: '#8a0000', vive: '#ef0107', accent: '#9c824a' },
  'Chelsea':     { sombre: '#010e2a', moyen: '#012456', vive: '#034694', accent: '#dba111' },
  'Tottenham':   { sombre: '#080f24', moyen: '#0e1e48', vive: '#132257', accent: '#ffffff' },
  'Bayern':      { sombre: '#3d0008', moyen: '#8b000e', vive: '#dc052d', accent: '#0066b2' },
  'Dortmund':    { sombre: '#1a1600', moyen: '#3d3600', vive: '#fde100', accent: '#000000' },
  'Juventus':    { sombre: '#080808', moyen: '#181818', vive: '#282828', accent: '#ffffff' },
  'AC Milan':    { sombre: '#1a0000', moyen: '#4f0000', vive: '#af0000', accent: '#000000' },
  'Inter Milan': { sombre: '#000014', moyen: '#00194c', vive: '#003d9b', accent: '#6babdb' },
  'Atletico':    { sombre: '#2a0205', moyen: '#6b0e14', vive: '#cb3524', accent: '#ffffff' },
  'Monaco':      { sombre: '#3d0008', moyen: '#8a0010', vive: '#e8002d', accent: '#ffffff' },
  'Lyon':        { sombre: '#000a2e', moyen: '#001a6b', vive: '#0033a0', accent: '#cc0000' },
  'Lille':       { sombre: '#1e0008', moyen: '#5c001a', vive: '#c41e3a', accent: '#ffffff' },
  'Naples':      { sombre: '#032636', moyen: '#075c78', vive: '#12b0e8', accent: '#ffffff' },
}

const PALETTE_DEFAUT = { sombre: '#090f1e', moyen: '#1a2a4a', vive: '#2d4a7a', accent: '#4f8ef7' }

// ─── Forme écusson (identique à CarteFUT) ────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const tronquer = (str, max) =>
  (!str || str.length <= max) ? (str ?? '') : str.substring(0, max - 1) + '…'

const LABELS_STATS = {
  roi: 'ROI', winRate: 'V%', profit: 'PROFIT',
  nbParis: 'PARIS', serie: 'SERIE', coteMoyenne: 'COTE',
  nbGagnes: 'VICTOIRES', miseMoyenne: 'MISE',
}

const formaterStat = (cle, valeur) => {
  if (valeur == null) return '—'
  switch (cle) {
    case 'roi':         return `${valeur >= 0 ? '+' : ''}${Math.round(valeur)}%`
    case 'winRate':     return `${Math.round(valeur)}%`
    case 'profit':      return `${valeur >= 0 ? '+' : ''}${Math.round(valeur)}€`
    case 'coteMoyenne': return valeur > 0 ? valeur.toFixed(2) : '—'
    case 'miseMoyenne': return `${Math.round(valeur)}€`
    default:            return String(Math.round(valeur))
  }
}

// ─── Composant ───────────────────────────────────────────────────────────────

const CARD_W = 220
const CARD_H = 330

export default function CarteFUTPerso({
  titre, nomEquipe, stats = {}, statsAffichees = [],
  avatarUrl, note = 70, scale = 1, animer = true,
}) {
  const w = CARD_W * scale
  const h = CARD_H * scale
  const uid = useRef(`perso_${Math.random().toString(36).slice(2, 7)}`).current

  const palette = EQUIPES_PERSO[nomEquipe] ?? PALETTE_DEFAUT
  const { sombre, moyen, vive, accent } = palette

  const titreMaj = (titre || 'MA CARTE').toUpperCase()
  const initiales = titreMaj.split(' ').slice(0, 2).map(m => m[0] ?? '').join('')

  const shimmerAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (!animer) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.delay(2400),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [animer])
  const shimmerX = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-w, w * 2] })

  const statsLigne1 = statsAffichees.slice(0, 3)
  const statsLigne2 = statsAffichees.slice(3, 6)

  const AX = 110
  const AY = 138
  const AR = 40

  return (
    <View style={{
      width: w, height: h,
      shadowColor: vive,
      shadowOffset: { width: 0, height: 6 * scale },
      shadowOpacity: 0.6,
      shadowRadius: 16 * scale,
      elevation: 14,
    }}>
      <View style={{ width: w, height: h, borderRadius: 18 * scale, overflow: 'hidden' }}>
        <Svg width={w} height={h} viewBox="0 0 220 330">
          <Defs>
            <SvgGradient id={`bg_${uid}`} x1="0.15" y1="0" x2="0.85" y2="1">
              <Stop offset="0%"   stopColor={sombre} />
              <Stop offset="30%"  stopColor={moyen}  />
              <Stop offset="55%"  stopColor={vive}   />
              <Stop offset="75%"  stopColor={moyen}  />
              <Stop offset="100%" stopColor={sombre} />
            </SvgGradient>
            <ClipPath id={`forme_${uid}`}><Path d={FORME_CARTE} /></ClipPath>
            <ClipPath id={`clip_${uid}`}><Circle cx={AX} cy={AY} r={AR} /></ClipPath>
          </Defs>

          {/* Fond + bordure */}
          <Path d={FORME_CARTE} fill={`url(#bg_${uid})`} />
          <Path d={BORDURE_CARTE} fill="none" stroke={accent} strokeWidth="1.8" strokeOpacity="0.4" />
          <Path d="M 170,2 Q 218,2 218,20 L 218,50" fill="none" stroke={accent} strokeWidth="0.6" strokeOpacity="0.2" />
          <Path d="M 50,2 Q 2,2 2,20 L 2,50"        fill="none" stroke={accent} strokeWidth="0.6" strokeOpacity="0.2" />

          {/* ── EN-TÊTE ── */}
          <SvgText x="14" y="50" fontSize="42" fontWeight="900" fill={accent} opacity="0.9">
            {note}
          </SvgText>
          <SvgText x="14" y="61" fontSize="7.5" fontWeight="700" fill={accent} opacity="0.65" letterSpacing="1.5">
            PERSO
          </SvgText>
          <SvgText x="206" y="47" fontSize="6.5" fontWeight="700" fill={accent} opacity="0.6" textAnchor="end" letterSpacing="1.2">
            BETEDGE
          </SvgText>
          <Rect x="12" y="68" width="196" height="0.8" fill={accent} opacity="0.3" />

          {/* ── AVATAR ── */}
          <Circle cx={AX} cy={AY} r="47" fill={accent} opacity="0.05" />
          <Circle cx={AX} cy={AY} r={AR} fill={sombre} opacity="0.85" />
          {avatarUrl ? (
            <SvgImage
              href={avatarUrl}
              x={AX - AR} y={AY - AR}
              width={AR * 2} height={AR * 2}
              clipPath={`url(#clip_${uid})`}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            <SvgText x={AX} y={AY + 9} fontSize="22" fontWeight="900"
              fill={accent} textAnchor="middle" letterSpacing="2">
              {initiales}
            </SvgText>
          )}
          <Circle cx={AX} cy={AY} r={AR} fill="none" stroke={accent} strokeWidth="2" strokeOpacity="0.7" />

          {/* ── TITRE + ÉQUIPE ── */}
          <SvgText x="110" y="200" fontSize="11.5" fontWeight="900"
            fill="#ffffff" textAnchor="middle" letterSpacing="1.8">
            {tronquer(titreMaj, 22)}
          </SvgText>
          {nomEquipe && (
            <SvgText x="110" y="213" fontSize="7.5" fontWeight="600"
              fill={accent} opacity="0.8" textAnchor="middle">
              {tronquer(nomEquipe, 28)}
            </SvgText>
          )}

          {/* ── STATS LIGNE 1 ── */}
          <Rect x="12" y="221" width="196" height="0.6" fill={accent} opacity="0.2" />
          {statsLigne1.map((cle, i) => {
            const x = i === 0 ? 37 : i === 1 ? 110 : 183
            return (
              <React.Fragment key={cle}>
                <SvgText x={x} y="239" fontSize="13" fontWeight="800" fill="#ffffff" textAnchor="middle">
                  {formaterStat(cle, stats[cle])}
                </SvgText>
                <SvgText x={x} y="249" fontSize="7" fontWeight="600"
                  fill={accent} opacity="0.75" textAnchor="middle" letterSpacing="0.3">
                  {LABELS_STATS[cle] ?? cle.toUpperCase()}
                </SvgText>
              </React.Fragment>
            )
          })}
          {statsLigne1.length >= 2 && <Rect x="73"  y="226" width="0.8" height="26" fill={accent} opacity="0.22" />}
          {statsLigne1.length >= 3 && <Rect x="147" y="226" width="0.8" height="26" fill={accent} opacity="0.22" />}

          {/* ── STATS LIGNE 2 ── */}
          {statsLigne2.length > 0 && (
            <React.Fragment>
              <Rect x="20" y="254" width="180" height="0.5" fill={accent} opacity="0.14" />
              {statsLigne2.map((cle, i) => {
                const x = i === 0 ? 37 : i === 1 ? 110 : 183
                return (
                  <React.Fragment key={cle}>
                    <SvgText x={x} y="272" fontSize="13" fontWeight="800" fill="#ffffff" textAnchor="middle">
                      {formaterStat(cle, stats[cle])}
                    </SvgText>
                    <SvgText x={x} y="282" fontSize="7" fontWeight="600"
                      fill={accent} opacity="0.75" textAnchor="middle" letterSpacing="0.3">
                      {LABELS_STATS[cle] ?? cle.toUpperCase()}
                    </SvgText>
                  </React.Fragment>
                )
              })}
              {statsLigne2.length >= 2 && <Rect x="73"  y="258" width="0.8" height="28" fill={accent} opacity="0.22" />}
              {statsLigne2.length >= 3 && <Rect x="147" y="258" width="0.8" height="28" fill={accent} opacity="0.22" />}
            </React.Fragment>
          )}

          {/* ── FOOTER ── */}
          <Rect x="88"  y="295" width="14" height="0.8" fill={accent} opacity="0.3" />
          <SvgText x="110" y="304" fontSize="6.5" fontWeight="700"
            fill={accent} textAnchor="middle" opacity="0.55" letterSpacing="2.5">
            BET EDGE
          </SvgText>
          <Rect x="118" y="295" width="14" height="0.8" fill={accent} opacity="0.3" />
        </Svg>

        {/* Shimmer */}
        {animer && (
          <Animated.View pointerEvents="none" style={{
            position: 'absolute', top: 0, left: 0, width: w, height: h,
            transform: [{ translateX: shimmerX }],
          }}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.15)', 'transparent']}
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
