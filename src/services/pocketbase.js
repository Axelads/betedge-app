// Polyfill EventSource pour React Native (requis par PocketBase SDK v0.22+ pour les SSE)
import EventSource from 'react-native-sse'
global.EventSource = EventSource

import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.EXPO_PUBLIC_PB_URL ?? 'https://unwilling-camella-axelads-f3f3ad2e.koyeb.app')

export const ID_SUPERUSER = 'ujotze4rf8qhs9k'

/**
 * Calcule le profit/perte en fonction du statut du pari.
 */
const calculerProfitPerte = (statut, mise, cote) => {
  if (statut === 'gagne') return (mise * cote) - mise
  if (statut === 'perdu') return -mise
  return 0 // nul ou cashout (cashout saisi manuellement)
}

export const creerPari = async (donnees) => {
  try {
    return await pb.collection('paris').create({
      ...donnees,
      user: pb.authStore.record?.id,
    })
  } catch (error) {
    console.error('creerPari erreur:', error)
    throw error
  }
}

export const mettreAJourResultat = async (id, statut, scoreFinal) => {
  try {
    const pari = await pb.collection('paris').getOne(id)
    const profitPerte = calculerProfitPerte(statut, pari.mise, pari.cote)
    return await pb.collection('paris').update(id, {
      statut,
      score_final: scoreFinal,
      profit_perte: profitPerte,
    })
  } catch (error) {
    console.error('mettreAJourResultat erreur:', error)
    throw error
  }
}

export const getParisgagnants = async () => {
  try {
    const userId = pb.authStore.record?.id
    return await pb.collection('paris').getFullList({
      filter: `statut = "gagne" && user = "${userId}"`,
      sort: '-created',
    })
  } catch (error) {
    console.error('getParisgagnants erreur:', error)
    throw error
  }
}

export const getTousLesParis = async () => {
  try {
    const userId = pb.authStore.record?.id
    const estAdmin = userId === ID_SUPERUSER
    return await pb.collection('paris').getFullList({
      sort: '-date_match',
      ...(estAdmin ? {} : { filter: `user = "${userId}"` }),
    })
  } catch (error) {
    console.error('getTousLesParis erreur:', error)
    throw error
  }
}

export const getParisEnAttente = async () => {
  try {
    const userId = pb.authStore.record?.id
    return await pb.collection('paris').getFullList({
      filter: `statut = "en_attente" && user = "${userId}"`,
      sort: '-date_match',
    })
  } catch (error) {
    console.error('getParisEnAttente erreur:', error)
    throw error
  }
}

export const supprimerPari = async (id) => {
  try {
    return await pb.collection('paris').delete(id)
  } catch (error) {
    console.error('supprimerPari erreur:', error)
    throw error
  }
}

// ─── Profils utilisateurs ─────────────────────────────────────────────────────

export const getProfil = async () => {
  try {
    const userId = pb.authStore.record?.id
    if (!userId) return null
    const resultats = await pb.collection('profils').getFullList({
      filter: `user = "${userId}"`,
    })
    return resultats.length > 0 ? resultats[0] : null
  } catch (error) {
    console.error('getProfil erreur:', error)
    return null
  }
}

// L'avatar est stocké sur la collection users (champ natif, mappé OAuth2)
export const getUrlAvatar = () => {
  const user = pb.authStore.record
  if (!user?.avatar) return null
  return pb.files.getURL(user, user.avatar, { collection: 'users' })
}

export const mettreAJourAvatar = async (fichierAvatar) => {
  try {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Utilisateur non connecté')
    const formData = new FormData()
    formData.append('avatar', {
      uri: fichierAvatar.uri,
      name: 'avatar.webp',
      type: 'image/webp',
    })
    const userMisAJour = await pb.collection('users').update(userId, formData)
    pb.authStore.save(pb.authStore.token, userMisAJour)
    return userMisAJour
  } catch (error) {
    console.error('mettreAJourAvatar erreur:', error)
    throw error
  }
}

export const sauvegarderProfil = async (donnees) => {
  try {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Utilisateur non connecté')

    const profilExistant = await getProfil()

    if (profilExistant) {
      return await pb.collection('profils').update(profilExistant.id, donnees)
    } else {
      return await pb.collection('profils').create({ user: userId, ...donnees })
    }
  } catch (error) {
    console.error('sauvegarderProfil erreur:', error)
    throw error
  }
}

// ─── Fonctions admin (superuser uniquement) ───────────────────────────────────

export const getToutesLesDonneesAdmin = async () => {
  try {
    const [tousLesParis, toutesLesAlertes, tousProfils] = await Promise.all([
      pb.collection('paris').getFullList({ sort: '-created', expand: 'user' }),
      pb.collection('alertes_bot').getFullList({ sort: '-created', expand: 'user' }),
      pb.collection('profils').getFullList({ expand: 'user' }),
    ])
    return { tousLesParis, toutesLesAlertes, tousProfils }
  } catch (error) {
    console.error('getToutesLesDonneesAdmin erreur:', error)
    throw error
  }
}

export { pb, calculerProfitPerte }
