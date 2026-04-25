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
import MopalePalmares from './src/components/MopalePalmares'
import { pb, ID_SUPERUSER, getParisPlateformePeriode, getNbAlertesUtilisateurPeriode } from './src/services/pocketbase'
import { calculerROI, calculerTauxReussite } from './src/services/stats'

const Tab = createBottomTabNavigator()
const CLE_PALMARES = 'betedge_palmares_'

// ─── Helpers palmarès (définis hors composant, pas de hooks) ─────────────────

const obtenirPeriodes = () => {
  const maintenant = new Date()
  const hier = new Date(maintenant)
  hier.setDate(hier.getDate() - 1)

  const debutSemaine = new Date(maintenant)
  debutSemaine.setDate(debutSemaine.getDate() - 7)

  let debutMois, finMois, labelMois
  if (maintenant.getDate() <= 7) {
    debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1)
    finMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 0)
    labelMois = debutMois.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
  } else {
    debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
    finMois = hier
    labelMois = maintenant.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
  }

  const fmt = (d) => d.toISOString().substring(0, 10)
  const labelSemaine = `du ${debutSemaine.getDate()} au ${hier.getDate()} ${hier.toLocaleString('fr-FR', { month: 'long' })}`

  return {
    semaine: { debut: fmt(debutSemaine), fin: fmt(hier), label: labelSemaine },
    mois: { debut: fmt(debutMois), fin: fmt(finMois), label: labelMois },
  }
}

const grouperParUtilisateur = (paris) => {
  const map = {}
  for (const pari of paris) {
    const user = pari.expand?.user
    if (!user) continue
    if (!map[user.id]) map[user.id] = { user, paris: [] }
    map[user.id].paris.push(pari)
  }
  return Object.values(map)
}

const trouverMeilleurParieur = (groupes) => {
  let meilleur = null
  let meilleurROI = -Infinity
  for (const { user, paris } of groupes) {
    const termines = paris.filter(p => p.statut === 'gagne' || p.statut === 'perdu')
    if (termines.length === 0) continue
    const roi = calculerROI(termines)
    if (meilleur === null || roi > meilleurROI) {
      meilleurROI = roi
      meilleur = { user, paris }
    }
  }
  return meilleur
}

const formaterDonneesParieur = (groupe, periode) => {
  if (!groupe) return null
  const { user, paris } = groupe
  const termines = paris.filter(p => p.statut === 'gagne' || p.statut === 'perdu')
  const gagnes = termines.filter(p => p.statut === 'gagne')
  const profit = termines.reduce((s, p) => s + (p.profit_perte || 0), 0)
  const avatarUrl = user.avatar ? pb.files.getURL(user, user.avatar) : null
  return {
    utilisateur: { id: user.id, nom: user.name || user.email || 'Anonyme', avatarUrl },
    roi: calculerROI(termines),
    profit,
    tauxReussite: calculerTauxReussite(termines),
    nbTermines: termines.length,
    nbGagnes: gagnes.length,
    label: periode.label,
  }
}

// ─────────────────────────────────────────────────────────────────────────────

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
  const [montrerPalmares, setMontrerPalmares] = useState(false)
  const [donneesPalmares, setDonneesPalmares] = useState(null)

  const verifierPalmares = async () => {
    try {
      const maintenant = new Date()
      if (maintenant.getDay() !== 1) return  // Seulement le lundi

      const cleLundi = `${CLE_PALMARES}${maintenant.toISOString().substring(0, 10)}`
      const dejaVu = await SecureStore.getItemAsync(cleLundi)
      if (dejaVu) return

      const periodes = obtenirPeriodes()
      const [parisSemaine, parisMois] = await Promise.all([
        getParisPlateformePeriode(periodes.semaine.debut, periodes.semaine.fin),
        getParisPlateformePeriode(periodes.mois.debut, periodes.mois.fin),
      ])

      const meilleurSemaine = trouverMeilleurParieur(grouperParUtilisateur(parisSemaine))
      const meilleurMois = trouverMeilleurParieur(grouperParUtilisateur(parisMois))

      if (!meilleurSemaine && !meilleurMois) return

      let donneesMois = formaterDonneesParieur(meilleurMois, periodes.mois)
      if (donneesMois) {
        const nbAlertes = await getNbAlertesUtilisateurPeriode(
          meilleurMois.user.id, periodes.mois.debut, periodes.mois.fin
        )
        donneesMois = { ...donneesMois, nbAlertes }
      }

      await SecureStore.setItemAsync(cleLundi, 'oui')
      setDonneesPalmares({
        semaine: formaterDonneesParieur(meilleurSemaine, periodes.semaine),
        mois: donneesMois,
      })
      setMontrerPalmares(true)
    } catch (err) {
      console.error('verifierPalmares erreur:', err)
    }
  }

  useEffect(() => {
    if (!estConnecte) return
    SecureStore.getItemAsync(CLE_ONBOARDING).then(valeur => {
      if (!valeur) {
        setMontrerOnboarding(true)
        // Pas de palmarès pour un nouvel utilisateur (onboarding prioritaire)
      } else {
        verifierPalmares()
      }
    }).catch(() => { verifierPalmares() })
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
      <MopalePalmares
        visible={montrerPalmares}
        onFermer={() => setMontrerPalmares(false)}
        donnees={donneesPalmares}
        currentUserId={pb.authStore.record?.id}
      />
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
