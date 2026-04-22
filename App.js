import './global.css'
import { useState, useEffect } from 'react'
import { Pressable, Image, View, ActivityIndicator, Alert } from 'react-native'
import FooterSignature from './src/components/FooterSignature'
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'

const LOGO_ECRITURE = require('./assets/logo_ecriture_betedge.png')
const CLE_ONBOARDING = 'betedge_onboarding_vu'

import { ThemeProvider, useTheme } from './src/context/ThemeContext'
import { FournisseurAuth, useAuth } from './src/context/AuthContext'
import HomeScreen from './src/screens/HomeScreen'
import NouveauPariEcran from './src/screens/NewBetScreen'
import HistoriqueParis from './src/screens/BetHistoryScreen'
import StatsScreen from './src/screens/StatsScreen'
import ConnexionScreen from './src/screens/ConnexionScreen'
import ParametresEcran from './src/screens/ParametresScreen'
import AdminScreen from './src/screens/AdminScreen'
import ModaleOnboarding from './src/components/ModaleOnboarding'
import { pb, ID_SUPERUSER } from './src/services/pocketbase'

const Tab = createBottomTabNavigator()

const avecFooter = (Composant) => (props) => (
  <View style={{ flex: 1 }}>
    <Composant {...props} />
    <FooterSignature />
  </View>
)

// Bouton soleil/lune dans le header
function BoutonTheme() {
  const { estSombre, basculerTheme } = useTheme()
  return (
    <Pressable
      onPress={basculerTheme}
      style={{ marginRight: 16, padding: 4 }}
      hitSlop={8}
    >
      <Ionicons
        name={estSombre ? 'sunny-outline' : 'moon-outline'}
        size={22}
        color="#fff"
      />
    </Pressable>
  )
}

// Bouton déconnexion dans le header
function BoutonDeconnexion() {
  const { seDeconnecter } = useAuth()
  return (
    <Pressable
      onPress={() =>
        Alert.alert(
          'Déconnexion',
          'Voulez-vous vraiment vous déconnecter ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Se déconnecter', style: 'destructive', onPress: seDeconnecter },
          ]
        )
      }
      style={{ marginLeft: 16, padding: 4 }}
      hitSlop={8}
    >
      <Ionicons name="log-out-outline" size={22} color="#94a3b8" />
    </Pressable>
  )
}

// Bouton info (ré-ouvre la modale d'onboarding)
function BoutonInfo({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ marginRight: 8, padding: 4 }}
      hitSlop={8}
    >
      <Ionicons name="information-circle-outline" size={22} color="#94a3b8" />
    </Pressable>
  )
}

function NavigateurPrincipal({ onOuvrirInfo }) {
  const { estSombre } = useTheme()
  const estAdmin = pb.authStore.record?.id === ID_SUPERUSER

  return (
    <NavigationContainer theme={estSombre ? DarkTheme : DefaultTheme}>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#fff',
          headerTitle: () => (
            <Image
              source={LOGO_ECRITURE}
              style={{ height: 48, width: 220, resizeMode: 'contain' }}
            />
          ),
          headerLeft: () => <BoutonDeconnexion />,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BoutonInfo onPress={onOuvrirInfo} />
              <BoutonTheme />
            </View>
          ),
          tabBarStyle: { backgroundColor: estSombre ? '#1f2937' : '#ffffff' },
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: estSombre ? '#6b7280' : '#9ca3af',
        }}
      >
        <Tab.Screen
          name="Home"
          component={avecFooter(HomeScreen)}
          options={{
            title: 'Accueil',
            tabBarLabel: 'Accueil',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="NouveauPari"
          component={avecFooter(NouveauPariEcran)}
          options={{
            title: 'Nouveau pari',
            tabBarLabel: 'Nouveau pari',
            tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Historique"
          component={avecFooter(HistoriqueParis)}
          options={{
            title: 'Historique',
            tabBarLabel: 'Historique',
            tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Stats"
          component={avecFooter(StatsScreen)}
          options={{
            title: 'Statistiques',
            tabBarLabel: 'Stats',
            tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Parametres"
          component={avecFooter(ParametresEcran)}
          options={{
            title: 'Paramètres',
            tabBarLabel: 'Paramètres',
            tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
          }}
        />
        {estAdmin && (
          <Tab.Screen
            name="Admin"
            component={avecFooter(AdminScreen)}
            options={{
              title: 'Admin',
              tabBarLabel: 'Admin',
              tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark-outline" color={color} size={size} />,
            }}
          />
        )}
      </Tab.Navigator>
    </NavigationContainer>
  )
}

function AppNavigateur() {
  const { estConnecte, chargementInitial } = useAuth()
  const [montrerOnboarding, setMontrerOnboarding] = useState(false)

  useEffect(() => {
    if (!estConnecte) return
    SecureStore.getItemAsync(CLE_ONBOARDING).then(valeur => {
      if (!valeur) setMontrerOnboarding(true)
    }).catch(() => {})
  }, [estConnecte])

  const fermerOnboarding = async () => {
    try {
      await SecureStore.setItemAsync(CLE_ONBOARDING, 'oui')
    } catch (_) {}
    setMontrerOnboarding(false)
  }

  if (chargementInitial) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  if (!estConnecte) {
    return <ConnexionScreen />
  }

  return (
    <>
      <NavigateurPrincipal onOuvrirInfo={() => setMontrerOnboarding(true)} />
      <ModaleOnboarding visible={montrerOnboarding} onFermer={fermerOnboarding} />
    </>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FournisseurAuth>
          <AppNavigateur />
        </FournisseurAuth>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
