import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  View, Text, Modal, Pressable, Animated, StyleSheet, SafeAreaView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Path, Circle, ClipPath, Text as SvgText } from 'react-native-svg'
import CarteFUT from './CarteFUT'
import { marquerCarteVue } from '../services/cartesFut'

// ─── Couleurs d'accent par rareté ─────────────────────────────────────────────

const ACCENT = { or: '#ffd740', argent: '#c8c8e8', bronze: '#d48040' }

// Même silhouette que CarteFUT (voir CarteFUT.jsx)
const FORME_DOS = [
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

// ─── Dos de carte (silhouette écusson FUT) ────────────────────────────────────

function DosCarte() {
  const shimmerDos = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerDos, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.delay(2200),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  const shimmerX = shimmerDos.interpolate({ inputRange: [0, 1], outputRange: [-220, 440] })

  return (
    <View style={{
      width: 220, height: 330,
      shadowColor: '#4f6bef',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.6,
      shadowRadius: 18,
      elevation: 16,
    }}>
      <Svg width={220} height={330} viewBox="0 0 220 330">
        <Defs>
          <SvgGradient id="dosBg" x1="0.2" y1="0" x2="0.8" y2="1">
            <Stop offset="0%"   stopColor="#080e20" />
            <Stop offset="50%"  stopColor="#0f2456" />
            <Stop offset="100%" stopColor="#080e20" />
          </SvgGradient>
          <ClipPath id="dosForme">
            <Path d={FORME_DOS} />
          </ClipPath>
        </Defs>

        {/* Fond écusson */}
        <Path d={FORME_DOS} fill="url(#dosBg)" />

        {/* Bordure intérieure */}
        <Path
          d={[
            'M 23,2.5 L 96.5,2.5 Q 104,2.5 110,9.5 Q 116,2.5 123.5,2.5',
            'L 197,2.5 Q 217.5,2.5 217.5,23 L 217.5,254',
            'Q 215.5,280 207,295 Q 194.5,313 175,319 Q 157.5,324 142.5,316',
            'Q 128,310 110,313 Q 92,310 77.5,316 Q 62.5,324 45,319',
            'Q 25.5,313 13,295 Q 4.5,280 2.5,254 L 2.5,23 Q 2.5,2.5 23,2.5 Z',
          ].join(' ')}
          fill="none" stroke="#3b5bdb" strokeWidth="1.5" strokeOpacity="0.5"
        />

        {/* Losanges décoratifs */}
        {[
          { x: 20,  y: 50  }, { x: 160, y: 50  },
          { x: 20,  y: 130 }, { x: 160, y: 130 },
          { x: 20,  y: 210 }, { x: 160, y: 210 },
          { x: 70,  y: 90  }, { x: 110, y: 170 },
        ].map((pos, i) => (
          <Path key={i}
            d={`M ${pos.x + 20},${pos.y} L ${pos.x + 40},${pos.y + 20} L ${pos.x + 20},${pos.y + 40} L ${pos.x},${pos.y + 20} Z`}
            fill="none" stroke="#3b5bdb" strokeWidth="1" strokeOpacity="0.07"
          />
        ))}

        {/* Texte central */}
        <SvgText x="110" y="160" fontSize="44" textAnchor="middle">🎴</SvgText>
        <SvgText x="110" y="192" fontSize="18" fontWeight="900" fill="#4f80ef"
          textAnchor="middle" letterSpacing="3">BET EDGE</SvgText>
        <SvgText x="110" y="207" fontSize="9" fill="#6b86c8"
          textAnchor="middle" letterSpacing="1.5">Carte Trophée</SvgText>
      </Svg>

      {/* Shimmer */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute', top: 0, left: 0,
          width: 220, height: 330,
          transform: [{ translateX: shimmerX }],
        }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(100,140,255,0.22)', 'transparent']}
          start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }}
          style={{ width: 220, height: 330 }}
        />
      </Animated.View>
    </View>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ModaleCarteFUT({ cartes = [], visible, onFermer, avatarUrl }) {
  const [indexCourant,  setIndexCourant]  = useState(0)
  const [estRetourne,   setEstRetourne]   = useState(false)
  const [boutonVisible, setBoutonVisible] = useState(false)

  const overlayOpacite  = useRef(new Animated.Value(0)).current
  const carteTranslateY = useRef(new Animated.Value(400)).current
  const flipScaleX      = useRef(new Animated.Value(1)).current
  const boutonOpacite   = useRef(new Animated.Value(0)).current
  const messageOpacite  = useRef(new Animated.Value(0)).current

  const timeoutsRef = useRef([])

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }

  const carte = cartes[indexCourant]

  const resetAnimCarte = useCallback(() => {
    clearTimeouts()
    setEstRetourne(false)
    setBoutonVisible(false)
    flipScaleX.setValue(1)
    carteTranslateY.setValue(400)
    boutonOpacite.setValue(0)
    messageOpacite.setValue(0)
  }, [])

  const jouerSequence = useCallback((premiereOuverture) => {
    if (premiereOuverture) {
      overlayOpacite.setValue(0)
      Animated.timing(overlayOpacite, {
        toValue: 1, duration: 380, useNativeDriver: true,
      }).start()
    }

    Animated.spring(carteTranslateY, {
      toValue: 0, speed: 9, bounciness: 7, useNativeDriver: true,
    }).start()

    const t1 = setTimeout(() => {
      Animated.timing(flipScaleX, {
        toValue: 0, duration: 400, useNativeDriver: true,
      }).start(() => {
        setEstRetourne(true)
        Animated.timing(flipScaleX, {
          toValue: 1, duration: 400, useNativeDriver: true,
        }).start(() => {
          const t2 = setTimeout(() => {
            Animated.timing(messageOpacite, {
              toValue: 1, duration: 350, useNativeDriver: true,
            }).start()
            const t3 = setTimeout(() => {
              setBoutonVisible(true)
              Animated.timing(boutonOpacite, {
                toValue: 1, duration: 300, useNativeDriver: true,
              }).start()
            }, 500)
            timeoutsRef.current.push(t3)
          }, 350)
          timeoutsRef.current.push(t2)
        })
      })
    }, 1400)
    timeoutsRef.current.push(t1)
  }, [])

  useEffect(() => {
    if (!visible || !carte) return
    resetAnimCarte()
    jouerSequence(indexCourant === 0)
  }, [visible, indexCourant])

  useEffect(() => {
    if (!visible) {
      clearTimeouts()
      setIndexCourant(0)
    }
  }, [visible])

  const passerSuivante = async () => {
    if (carte) await marquerCarteVue(carte.id).catch(() => {})

    if (indexCourant < cartes.length - 1) {
      Animated.timing(carteTranslateY, {
        toValue: -400, duration: 280, useNativeDriver: true,
      }).start(() => setIndexCourant(prev => prev + 1))
    } else {
      clearTimeouts()
      Animated.timing(overlayOpacite, {
        toValue: 0, duration: 280, useNativeDriver: true,
      }).start(onFermer)
    }
  }

  const fermerImmediatement = () => {
    clearTimeouts()
    onFermer()
  }

  if (!visible || !carte) return null

  const couleur = carte.couleur ?? 'bronze'
  const accent  = ACCENT[couleur] ?? '#ffd740'
  const hasNext = indexCourant < cartes.length - 1

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>

      {/* ─── Layer 1 : fond sombre animé (pointerEvents none → ne bloque pas les touches) ─── */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {
          backgroundColor: 'rgba(0,0,0,0.92)',
          opacity: overlayOpacite,
        }]}
      />

      {/* ─── Layer 2 : contenu interactif (opacité fixe = 1) ─── */}
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Barre de tête : points de progression + ✕ ── */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 10,
        }}>
          {/* Points de progression centrés */}
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 7 }}>
            {cartes.map((_, i) => (
              <View key={i} style={{
                width:           i === indexCourant ? 22 : 6,
                height:          6,
                borderRadius:    3,
                backgroundColor: i === indexCourant ? accent : '#2d3748',
              }} />
            ))}
          </View>

          {/* Bouton fermer */}
          <Pressable
            onPress={fermerImmediatement}
            hitSlop={12}
            style={({ pressed }) => ({
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: pressed ? '#1e293b' : 'rgba(15,23,42,0.9)',
              borderWidth: 1,
              borderColor: '#334155',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Ionicons name="close" size={17} color="#64748b" />
          </Pressable>
        </View>

        {/* ── Zone centrale : carte + message + bouton ── */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>

          {/* Carte animée (slide + flip) — tappable après révélation */}
          <Animated.View style={{
            transform: [
              { translateY: carteTranslateY },
              { scaleX: flipScaleX },
            ],
          }}>
            {!estRetourne ? (
              <DosCarte />
            ) : (
              <Pressable onPress={passerSuivante} style={{ borderRadius: 18 }}>
                <CarteFUT carte={carte} avatarUrl={avatarUrl} scale={1} animer />
              </Pressable>
            )}
          </Animated.View>

          {/* Message de félicitations */}
          <Animated.View style={{ marginTop: 24, alignItems: 'center', opacity: messageOpacite }}>
            <Text style={{
              color: accent, fontSize: 17, fontWeight: '800',
              textAlign: 'center', marginBottom: 5,
            }}>
              🎉 Nouvelle carte débloquée !
            </Text>
            <Text style={{
              color: '#94a3b8', fontSize: 12,
              textAlign: 'center', lineHeight: 18, paddingHorizontal: 32,
            }}>
              {carte.raison}
            </Text>
          </Animated.View>

          {/* Hint discret dès la révélation (avant le bouton) */}
          {estRetourne && !boutonVisible && (
            <Text style={{
              marginTop: 20, color: '#3d4f66', fontSize: 12, letterSpacing: 0.5,
            }}>
              Tape la carte pour continuer
            </Text>
          )}

          {/* Bouton stylisé (apparaît après l'animation) */}
          {boutonVisible && (
            <Animated.View style={{ marginTop: 22, opacity: boutonOpacite }}>
              <Pressable
                onPress={passerSuivante}
                style={({ pressed }) => ({
                  backgroundColor: accent,
                  paddingHorizontal: 36, paddingVertical: 14,
                  borderRadius: 30,
                  opacity: pressed ? 0.82 : 1,
                  shadowColor: accent,
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.55,
                  shadowRadius: 14,
                  elevation: 10,
                })}
              >
                <Text style={{ color: '#0a0e1a', fontSize: 15, fontWeight: '800', letterSpacing: 0.4 }}>
                  {hasNext ? `Carte suivante  ${indexCourant + 2}/${cartes.length}` : 'Voir mes trophées'}
                </Text>
              </Pressable>
            </Animated.View>
          )}

        </View>
      </SafeAreaView>
    </Modal>
  )
}
