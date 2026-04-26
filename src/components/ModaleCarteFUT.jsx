import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  View, Text, Modal, Pressable, Animated, useWindowDimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import CarteFUT from './CarteFUT'
import { marquerCarteVue } from '../services/cartesFut'

// ─── Palette dos de carte ─────────────────────────────────────────────────────

const DOS_GRADIENT = ['#080e20', '#0f2456', '#080e20']

const ACCENT_PAR_COULEUR = {
  or:     '#ffd740',
  argent: '#c8c8e8',
  bronze: '#d48040',
}

// ─── Dos de la carte (face cachée style "pack FUT") ──────────────────────────

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

  const shimmerX = shimmerDos.interpolate({
    inputRange:  [0, 1],
    outputRange: [-220, 440],
  })

  return (
    <View style={{
      width: 220, height: 330,
      borderRadius: 14,
      overflow: 'hidden',
      shadowColor: '#4f6bef',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.6,
      shadowRadius: 18,
      elevation: 16,
    }}>
      <LinearGradient
        colors={DOS_GRADIENT}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Bordure intérieure */}
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: '#3b5bdb',
          opacity: 0.5,
        }} />

        {/* Motif de fond (losanges décalés) */}
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={{
              position:   'absolute',
              width:       40,
              height:      40,
              borderRadius: 4,
              borderWidth:  1,
              borderColor: '#3b5bdb',
              opacity:     0.07,
              transform:   [{ rotate: '45deg' }],
              top:         (i % 4) * 75 + 20,
              left:        Math.floor(i / 4) * 120 + 20,
            }}
          />
        ))}

        {/* Logo central */}
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 52 }}>🎴</Text>
          <Text style={{
            color:         '#4f80ef',
            fontSize:      24,
            fontWeight:    '900',
            letterSpacing: 3,
          }}>
            BET EDGE
          </Text>
          <Text style={{
            color:         '#6b86c8',
            fontSize:      11,
            letterSpacing: 1.5,
            marginTop:     -4,
          }}>
            Carte Trophée
          </Text>
        </View>

        {/* Shimmer */}
        <Animated.View
          pointerEvents="none"
          style={{
            position:  'absolute',
            top:       0,
            left:      0,
            width:     220,
            height:    330,
            transform: [{ translateX: shimmerX }],
          }}
        >
          <LinearGradient
            colors={['transparent', 'rgba(100, 140, 255, 0.22)', 'transparent']}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 0.8 }}
            style={{ width: 220, height: 330 }}
          />
        </Animated.View>
      </LinearGradient>
    </View>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ModaleCarteFUT({ cartes = [], visible, onFermer, avatarUrl }) {
  const { width: ecranW } = useWindowDimensions()

  const [indexCourant,  setIndexCourant]  = useState(0)
  const [estRetourne,   setEstRetourne]   = useState(false)
  const [boutonVisible, setBoutonVisible] = useState(false)

  // Refs d'animation
  const overlayOpacite  = useRef(new Animated.Value(0)).current
  const carteTranslateY = useRef(new Animated.Value(400)).current
  const flipScaleX      = useRef(new Animated.Value(1)).current
  const boutonOpacite   = useRef(new Animated.Value(0)).current
  const messageOpacite  = useRef(new Animated.Value(0)).current

  const carte = cartes[indexCourant]

  // ─── Reset des valeurs d'animation pour chaque nouvelle carte ───────────────

  const resetAnimCarte = useCallback(() => {
    setEstRetourne(false)
    setBoutonVisible(false)
    flipScaleX.setValue(1)
    carteTranslateY.setValue(400)
    boutonOpacite.setValue(0)
    messageOpacite.setValue(0)
  }, [])

  // ─── Séquence d'animation : dos → flip → face ───────────────────────────────

  const jouerSequence = useCallback((premiereOuverture = false) => {
    const animations = []

    if (premiereOuverture) {
      overlayOpacite.setValue(0)
      animations.push(
        Animated.timing(overlayOpacite, { toValue: 1, duration: 380, useNativeDriver: true })
      )
    }

    // Carte glisse du bas
    Animated.spring(carteTranslateY, {
      toValue:     0,
      speed:       9,
      bounciness:  7,
      useNativeDriver: true,
    }).start()

    // Flip après 1.4 s
    setTimeout(() => {
      // Phase 1 : scaleX 1 → 0 (carte disparaît de côté)
      Animated.timing(flipScaleX, {
        toValue:  0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setEstRetourne(true)  // on bascule sur la face avant

        // Phase 2 : scaleX 0 → 1 (face avant apparaît)
        Animated.timing(flipScaleX, {
          toValue:  1,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          // Message puis bouton
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(messageOpacite, { toValue: 1, duration: 350, useNativeDriver: true }),
            ]).start()
            setTimeout(() => {
              setBoutonVisible(true)
              Animated.timing(boutonOpacite, { toValue: 1, duration: 300, useNativeDriver: true }).start()
            }, 500)
          }, 350)
        })
      })
    }, 1400)
  }, [])

  // ─── Déclenche l'animation à chaque nouvelle carte ──────────────────────────

  useEffect(() => {
    if (!visible || !carte) return
    resetAnimCarte()
    jouerSequence(indexCourant === 0)
  }, [visible, indexCourant])

  // ─── Reset de l'index quand la modale se ferme ──────────────────────────────

  useEffect(() => {
    if (!visible) setIndexCourant(0)
  }, [visible])

  // ─── Passer à la carte suivante ou fermer ────────────────────────────────────

  const passerSuivante = async () => {
    if (carte) await marquerCarteVue(carte.id)

    if (indexCourant < cartes.length - 1) {
      // Slide la carte vers le haut avant d'afficher la suivante
      Animated.timing(carteTranslateY, {
        toValue:  -400,
        duration: 280,
        useNativeDriver: true,
      }).start(() => setIndexCourant(prev => prev + 1))
    } else {
      // Fermeture
      Animated.timing(overlayOpacite, {
        toValue:  0,
        duration: 280,
        useNativeDriver: true,
      }).start(onFermer)
    }
  }

  if (!visible || !carte) return null

  const couleur = carte.couleur ?? 'bronze'
  const accent  = ACCENT_PAR_COULEUR[couleur] ?? '#ffd740'
  const hasNext = indexCourant < cartes.length - 1

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={{
        flex:            1,
        backgroundColor: 'rgba(0, 0, 0, 0.90)',
        alignItems:      'center',
        justifyContent:  'center',
        opacity:         overlayOpacite,
      }}>

        {/* ─── Compteur (si plusieurs cartes) ─── */}
        {cartes.length > 1 && (
          <View style={{
            flexDirection:   'row',
            alignItems:      'center',
            gap:             6,
            marginBottom:    14,
          }}>
            {cartes.map((_, i) => (
              <View
                key={i}
                style={{
                  width:           i === indexCourant ? 20 : 6,
                  height:          6,
                  borderRadius:    3,
                  backgroundColor: i === indexCourant ? accent : '#334155',
                }}
              />
            ))}
          </View>
        )}

        {/* ─── Carte (animée : slide + flip) ─── */}
        <Animated.View style={{
          transform: [
            { translateY: carteTranslateY },
            { scaleX:     flipScaleX },
          ],
        }}>
          {!estRetourne ? (
            <DosCarte />
          ) : (
            <CarteFUT
              carte={carte}
              avatarUrl={avatarUrl}
              scale={1}
              animer={true}
            />
          )}
        </Animated.View>

        {/* ─── Message de félicitations ─── */}
        <Animated.View style={{
          marginTop: 22,
          alignItems: 'center',
          opacity:    messageOpacite,
        }}>
          <Text style={{
            color:      accent,
            fontSize:   17,
            fontWeight: '800',
            textAlign:  'center',
            marginBottom: 5,
          }}>
            🎉 Nouvelle carte débloquée !
          </Text>
          <Text style={{
            color:       '#94a3b8',
            fontSize:    12,
            textAlign:   'center',
            lineHeight:  18,
            paddingHorizontal: 32,
          }}>
            {carte.raison}
          </Text>
        </Animated.View>

        {/* ─── Bouton ─── */}
        {boutonVisible && (
          <Animated.View style={{ marginTop: 22, opacity: boutonOpacite }}>
            <Pressable
              onPress={passerSuivante}
              style={({ pressed }) => ({
                backgroundColor:   accent,
                paddingHorizontal: 36,
                paddingVertical:   14,
                borderRadius:      30,
                opacity:           pressed ? 0.82 : 1,
                shadowColor:       accent,
                shadowOffset:      { width: 0, height: 5 },
                shadowOpacity:     0.55,
                shadowRadius:      14,
                elevation:         10,
              })}
            >
              <Text style={{
                color:       '#0a0e1a',
                fontSize:    15,
                fontWeight:  '800',
                letterSpacing: 0.4,
              }}>
                {hasNext
                  ? `Carte suivante  ${indexCourant + 2}/${cartes.length}`
                  : 'Voir mes trophées'}
              </Text>
            </Pressable>
          </Animated.View>
        )}

      </Animated.View>
    </Modal>
  )
}
