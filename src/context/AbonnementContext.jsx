import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { purchaseUpdatedListener, purchaseErrorListener } from 'react-native-iap'
import {
  initialiserIAP, terminerIAP, getInfoProduit, restaurerAchats,
  lirePremiumLocal, sauvegarderPremiumLocal, terminerTransaction,
  ID_PRODUIT_PREMIUM,
} from '../services/abonnement'
import { sauvegarderStatutPremium, getProfil } from '../services/pocketbase'
import { useAuth } from './AuthContext'

const AbonnementContext = createContext({
  estPremium: false,
  chargement: true,
  infoProduit: null,
  paywallVisible: false,
  ouvrirPaywall: () => {},
  fermerPaywall: () => {},
  restaurer: async () => false,
})

export const useAbonnement = () => useContext(AbonnementContext)

export const FournisseurAbonnement = ({ children }) => {
  const { estConnecte } = useAuth()
  const [estPremium, setEstPremium] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [infoProduit, setInfoProduit] = useState(null)
  const [paywallVisible, setPaywallVisible] = useState(false)

  const activerPremium = useCallback(async () => {
    setEstPremium(true)
    await sauvegarderPremiumLocal(true)
    sauvegarderStatutPremium(true).catch(() => {})
  }, [])

  const desactiverPremium = useCallback(async () => {
    setEstPremium(false)
    await sauvegarderPremiumLocal(false)
    sauvegarderStatutPremium(false).catch(() => {})
  }, [])

  useEffect(() => {
    if (!estConnecte) {
      setChargement(false)
      return
    }
    let actif = true
    let listenerAchat = null
    let listenerErreur = null

    const init = async () => {
      // Cache local — instantané, pas d'attente réseau
      const local = await lirePremiumLocal()
      if (actif) setEstPremium(local)

      // Vérification PocketBase — indépendante de l'IAP, fonctionne en Expo Go et en prod
      let premiumServeur = false
      try {
        const profil = await getProfil()
        premiumServeur = profil?.est_premium === true
        if (actif && premiumServeur) await activerPremium()
      } catch {
        // Non bloquant — l'état local est déjà appliqué
      }

      try {
        await initialiserIAP()

        // Listeners posés après initConnection(), sinon E_IAP_NOT_AVAILABLE en Expo Go / simulateur
        listenerAchat = purchaseUpdatedListener(async (achat) => {
          if (achat.transactionReceipt) {
            await terminerTransaction(achat)
            if (achat.productId === ID_PRODUIT_PREMIUM) {
              await activerPremium()
              setPaywallVisible(false)
            }
          }
        })

        listenerErreur = purchaseErrorListener((erreur) => {
          console.error('IAP erreur achat:', erreur)
        })

        // Vérification silencieuse au démarrage — synchronise avec l'App Store
        const aAbonnement = await restaurerAchats()

        if (actif) {
          if (aAbonnement) await activerPremium()
          else if (!aAbonnement && !premiumServeur && local) await desactiverPremium()
        }

        const info = await getInfoProduit()
        if (actif && info) setInfoProduit(info)
      } catch (err) {
        // IAP non disponible (Expo Go, simulateur, Android sans StoreKit) — on continue sans erreur bloquante
        if (err?.code !== 'E_IAP_NOT_AVAILABLE') {
          console.error('AbonnementContext init:', err)
        }
      } finally {
        if (actif) setChargement(false)
      }
    }

    init()

    return () => {
      actif = false
      listenerAchat?.remove()
      listenerErreur?.remove()
      terminerIAP().catch(() => {})
    }
  }, [estConnecte, activerPremium, desactiverPremium])

  const restaurer = useCallback(async () => {
    try {
      const ok = await restaurerAchats()
      if (ok) {
        await activerPremium()
        setPaywallVisible(false)
      }
      return ok
    } catch {
      return false
    }
  }, [activerPremium])

  return (
    <AbonnementContext.Provider value={{
      estPremium,
      chargement,
      infoProduit,
      paywallVisible,
      ouvrirPaywall: () => setPaywallVisible(true),
      fermerPaywall: () => setPaywallVisible(false),
      restaurer,
    }}>
      {children}
    </AbonnementContext.Provider>
  )
}
