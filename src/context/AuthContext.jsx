import React, { createContext, useContext, useState, useEffect } from 'react'
import { restaurerSession, supprimerSession } from '../services/auth'

const ContexteAuth = createContext(null)

export const FournisseurAuth = ({ children }) => {
  const [estConnecte, setEstConnecte] = useState(false)
  const [chargementInitial, setChargementInitial] = useState(true)

  useEffect(() => {
    const verifierSession = async () => {
      const sessionValide = await restaurerSession()
      setEstConnecte(sessionValide)
      setChargementInitial(false)
    }
    verifierSession()
  }, [])

  const seConnecter = () => setEstConnecte(true)

  const seDeconnecter = async () => {
    await supprimerSession()
    setEstConnecte(false)
  }

  return (
    <ContexteAuth.Provider value={{ estConnecte, chargementInitial, seConnecter, seDeconnecter }}>
      {children}
    </ContexteAuth.Provider>
  )
}

export const useAuth = () => useContext(ContexteAuth)
