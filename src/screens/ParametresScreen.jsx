import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, Pressable,
  Alert, ActivityIndicator, ScrollView, Image,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { getProfil, sauvegarderProfil, mettreAJourAvatar, getUrlAvatar, pb } from '../services/pocketbase'

const SPORTS = [
  { valeur: 'football',   label: '⚽ Football' },
  { valeur: 'tennis',     label: '🎾 Tennis' },
  { valeur: 'basketball', label: '🏀 Basketball' },
  { valeur: 'rugby',      label: '🏉 Rugby' },
  { valeur: 'autre',      label: '🏆 Autre' },
]

const PLATEFORMES = ['Winamax', 'Betclic', 'Unibet', 'Parions Sport']

export default function ParametresScreen() {
  const { estSombre } = useTheme()

  const [chargement, setChargement] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [testEnCours, setTestEnCours] = useState(false)
  const [profilId, setProfilId] = useState(null)

  // Champs profil
  const [telegramChatId, setTelegramChatId] = useState('')
  const [estTelegramSauvegarde, setEstTelegramSauvegarde] = useState(false)
  const [equipe, setEquipe] = useState('')
  const [plateforme, setPlateforme] = useState('')
  const [sport, setSport] = useState('')
  const [age, setAge] = useState('')
  const [avatarUri, setAvatarUri] = useState(null)
  const [nouvelAvatar, setNouvelAvatar] = useState(null)

  const c = {
    fond:      estSombre ? '#0f172a' : '#f8fafc',
    carte:     estSombre ? '#1e293b' : '#ffffff',
    texte:     estSombre ? '#f1f5f9' : '#1e293b',
    sec:       estSombre ? '#94a3b8' : '#64748b',
    bordure:   estSombre ? '#334155' : '#e2e8f0',
    accent:    '#3b82f6',
    succes:    '#22c55e',
    chip:      estSombre ? '#334155' : '#e2e8f0',
    chipActif: estSombre ? '#1d4ed8' : '#dbeafe',
    chipTexte: estSombre ? '#93c5fd' : '#1d4ed8',
  }

  useEffect(() => {
    const charger = async () => {
      try {
        const profil = await getProfil()
        if (profil) {
          setProfilId(profil.id)
          setTelegramChatId(profil.telegram_chat_id ?? '')
          setEstTelegramSauvegarde(!!profil.telegram_chat_id)
          setEquipe(profil.equipe_favorite ?? '')
          setPlateforme(profil.plateforme_favorite ?? '')
          setSport(profil.sport_favori ?? '')
          setAge(profil.age ? String(profil.age) : '')
          const urlAvatar = getUrlAvatar(profil)
          if (urlAvatar) setAvatarUri(urlAvatar)
        }
      } catch (erreur) {
        console.error('Erreur chargement profil:', erreur)
      } finally {
        setChargement(false)
      }
    }
    charger()
  }, [])

  const choisirPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission refusée', 'Autorise l\'accès à ta galerie dans les réglages.')
      return
    }
    const resultat = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    })
    if (resultat.canceled) return

    const image = resultat.assets[0]
    const manipulee = await ImageManipulator.manipulateAsync(
      image.uri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.WEBP }
    )
    setAvatarUri(manipulee.uri)
    setNouvelAvatar(manipulee)
  }

  const handleSauvegarder = async () => {
    setSauvegarde(true)
    try {
      const donnees = {
        telegram_chat_id: telegramChatId.trim() || null,
        equipe_favorite:  equipe.trim() || null,
        plateforme_favorite: plateforme || null,
        sport_favori:     sport || null,
        age:              age ? parseInt(age, 10) : null,
      }
      await sauvegarderProfil(donnees)
      if (nouvelAvatar) await mettreAJourAvatar(nouvelAvatar)
      setNouvelAvatar(null)
      if (telegramChatId.trim()) setEstTelegramSauvegarde(true)
      Alert.alert('Profil enregistré !', 'Tes informations ont été sauvegardées.')
    } catch (erreur) {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Vérifie ta connexion.')
    } finally {
      setSauvegarde(false)
    }
  }

  const handleTester = async () => {
    if (!telegramChatId.trim()) {
      Alert.alert('Chat ID manquant', 'Entre et enregistre ton Chat ID d\'abord.')
      return
    }
    setTestEnCours(true)
    try {
      const reponse = await fetch(
        `https://api.telegram.org/bot${process.env.EXPO_PUBLIC_TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramChatId.trim(),
            text: '✅ BetEdge — Connexion Telegram confirmée !\n\nTu recevras les alertes de paris sur ce compte.',
          }),
        }
      )
      const resultat = await reponse.json()
      if (resultat.ok) {
        Alert.alert('Message envoyé !', 'Vérifie ton Telegram.')
      } else {
        Alert.alert('Erreur', `Chat ID incorrect ou bot non démarré.\n\n${resultat.description}`)
      }
    } catch {
      Alert.alert('Erreur réseau', 'Impossible de contacter Telegram.')
    } finally {
      setTestEnCours(false)
    }
  }

  if (chargement) {
    return (
      <View style={{ flex: 1, backgroundColor: c.fond, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={c.accent} />
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.fond }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

      {/* ── Avatar + identité ── */}
      <View style={{ backgroundColor: c.carte, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: c.bordure, alignItems: 'center' }}>
        <Pressable onPress={choisirPhoto} style={{ marginBottom: 12 }}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: c.accent }}
            />
          ) : (
            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: c.chip, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.bordure, borderStyle: 'dashed' }}>
              <Ionicons name="person-outline" size={36} color={c.sec} />
            </View>
          )}
          <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: c.accent, borderRadius: 12, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </Pressable>

        <Text style={{ color: c.sec, fontSize: 12, marginBottom: 4 }}>COMPTE CONNECTÉ</Text>
        <Text style={{ color: c.texte, fontSize: 15, fontWeight: '600' }}>
          {pb.authStore.record?.email ?? 'Inconnu'}
        </Text>
        {nouvelAvatar && (
          <Text style={{ color: c.chipTexte, fontSize: 11, marginTop: 6 }}>
            Nouvelle photo sélectionnée (WebP) — enregistre pour confirmer
          </Text>
        )}
      </View>

      {/* ── Informations personnelles ── */}
      <View style={{ backgroundColor: c.carte, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: c.bordure }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="person-circle-outline" size={20} color={c.accent} style={{ marginRight: 8 }} />
          <Text style={{ color: c.texte, fontSize: 16, fontWeight: '700' }}>Mon profil</Text>
        </View>

        {/* Équipe favorite */}
        <Text style={{ color: c.sec, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>ÉQUIPE FAVORITE</Text>
        <TextInput
          value={equipe}
          onChangeText={setEquipe}
          placeholder="Ex: PSG, OM, Manchester City…"
          placeholderTextColor={c.sec}
          style={{ backgroundColor: estSombre ? '#0f172a' : '#f8fafc', borderWidth: 1, borderColor: c.bordure, borderRadius: 8, padding: 12, color: c.texte, fontSize: 15, marginBottom: 14 }}
        />

        {/* Âge */}
        <Text style={{ color: c.sec, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>ÂGE</Text>
        <TextInput
          value={age}
          onChangeText={setAge}
          placeholder="Ex: 28"
          placeholderTextColor={c.sec}
          keyboardType="numeric"
          style={{ backgroundColor: estSombre ? '#0f172a' : '#f8fafc', borderWidth: 1, borderColor: c.bordure, borderRadius: 8, padding: 12, color: c.texte, fontSize: 15, marginBottom: 14 }}
        />

        {/* Sport favori */}
        <Text style={{ color: c.sec, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>SPORT FAVORI</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {SPORTS.map((s) => (
            <Pressable
              key={s.valeur}
              onPress={() => setSport(sport === s.valeur ? '' : s.valeur)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: sport === s.valeur ? c.chipActif : c.chip,
                borderWidth: 1,
                borderColor: sport === s.valeur ? c.accent : 'transparent',
              }}
            >
              <Text style={{ color: sport === s.valeur ? c.chipTexte : c.sec, fontSize: 13, fontWeight: sport === s.valeur ? '700' : '400' }}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Plateforme favorite */}
        <Text style={{ color: c.sec, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>BOOKMAKER FAVORI</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PLATEFORMES.map((p) => (
            <Pressable
              key={p}
              onPress={() => setPlateforme(plateforme === p ? '' : p)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: plateforme === p ? c.chipActif : c.chip,
                borderWidth: 1,
                borderColor: plateforme === p ? c.accent : 'transparent',
              }}
            >
              <Text style={{ color: plateforme === p ? c.chipTexte : c.sec, fontSize: 13, fontWeight: plateforme === p ? '700' : '400' }}>
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Alertes Telegram ── */}
      <View style={{ backgroundColor: c.carte, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: c.bordure }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="paper-plane-outline" size={20} color={c.accent} style={{ marginRight: 8 }} />
          <Text style={{ color: c.texte, fontSize: 16, fontWeight: '700' }}>Alertes Telegram</Text>
          {estTelegramSauvegarde && (
            <View style={{ marginLeft: 8, backgroundColor: '#dcfce7', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: '#16a34a', fontSize: 11, fontWeight: '600' }}>Actif</Text>
            </View>
          )}
        </View>

        <Text style={{ color: c.sec, fontSize: 13, marginBottom: 14, lineHeight: 20 }}>
          Entre ton Telegram Chat ID pour recevoir les alertes BetEdge directement sur ton téléphone.
        </Text>

        <View style={{ backgroundColor: estSombre ? '#1e3a5f' : '#eff6ff', borderRadius: 8, padding: 12, marginBottom: 14 }}>
          <Text style={{ color: estSombre ? '#93c5fd' : '#1d4ed8', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>
            Comment trouver ton Chat ID ?
          </Text>
          <Text style={{ color: estSombre ? '#bfdbfe' : '#3b82f6', fontSize: 12, lineHeight: 18 }}>
            1. Ouvre Telegram{'\n'}
            2. Recherche @userinfobot{'\n'}
            3. Envoie /start{'\n'}
            4. Copie le nombre "Id:" affiché
          </Text>
        </View>

        <TextInput
          value={telegramChatId}
          onChangeText={(val) => { setTelegramChatId(val); setEstTelegramSauvegarde(false) }}
          placeholder="Ex: 123456789"
          placeholderTextColor={c.sec}
          keyboardType="numeric"
          style={{ backgroundColor: estSombre ? '#0f172a' : '#f8fafc', borderWidth: 1, borderColor: c.bordure, borderRadius: 8, padding: 12, color: c.texte, fontSize: 16, marginBottom: 10 }}
        />

        <Pressable
          onPress={handleTester}
          disabled={testEnCours || !estTelegramSauvegarde}
          style={{ backgroundColor: 'transparent', borderRadius: 8, borderWidth: 1, borderColor: c.accent, padding: 12, alignItems: 'center', opacity: (testEnCours || !estTelegramSauvegarde) ? 0.4 : 1 }}
        >
          {testEnCours
            ? <ActivityIndicator color={c.accent} />
            : <Text style={{ color: c.accent, fontWeight: '600', fontSize: 14 }}>Tester la connexion</Text>
          }
        </Pressable>
      </View>

      {/* ── Bouton Enregistrer global ── */}
      <Pressable
        onPress={handleSauvegarder}
        disabled={sauvegarde}
        style={{ backgroundColor: c.accent, borderRadius: 12, padding: 16, alignItems: 'center', opacity: sauvegarde ? 0.6 : 1 }}
      >
        {sauvegarde
          ? <ActivityIndicator color="#fff" />
          : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Enregistrer le profil</Text>
            </View>
          )
        }
      </Pressable>


    </ScrollView>
  )
}
