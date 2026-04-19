import React, { useRef, useState } from 'react'
import {
  View, Text, Modal, Pressable, FlatList,
  Image, useWindowDimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'

const IMG_TELEGRAM_ID = require('../../assets/username_id_telegram.jpeg')
const IMG_BOT_ALERTE  = require('../../assets/bot_alerte_betedge.jpeg')

const SLIDES = [
  {
    id: 'bienvenue',
    couleurFond: '#1e3a8a',
    emoji: '🎯',
    titre: 'Bienvenue sur BetEdge !',
    contenu: [
      { type: 'para', texte: 'Tu viens de rejoindre le club très fermé des parieurs qui notent vraiment leurs coups. Sérieusement, c\'est rare. Classe.' },
      { type: 'para', texte: 'BetEdge capture ton raisonnement, analyse tes patterns gagnants et t\'envoie des alertes Telegram quand une opportunité ressemble à tes meilleurs paris.' },
      { type: 'note', icone: 'information-circle-outline', texte: 'Le bot propose, tu décides. Il ne parie jamais à ta place — CGU oblige, et parce qu\'on t\'a pas donné les codes de ton Winamax.' },
    ],
  },
  {
    id: 'telegram_id',
    couleurFond: '#0c4a6e',
    emoji: '📱',
    titre: '1. Récupère ton Telegram ID',
    image: IMG_TELEGRAM_ID,
    contenu: [
      { type: 'etape', n: 1, texte: 'Ouvre Telegram sur ton téléphone' },
      { type: 'etape', n: 2, texte: 'Dans la barre de recherche, tape ', code: '@userinfobot' },
      { type: 'etape', n: 3, texte: 'Appuie sur le bot dans les résultats' },
      { type: 'etape', n: 4, texte: 'Envoie la commande ', code: '/start' },
      { type: 'etape', n: 5, texte: 'Note le nombre affiché après "Id:" — c\'est ton Chat ID' },
    ],
  },
  {
    id: 'parametres',
    couleurFond: '#1e1b4b',
    emoji: '⚙️',
    titre: '2. Colle ton ID dans les Paramètres',
    contenu: [
      { type: 'etape', n: 1, texte: 'Copie le nombre "Id:" affiché par @userinfobot' },
      { type: 'etape', n: 2, texte: 'Dans BetEdge, ouvre l\'onglet ', code: 'Paramètres ⚙️' },
      { type: 'etape', n: 3, texte: 'Colle le Chat ID dans le champ "Alertes Telegram"' },
      { type: 'etape', n: 4, texte: 'Appuie sur "Enregistrer"' },
      { type: 'etape', n: 5, texte: 'Appuie sur "Tester la connexion" — tu reçois un message Telegram ✅' },
      { type: 'note', icone: 'checkmark-circle-outline', texte: 'Le test de connexion t\'envoie un message de confirmation directement sur Telegram.' },
    ],
  },
  {
    id: 'bot_alerte',
    couleurFond: '#064e3b',
    emoji: '🤖',
    titre: '3. Active le bot BetEdge',
    image: IMG_BOT_ALERTE,
    contenu: [
      { type: 'etape', n: 1, texte: 'Ouvre Telegram' },
      { type: 'etape', n: 2, texte: 'Dans la recherche, tape ', code: '@Betedge_alerte_bot' },
      { type: 'etape', n: 3, texte: 'Appuie sur le bot dans les résultats pour l\'ouvrir' },
      { type: 'etape', n: 4, texte: 'Appuie sur "Démarrer" ou envoie la commande ', code: '/start' },
      { type: 'etape', n: 5, texte: 'C\'est tout — le bot peut maintenant t\'envoyer des alertes ✅' },
    ],
  },
  {
    id: 'termine',
    couleurFond: '#4c1d95',
    emoji: '🏆',
    titre: 'C\'est parti !',
    contenu: [
      { type: 'para', texte: 'Configuration terminée. Le bot surveille le marché pendant que tu regardes le match, ou que tu expliques pour la 12ème fois à un pote ce qu\'est une cote value.' },
      { type: 'para', texte: 'Dès qu\'une opportunité matche tes patterns gagnants, tu reçois une alerte. Tu places si tu veux. Ou pas. Mais au moins, tu le sais.' },
      { type: 'note', icone: 'rocket-outline', texte: 'Bonne chance — et que les cotes soient avec toi ! ⚽ 🍀' },
    ],
  },
]

function SlideItem({ slide, largeur, c, estSombre }) {
  return (
    <View style={{ width: largeur, flex: 1 }}>
      {/* En-tête colorée */}
      <View style={{
        backgroundColor: slide.couleurFond,
        paddingTop: 22, paddingBottom: 18, paddingHorizontal: 20,
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 40 }}>{slide.emoji}</Text>
        <Text style={{
          fontSize: 16, fontWeight: '800', color: '#ffffff',
          textAlign: 'center', marginTop: 8, lineHeight: 22,
        }}>
          {slide.titre}
        </Text>
      </View>

      {/* Image optionnelle */}
      {slide.image && (
        <View style={{ alignItems: 'center', paddingTop: 14, paddingHorizontal: 20 }}>
          <Image
            source={slide.image}
            style={{ width: largeur - 64, height: 130, borderRadius: 10 }}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Corps */}
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: slide.image ? 12 : 18, paddingBottom: 8 }}>
        {slide.contenu.map((item, i) => {
          if (item.type === 'para') {
            return (
              <Text key={i} style={{
                color: c.texte, fontSize: 13, lineHeight: 20, marginBottom: 10,
              }}>
                {item.texte}
              </Text>
            )
          }
          if (item.type === 'etape') {
            return (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: '#3b82f6',
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 10, marginTop: 1, flexShrink: 0,
                }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{item.n}</Text>
                </View>
                <Text style={{ flex: 1, color: c.texte, fontSize: 13, lineHeight: 20 }}>
                  {item.texte}
                  {item.code ? (
                    <Text style={{ color: '#60a5fa', fontWeight: '700' }}>{item.code}</Text>
                  ) : null}
                </Text>
              </View>
            )
          }
          if (item.type === 'note') {
            return (
              <View key={i} style={{
                flexDirection: 'row',
                backgroundColor: estSombre ? '#1e3a5f' : '#eff6ff',
                borderRadius: 10, padding: 12, marginTop: 6,
              }}>
                <Ionicons
                  name={item.icone} size={16} color="#3b82f6"
                  style={{ marginRight: 8, marginTop: 1 }}
                />
                <Text style={{
                  flex: 1,
                  color: estSombre ? '#93c5fd' : '#1d4ed8',
                  fontSize: 12, lineHeight: 18,
                }}>
                  {item.texte}
                </Text>
              </View>
            )
          }
          return null
        })}
      </View>
    </View>
  )
}

export default function ModaleOnboarding({ visible, onFermer }) {
  const { c, estSombre } = useTheme()
  const { width, height } = useWindowDimensions()
  const flatRef = useRef(null)
  const [indexActuel, setIndexActuel] = useState(0)

  const LARGEUR       = width - 32
  const HAUTEUR_MODALE = Math.min(660, height * 0.88)
  const NB_SLIDES     = SLIDES.length
  const estDernierSlide = indexActuel === NB_SLIDES - 1

  const allerSlide = (index) => {
    flatRef.current?.scrollToIndex({ index, animated: true })
    setIndexActuel(index)
  }

  const suivant = () => {
    if (!estDernierSlide) allerSlide(indexActuel + 1)
    else onFermer()
  }

  const reinitialiser = () => {
    setIndexActuel(0)
    flatRef.current?.scrollToIndex({ index: 0, animated: false })
  }

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
        backgroundColor: c.overlay,
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
          {/* Slides */}
          <FlatList
            ref={flatRef}
            data={SLIDES}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: LARGEUR, offset: LARGEUR * index, index })}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / LARGEUR)
              setIndexActuel(index)
            }}
            renderItem={({ item }) => (
              <SlideItem
                slide={item}
                largeur={LARGEUR}
                c={c}
                estSombre={estSombre}
              />
            )}
            style={{ flex: 1 }}
          />

          {/* Footer */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 }}>
            {/* Points de pagination */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 14 }}>
              {SLIDES.map((_, i) => (
                <View key={i} style={{
                  width: i === indexActuel ? 22 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === indexActuel ? '#3b82f6' : (estSombre ? '#374151' : '#d1d5db'),
                  marginRight: i < SLIDES.length - 1 ? 6 : 0,
                }} />
              ))}
            </View>

            {/* Bouton Suivant / Terminer */}
            <Pressable
              onPress={suivant}
              style={({ pressed }) => ({
                backgroundColor: estDernierSlide ? '#16a34a' : '#3b82f6',
                borderRadius: 12,
                padding: 15,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
                flexDirection: 'row',
                justifyContent: 'center',
              })}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15, marginRight: 6 }}>
                {estDernierSlide ? 'C\'est parti !' : 'Suivant'}
              </Text>
              <Ionicons
                name={estDernierSlide ? 'checkmark-circle' : 'arrow-forward'}
                size={18}
                color="#ffffff"
              />
            </Pressable>

            {/* Lien passer si pas le dernier slide */}
            {!estDernierSlide && (
              <Pressable onPress={onFermer} style={{ alignItems: 'center', paddingTop: 10 }}>
                <Text style={{ color: c.texteSecondaire, fontSize: 12 }}>Passer</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}
