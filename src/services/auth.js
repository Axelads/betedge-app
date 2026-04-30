import * as WebBrowser from 'expo-web-browser'
import * as SecureStore from 'expo-secure-store'
import * as Linking from 'expo-linking'
import * as AppleAuthentication from 'expo-apple-authentication'
import { pb } from './pocketbase'

const CLE_TOKEN = 'betedge_auth_token'
const CLE_MODELE = 'betedge_auth_modele'
const CLE_SE_SOUVENIR = 'betedge_se_souvenir'

// GitHub Pages reçoit le callback Google et redirige vers betedge://oauth?code=...
// openAuthSessionAsync intercepte betedge:// → plus besoin de SSE en arrière-plan
const URI_REDIRECTION = 'https://axelads.github.io/betedge-oauth/'

/**
 * Connexion Google via échange de code OAuth manuel.
 * Flux : Google → GitHub Pages → betedge://oauth → app → PocketBase
 * Aucune dépendance au SSE PocketBase → fonctionne sur tous les appareils Android.
 */
export const connexionGoogle = async (seSouvenir = true) => {
  try {
    // Récupérer les paramètres OAuth2 Google depuis PocketBase
    const methodes = await pb.collection('users').listAuthMethods()
    const google = methodes.oauth2?.providers?.find(p => p.name === 'google')
    if (!google) throw new Error('Fournisseur Google non configuré dans PocketBase')

    // Construire l'URL Google avec notre redirect URI
    const urlAuth = `${google.authURL}${encodeURIComponent(URI_REDIRECTION)}`

    // Ouvrir Chrome Custom Tab — intercepte automatiquement la redirection betedge://
    const resultat = await WebBrowser.openAuthSessionAsync(urlAuth, 'betedge://')

    if (resultat.type !== 'success') throw new Error('annulée')

    // Parser l'URL de retour : betedge://oauth?code=...&state=...
    const { queryParams } = Linking.parse(resultat.url)

    if (!queryParams?.code) throw new Error('Code OAuth manquant')
    if (queryParams?.state !== google.state) throw new Error('State OAuth invalide')

    // Échanger le code auprès de PocketBase (sans SSE)
    const donneesAuth = await pb.collection('users').authWithOAuth2Code(
      'google',
      queryParams.code,
      google.codeVerifier,
      URI_REDIRECTION,
    )

    console.log('[Auth] Connexion réussie:', pb.authStore.record?.email)

    if (seSouvenir && pb.authStore.isValid) {
      await SecureStore.setItemAsync(CLE_TOKEN, pb.authStore.token)
      await SecureStore.setItemAsync(CLE_MODELE, JSON.stringify(pb.authStore.record))
      await SecureStore.setItemAsync(CLE_SE_SOUVENIR, 'true')
    }

    return donneesAuth
  } catch (error) {
    WebBrowser.dismissBrowser().catch(() => {})
    console.error('[Auth] connexionGoogle erreur:', error?.message || error)
    throw error
  }
}

/**
 * Connexion Apple via Sign in with Apple (iOS uniquement).
 * Flux natif : boîte de dialogue Apple → authorizationCode → PocketBase
 * Requiert que le fournisseur "apple" soit configuré dans PocketBase admin.
 */
export const connexionApple = async (seSouvenir = true) => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    })

    const nomComplet = [
      credential.fullName?.givenName || '',
      credential.fullName?.familyName || '',
    ].filter(Boolean).join(' ')

    const donneesAuth = await pb.collection('users').authWithOAuth2Code(
      'apple',
      credential.authorizationCode,
      null,
      URI_REDIRECTION,
      // Données de profil à injecter uniquement à la création du compte
      ...(nomComplet ? [{ name: nomComplet }] : []),
    )

    console.log('[Auth] Connexion Apple réussie:', pb.authStore.record?.email)

    if (seSouvenir && pb.authStore.isValid) {
      await SecureStore.setItemAsync(CLE_TOKEN, pb.authStore.token)
      await SecureStore.setItemAsync(CLE_MODELE, JSON.stringify(pb.authStore.record))
      await SecureStore.setItemAsync(CLE_SE_SOUVENIR, 'true')
    }

    return donneesAuth
  } catch (error) {
    console.error('[Auth] connexionApple erreur:', error?.message || error)
    throw error
  }
}

/**
 * Tente de restaurer une session sauvegardée.
 */
export const restaurerSession = async () => {
  try {
    const seSouvenir = await SecureStore.getItemAsync(CLE_SE_SOUVENIR)
    if (seSouvenir !== 'true') return false

    const token = await SecureStore.getItemAsync(CLE_TOKEN)
    const modele = await SecureStore.getItemAsync(CLE_MODELE)
    if (!token || !modele) return false

    pb.authStore.save(token, JSON.parse(modele))
    if (!pb.authStore.isValid) {
      await supprimerSession()
      return false
    }

    await pb.collection('users').authRefresh()
    return true
  } catch (error) {
    console.error('[Auth] restaurerSession erreur:', error)
    await supprimerSession()
    return false
  }
}

/**
 * Efface la session locale et déconnecte de PocketBase.
 */
export const supprimerSession = async () => {
  pb.authStore.clear()
  await SecureStore.deleteItemAsync(CLE_TOKEN)
  await SecureStore.deleteItemAsync(CLE_MODELE)
  await SecureStore.deleteItemAsync(CLE_SE_SOUVENIR)
}
