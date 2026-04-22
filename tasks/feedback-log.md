# Journal des retours traités

---

## Traité le 2026-04-22

### Modification du résultat d'un pari après validation

- **Retour original :** "Il faudrait pouvoir modifier les résultats d'un pari après validation (ex: j'ai sans faire exprès noté défaite au lieu de cash out, et je peux plus rectifier)"
- **Correction appliquée :**
  - `BetHistoryScreen.jsx` : le titre de la modale affiche désormais "Modifier le résultat" (au lieu de "Entrer le résultat") quand le pari est déjà validé. Le bouton "Modifier le résultat" n'est plus gris uni (qui évoque un état désactivé) mais adopte un style outline avec une icône crayon, clairement cliquable.
  - `HomeScreen.jsx` : la modale "Derniers paris" s'ouvre désormais pour tous les paris (pas uniquement les "En attente"). Elle pré-remplit automatiquement le statut et le score existants lors d'une correction. Le titre s'adapte ("Entrer le résultat" / "Modifier le résultat").
- **Fichiers modifiés :**
  - `src/screens/BetHistoryScreen.jsx`
  - `src/screens/HomeScreen.jsx`
