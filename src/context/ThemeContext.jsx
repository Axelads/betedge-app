import React, { createContext, useContext, useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { useColorScheme } from 'nativewind'
import { pb, mettreAJourThemeUtilisateur } from '../services/pocketbase'

const CLE_THEME = '@betedge_theme'

// ─── Palettes de couleurs pour les inline styles ────────────────────────────
const PALETTE_CLAIR = {
  fond:               '#f9fafb',   // gray-50
  fondCarte:          '#ffffff',   // white
  fondInput:          '#f9fafb',   // gray-50
  fondInputBordure:   '#ffffff',   // white
  texte:              '#1f2937',   // gray-800
  texteSecondaire:    '#6b7280',   // gray-500
  texteTertiaire:     '#4b5563',   // gray-600
  textePlaceholder:   '#9ca3af',   // gray-400
  bordure:            '#d1d5db',   // gray-300
  fondBadge:          '#e5e7eb',   // gray-200
  texteBadge:         '#4b5563',   // gray-600
  fondModal:          '#ffffff',   // white
  fondCarteActive:    '#eff6ff',   // blue-50
  fondCarteInactive:  '#f9fafb',   // gray-50
  fondExempleActive:  '#dbeafe',   // blue-100
  fondExempleInactif: '#f3f4f6',   // gray-100
  texteExempleActive: '#1d4ed8',   // blue-700
  overlay:            'rgba(0,0,0,0.5)',
}

const PALETTE_SOMBRE = {
  fond:               '#111827',   // gray-900
  fondCarte:          '#1f2937',   // gray-800
  fondInput:          '#374151',   // gray-700
  fondInputBordure:   '#374151',   // gray-700
  texte:              '#f9fafb',   // gray-50
  texteSecondaire:    '#9ca3af',   // gray-400
  texteTertiaire:     '#d1d5db',   // gray-300
  textePlaceholder:   '#6b7280',   // gray-500
  bordure:            '#4b5563',   // gray-600
  fondBadge:          '#374151',   // gray-700
  texteBadge:         '#d1d5db',   // gray-300
  fondModal:          '#1f2937',   // gray-800
  fondCarteActive:    '#1e3a8a',   // blue-900
  fondCarteInactive:  '#374151',   // gray-700
  fondExempleActive:  '#1e3a8a',   // blue-900
  fondExempleInactif: '#4b5563',   // gray-600
  texteExempleActive: '#93c5fd',   // blue-300
  overlay:            'rgba(0,0,0,0.75)',
}

// ─── Contexte ────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const { setColorScheme } = useColorScheme()
  const [estSombre, setEstSombre] = useState(false)

  const appliquerTheme = (valeur) => {
    const sombre = valeur === 'sombre'
    setEstSombre(sombre)
    setColorScheme(sombre ? 'dark' : 'light')
  }

  useEffect(() => {
    // Charger depuis SecureStore au démarrage (rapide, fonctionne hors-ligne)
    SecureStore.getItemAsync(CLE_THEME).then(valeur => {
      if (valeur === 'sombre' || valeur === 'clair') appliquerTheme(valeur)
    }).catch(() => {})

    // Synchroniser depuis PocketBase à chaque changement d'auth
    // (connexion initiale, restauration de session, reconnexion)
    const desabonner = pb.authStore.onChange((token, record) => {
      if (!record?.theme) return
      const themeServeur = record.theme
      if (themeServeur !== 'sombre' && themeServeur !== 'clair') return
      appliquerTheme(themeServeur)
      SecureStore.setItemAsync(CLE_THEME, themeServeur).catch(() => {})
    }, false)

    return () => desabonner()
  }, [])

  const basculerTheme = async () => {
    const nouveau = !estSombre
    const valeur = nouveau ? 'sombre' : 'clair'
    setEstSombre(nouveau)
    setColorScheme(nouveau ? 'dark' : 'light')
    try {
      await SecureStore.setItemAsync(CLE_THEME, valeur)
    } catch (_) {}
    await mettreAJourThemeUtilisateur(valeur)
  }

  const c = estSombre ? PALETTE_SOMBRE : PALETTE_CLAIR

  return (
    <ThemeContext.Provider value={{ estSombre, basculerTheme, c }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
