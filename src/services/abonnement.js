import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  finishTransaction,
} from 'react-native-iap'
import * as SecureStore from 'expo-secure-store'

export const ID_PRODUIT_PREMIUM = 'com.axelads.betedge.premium.monthly'
const CLE_PREMIUM_LOCAL = 'betedge_est_premium'

export const initialiserIAP = async () => {
  try {
    await initConnection()
  } catch (error) {
    console.error('initialiserIAP:', error)
  }
}

export const terminerIAP = async () => {
  try {
    await endConnection()
  } catch (error) {
    console.error('terminerIAP:', error)
  }
}

export const getInfoProduit = async () => {
  try {
    const produits = await getSubscriptions({ skus: [ID_PRODUIT_PREMIUM] })
    return produits?.[0] ?? null
  } catch (error) {
    console.error('getInfoProduit:', error)
    return null
  }
}

export const acheterPremium = async () => {
  await requestSubscription({ sku: ID_PRODUIT_PREMIUM })
}

// getAvailablePurchases retourne uniquement les abonnements actifs (non expirés)
export const restaurerAchats = async () => {
  try {
    const achatsActifs = await getAvailablePurchases()
    return achatsActifs.some(a => a.productId === ID_PRODUIT_PREMIUM)
  } catch (error) {
    console.error('restaurerAchats:', error)
    return false
  }
}

export const terminerTransaction = async (achat) => {
  try {
    await finishTransaction({ purchase: achat, isConsumable: false })
  } catch (error) {
    console.error('terminerTransaction:', error)
  }
}

export const lirePremiumLocal = async () => {
  try {
    return (await SecureStore.getItemAsync(CLE_PREMIUM_LOCAL)) === 'oui'
  } catch {
    return false
  }
}

export const sauvegarderPremiumLocal = async (valeur) => {
  try {
    if (valeur) {
      await SecureStore.setItemAsync(CLE_PREMIUM_LOCAL, 'oui')
    } else {
      await SecureStore.deleteItemAsync(CLE_PREMIUM_LOCAL)
    }
  } catch (error) {
    console.error('sauvegarderPremiumLocal:', error)
  }
}
