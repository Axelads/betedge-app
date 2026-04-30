import React, { useState } from 'react'
import {
  Modal, View, Text, ScrollView, Pressable,
  ActivityIndicator, Alert, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '../context/ThemeContext'
import { useAbonnement } from '../context/AbonnementContext'
import { acheterPremium } from '../services/abonnement'

const FONCTIONNALITES = [
  { icone: 'infinite-outline',        label: 'Historique illimité de vos paris' },
  { icone: 'bar-chart-outline',       label: 'Stats avancées — ROI par sport, type de pari, cote' },
  { icone: 'notifications-outline',   label: 'Alertes bot Telegram en temps réel' },
  { icone: 'trophy-outline',          label: 'Cartes FUT — récompenses visuelles' },
  { icone: 'podium-outline',          label: 'Palmarès du lundi entre parieurs' },
  { icone: 'trending-up-outline',     label: 'Courbe d\'évolution de votre bankroll' },
  { icone: 'share-social-outline',    label: 'Partage de stats en image' },
]

export default function ModalePremium({ visible, onFermer }) {
  const { estSombre } = useTheme()
  const { infoProduit, restaurer } = useAbonnement()
  const [achatEnCours, setAchatEnCours] = useState(false)
  const [restaurEnCours, setRestaurEnCours] = useState(false)

  const c = {
    fond:    estSombre ? '#0f172a' : '#f8fafc',
    carte:   estSombre ? '#1e293b' : '#ffffff',
    texte:   estSombre ? '#f1f5f9' : '#1e293b',
    sec:     estSombre ? '#94a3b8' : '#64748b',
    bordure: estSombre ? '#334155' : '#e2e8f0',
  }

  // localizedPrice est fourni par l'App Store via react-native-iap (ex : "9,99 €")
  const prixStr = infoProduit?.localizedPrice ?? '9,99 €'

  const handleAcheter = async () => {
    if (achatEnCours) return
    setAchatEnCours(true)
    try {
      await acheterPremium()
      // Le résultat est traité par le listener dans AbonnementContext
    } catch (error) {
      const annule = error?.message?.toLowerCase().includes('cancel')
        || error?.message?.toLowerCase().includes('user cancel')
      if (!annule) {
        Alert.alert('Erreur', 'Impossible de lancer le paiement. Réessayez.')
      }
    } finally {
      setAchatEnCours(false)
    }
  }

  const handleRestaurer = async () => {
    if (restaurEnCours) return
    setRestaurEnCours(true)
    try {
      const ok = await restaurer()
      if (!ok) Alert.alert('Aucun achat', 'Aucun abonnement actif trouvé sur ce compte Apple ID.')
    } catch {
      Alert.alert('Erreur', 'Impossible de restaurer les achats.')
    } finally {
      setRestaurEnCours(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onFermer}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.fond }}>

        {/* Bouton fermer */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable onPress={onFermer} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name="close" size={28} color={c.sec} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <LinearGradient
            colors={['#1e3a8a', '#312e81']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, borderRadius: 20, marginBottom: 24 }}
          >
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(251,191,36,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Ionicons name="star" size={32} color="#fbbf24" />
            </View>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 6 }}>
              BetEdge Premium
            </Text>
            <Text style={{ color: '#93c5fd', fontSize: 14, textAlign: 'center' }}>
              Déverrouillez votre potentiel de parieur
            </Text>
          </LinearGradient>

          {/* Prix */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ color: c.texte, fontSize: 36, fontWeight: '800', letterSpacing: -1 }}>
              {prixStr}
            </Text>
            <Text style={{ color: c.sec, fontSize: 14, marginTop: 2 }}>par mois · sans engagement · résiliable à tout moment</Text>
          </View>

          {/* Liste des fonctionnalités */}
          <View style={{ backgroundColor: c.carte, borderRadius: 16, borderWidth: 1, borderColor: c.bordure, marginBottom: 24, overflow: 'hidden' }}>
            {FONCTIONNALITES.map(({ icone, label }, index) => (
              <View
                key={icone}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 13, paddingHorizontal: 16,
                  borderBottomWidth: index < FONCTIONNALITES.length - 1 ? 1 : 0,
                  borderBottomColor: c.bordure,
                }}
              >
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: estSombre ? '#1d4ed820' : '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name={icone} size={18} color="#3b82f6" />
                </View>
                <Text style={{ color: c.texte, fontSize: 14, flex: 1 }}>{label}</Text>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              </View>
            ))}
          </View>

          {/* Bouton S'abonner */}
          <Pressable
            onPress={handleAcheter}
            disabled={achatEnCours}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#1d4ed8' : '#2563eb',
              borderRadius: 14, paddingVertical: 17, alignItems: 'center',
              marginBottom: 12, opacity: achatEnCours ? 0.7 : 1,
            })}
          >
            {achatEnCours
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="star" size={18} color="#fbbf24" />
                  <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
                    S'abonner — {prixStr}/mois
                  </Text>
                </View>
              )
            }
          </Pressable>

          {/* Restaurer */}
          <Pressable
            onPress={handleRestaurer}
            disabled={restaurEnCours}
            style={{ alignItems: 'center', paddingVertical: 12, marginBottom: 20 }}
          >
            {restaurEnCours
              ? <ActivityIndicator size="small" color={c.sec} />
              : <Text style={{ color: c.sec, fontSize: 14, textDecorationLine: 'underline' }}>Restaurer mes achats</Text>
            }
          </Pressable>

          {/* Mentions légales Apple — obligatoires */}
          <Text style={{ color: c.sec, fontSize: 11, textAlign: 'center', lineHeight: 17, marginBottom: 12 }}>
            Le paiement sera débité de votre compte Apple ID à la confirmation de l'achat. L'abonnement
            se renouvelle automatiquement sauf résiliation au moins 24 heures avant la fin de la période en cours.
            Votre compte sera débité pour le renouvellement dans les 24 heures précédant la fin de la période.
            Vous pouvez gérer et résilier vos abonnements dans les réglages de votre compte App Store.
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
            <Pressable onPress={() => Linking.openURL('https://axelads.github.io/betedge-oauth/privacy')}>
              <Text style={{ color: '#3b82f6', fontSize: 11 }}>Politique de confidentialité</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL('https://axelads.github.io/betedge-oauth/support')}>
              <Text style={{ color: '#3b82f6', fontSize: 11 }}>Conditions d'utilisation</Text>
            </Pressable>
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}
