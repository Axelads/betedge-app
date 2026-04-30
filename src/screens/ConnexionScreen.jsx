import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from 'react-native'
import FooterSignature from '../components/FooterSignature'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Path } from 'react-native-svg'
import * as AppleAuthentication from 'expo-apple-authentication'
import { connexionGoogle, connexionApple } from '../services/auth'
import { useAuth } from '../context/AuthContext'

// Logo Google officiel (SVG multicolore)
const LogoGoogle = ({ taille = 22 }) => (
  <Svg width={taille} height={taille} viewBox="0 0 48 48">
    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <Path fill="none" d="M0 0h48v48H0z"/>
  </Svg>
)

const LOGO_ECRITURE = require('../../assets/logo_ecriture_betedge.png')

export default function ConnexionScreen() {
  const { seConnecter } = useAuth()
  const [chargement, setChargement] = useState(false)
  const [chargementApple, setChargementApple] = useState(false)
  const [seSouvenir, setSeSouvenir] = useState(true)
  const [appleDisponible, setAppleDisponible] = useState(false)

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleDisponible)
    }
  }, [])

  const gererConnexionGoogle = async () => {
    setChargement(true)
    try {
      await connexionGoogle(seSouvenir)
      seConnecter()
    } catch (error) {
      if (!error.message?.includes('annulée')) {
        Alert.alert(
          'Erreur de connexion',
          'Impossible de se connecter avec Google. Vérifiez votre connexion et réessayez.',
          [{ text: 'OK' }]
        )
      }
    } finally {
      setChargement(false)
    }
  }

  const gererConnexionApple = async () => {
    setChargementApple(true)
    try {
      await connexionApple(seSouvenir)
      seConnecter()
    } catch (error) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert(
          'Erreur de connexion',
          'Impossible de se connecter avec Apple. Réessayez.',
          [{ text: 'OK' }]
        )
      }
    } finally {
      setChargementApple(false)
    }
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <LinearGradient
        colors={['#0f172a', '#1a2744', '#0f172a']}
        locations={[0, 0.5, 1]}
        style={{ flex: 1 }}
      >
        {/* Zone haute — logo */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 40, paddingTop: 60 }}>
          <LinearGradient
            colors={['#1e3a5f', '#162d4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 50,
              paddingHorizontal: 18,
              paddingVertical: 9,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 28,
              borderWidth: 1,
              borderColor: '#2d5a8e',
            }}
          >
            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#60a5fa',
              marginRight: 8,
              shadowColor: '#60a5fa',
              shadowOpacity: 0.8,
              shadowRadius: 4,
              elevation: 2,
            }} />
            <Text style={{ color: '#93c5fd', fontSize: 11, fontWeight: '700', letterSpacing: 2.5 }}>
              PARIS SPORTIFS
            </Text>
            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#60a5fa',
              marginLeft: 8,
              shadowColor: '#60a5fa',
              shadowOpacity: 0.8,
              shadowRadius: 4,
              elevation: 2,
            }} />
          </LinearGradient>

          <Image
            source={LOGO_ECRITURE}
            style={{ width: 340, height: 100, resizeMode: 'contain', marginBottom: 20 }}
          />

          <Text style={{
            color: '#cbd5e1',
            fontSize: 16,
            textAlign: 'center',
            lineHeight: 24,
            paddingHorizontal: 40,
          }}>
            Capturez vos paris,{'\n'}analysez vos patterns.
          </Text>
        </View>

        {/* Zone basse — carte blanche */}
        <View style={{
          backgroundColor: '#ffffff',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          paddingHorizontal: 28,
          paddingTop: 36,
          paddingBottom: 48,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 20,
        }}>
          <Text style={{
            color: '#0f172a',
            fontSize: 22,
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 6,
          }}>
            Connexion
          </Text>
          <Text style={{
            color: '#64748b',
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 28,
          }}>
            Connectez-vous pour accéder à votre espace
          </Text>

          {/* Boutons de connexion */}
          <View style={{ alignItems: 'center', gap: 12 }}>
            {/* Bouton Google */}
            <Pressable
              onPress={gererConnexionGoogle}
              disabled={chargement || chargementApple}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#f1f5f9' : '#ffffff',
                borderRadius: 16,
                paddingVertical: 18,
                paddingHorizontal: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: pressed ? '#94a3b8' : '#e2e8f0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 4,
                opacity: (chargement || chargementApple) ? 0.65 : 1,
                minWidth: 220,
              })}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                {chargement
                  ? <ActivityIndicator size="large" color="#4285F4" />
                  : <LogoGoogle taille={36} />
                }
              </View>
              <Text style={{
                color: '#1e293b',
                fontSize: 15,
                fontWeight: '600',
                letterSpacing: 0.2,
                textAlign: 'center',
              }}>
                {chargement ? 'Connexion en cours…' : 'Continuer avec Google'}
              </Text>
            </Pressable>

            {/* Bouton Sign in with Apple — affiché uniquement sur iOS 13+ */}
            {appleDisponible && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={16}
                style={{ width: 220, height: 56 }}
                onPress={gererConnexionApple}
              />
            )}
          </View>

          {/* Se souvenir de moi */}
          <Pressable
            onPress={() => setSeSouvenir(!seSouvenir)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 20,
              paddingVertical: 8,
            }}
          >
            <View style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: seSouvenir ? '#3b82f6' : '#cbd5e1',
              backgroundColor: seSouvenir ? '#3b82f6' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}>
              {seSouvenir && <Ionicons name="checkmark" size={14} color="#ffffff" />}
            </View>
            <Text style={{ color: '#475569', fontSize: 14, fontWeight: '500' }}>
              Se souvenir de moi
            </Text>
          </Pressable>

          <Text style={{
            color: '#94a3b8',
            fontSize: 12,
            textAlign: 'center',
            marginTop: 24,
            lineHeight: 18,
          }}>
            Accès privé — BetEdge est une application personnelle.{'\n'}
            Vos données restent privées et sécurisées.
          </Text>

          <FooterSignature couleurTexte="#94a3b8" couleurLien="#3b82f6" />
        </View>
      </LinearGradient>
    </>
  )
}
