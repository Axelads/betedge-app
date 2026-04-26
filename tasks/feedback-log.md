# Journal des retours traités

---

## Traité le 2026-04-26

### Option Cashout lors de la saisie de résultat

- **Retour original :** "Ajouter une option "Cashout" quand on donne le résultat (Qui ajoute une case en plus du score avec le montant récupéré. Faire les calculs en conséquence et afficher la case soit en orange en toutes circonstances, soit en vert si le cashout est supérieur à la mise et en rouge s'il est inférieur à la mise, à toi de choisir)"
- **Correction appliquée :** Quand l'utilisateur sélectionne "Cashout" dans la modale de saisie de résultat, un champ "Montant récupéré (€)" apparaît sous le score. Ce montant est obligatoire (validation avant sauvegarde). Le profit/perte est calculé automatiquement : `profit = montant_cashout - mise`. Les cartes de l'accueil et de l'historique affichent "Cashout : X.XX€" en vert si le montant récupéré est supérieur à la mise, en rouge s'il est inférieur. La pré-saisie fonctionne en mode modification (le montant cashout est reconstruit depuis `profit_perte + mise`).
- **Fichiers modifiés :**
  - `src/services/pocketbase.js` — `calculerProfitPerte()` : nouveau paramètre `montantCashout`; `mettreAJourResultat()` : nouveau paramètre `montantCashout`
  - `src/screens/HomeScreen.jsx` — `ModaleResultat` : état `montantCashout`, validation, champ conditionnel; `CartePariRecent` : affichage "Cashout : X€" coloré
  - `src/screens/BetHistoryScreen.jsx` — `ModaleResultat` : même logique; `LignePari` : affichage "Cashout : X€" coloré

---

## Traité le 2026-04-25

### Multi-sélection de sports pour combinés multisports

- **Retour original :** "Donner la possibilité de cliquer sur plusieurs sports différents lors d'une prise de pari pour des combinés multisports"
- **Correction appliquée :** La sélection de sport dans le formulaire de prise de pari passe d'un choix unique à une multi-sélection par toggle. Les sports sélectionnés sont stockés dans un tableau `sports` en local, puis joints par virgule (`'football,tennis'`) dans le champ `sport` de PocketBase lors de l'enregistrement — compatible avec le champ texte existant. Un bandeau récapitulatif "Combiné multisport : Football + Tennis" s'affiche automatiquement dès que deux sports ou plus sont sélectionnés. L'affichage dans l'historique, la home et la vue admin gère désormais les valeurs multi-sport en les splitant et en concatenant les labels/emojis.
- **Fichiers modifiés :**
  - `src/screens/NewBetScreen.jsx` — état `sports: []`, fonction `basculerSport()`, validation, envoi multi-sport, bandeau récapitulatif
  - `src/screens/BetHistoryScreen.jsx` — `labelSportCompose()`, ajout `hockey` dans `LABEL_SPORT`
  - `src/screens/HomeScreen.jsx` — `emojiSportCompose()`, ajout `hockey` dans `EMOJI_SPORT`
  - `src/screens/AdminScreen.jsx` — `emojiSportCompose()`, ajout `hockey` dans `EMOJI_SPORT`

---

## En attente de clarification — 2026-04-24

### Refonte formulaire prise de pari + paris combinés multi-lignes

- **Retour original :** "Sans doute le truc le plus technique et pas sûr que ça vaille le coup à court terme mais dans un monde idéal où tout se fait tout seul imaginons 🤗: Inverser l'ordre, mettre le type de match au dessus de l'intitulé lors de la prise de pari, je pense notamment aux paris combinés. En sélectionnant les paris combinés on pourrait alors avoir d'office un deuxième intitulé qui pop, et un + pour ajouter des paris. Ca permet d'être plus précis mais forcément ça doit pas être facile à build et ça implique aussi de penser l'esthétique après coup dans l'historique de paris. (Et si c'est fait, ajouter un onglet MyMatch ou l'incorporer dans le blaze psq ca revient au même qu'un combiné en fait)"
- **Motif de mise en attente :** Ce retour mêle deux niveaux de complexité très différents — un simple réordonnancement de champs (type de pari avant rencontre) et une refonte architecturale majeure (paris combinés avec N sélections, nouveau schéma PocketBase, affichage dans l'historique, onglet MyMatch/blaze). Thomas lui-même qualifie l'ensemble de "truc le plus technique" et "pas sûr que ça vaille le coup à court terme". Avant toute implémentation, il faut clarifier : (1) faut-il traiter uniquement le réordonnancement des champs, ou l'ensemble ? (2) Que désigne précisément "blaze" dans l'app ?

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
