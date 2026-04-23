# Journal des retours traités

---

## Traité le 2026-04-23

### Historique des paris dans le désordre lors de validations groupées

- **Retour original :** "L'historique des paris n'est pas dans l'ordre chronologique par rapport aux dates renseignées lors de la prise de pari mais dans l'ordre de validation du résultat de match. Si on décide par ex de valider les matchs des 3 derniers jours au même moment on risque d'avoir un désordre. Ce qui fausse également la séries de victoires/défaites dans le menu."
- **Correction appliquée :** Ajout d'un tri secondaire par `created` (date de saisie du pari) dans tous les contextes de tri par `date_match`. Quand plusieurs paris partagent la même date de match, PocketBase utilisait implicitement `updated` comme critère secondaire, ce qui faisait remonter les paris validés en dernier — provoquant le désordre signalé. Le tri est maintenant stable : `date_match` en primaire, `created` en secondaire. Les calculs JS de séries (série en cours et meilleure série) bénéficient du même correctif.
- **Fichiers modifiés :**
  - `src/services/pocketbase.js` — `getTousLesParis()` et `getParisEnAttente()` : `sort: '-date_match,-created'`
  - `src/screens/HomeScreen.jsx` — `calculerSerieEnCours()` : tri secondaire par `created`
  - `src/services/stats.js` — `calculerMeilleureSerieVictoires()` et `calculerHistoriqueBankroll()` : tri secondaire par `created`

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
