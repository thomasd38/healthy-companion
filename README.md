# Application Web — Suivi Perte de Poids

## Objectif global

Créer une application web simple, légère et hébergeable facilement sur GitHub Pages.

L'application doit aider l'utilisateur à :
- suivre son poids
- suivre ses calories
- enregistrer ses recettes
- générer automatiquement des semaines de repas
- intégrer des cheat meals (McDo, etc)
- visualiser son évolution dans le temps

L'objectif principal n'est PAS le fitness hardcore ou le bodybuilding.
L'objectif est :
- simplicité
- régularité
- confort mental
- perte de poids durable

---

# Stack technique

## Frontend

- HTML natif
- CSS natif
- JavaScript natif
- Aucun framework obligatoire
- Application "one page" simple

Objectif :
- facilement modifiable
- facilement compréhensible
- facilement hébergeable

---

## Hébergement

- GitHub Pages

L'application doit fonctionner en pur frontend.

---

## Base de données

- Google Firebase

Utilisation prévue :
- stockage des recettes
- stockage des repas
- stockage des historiques de poids
- stockage des paramètres utilisateur

Firebase conseillé :
- Firestore

---

# Fonctionnalités principales

---

# 1. Gestion des recettes

## Objectif

Pouvoir créer facilement des recettes personnalisées.

Exemples :
- Pâtes bolo
- Riz poulet curry
- Pâtes saumon crème
- McDo type 1

---

## Fonctionnalités

### Création de recette

Chaque recette doit contenir :

- nom
- catégorie
- liste des ingrédients
- calories totales (calculés par les calories additionnés de chaque ingrédient)
- notes optionnelles

---

## Structure ingrédient

Chaque ingrédient doit pouvoir contenir :

- nom
- quantité
- calories

Exemple :

| Ingrédient | Quantité | Calories |
|---|---|---|
| Pâtes sèches | 150g | 540 |
| Sauce bolo | 300g | 245 |
| Parmesan | 30g | 120 |

---

## Fonctionnement calories

L'application doit automatiquement :

- calculer les calories totales

---

## Gestion des recettes

Pouvoir :
- créer
- modifier
- supprimer
- dupliquer
- rechercher
- filtrer

---

# 2. Génération automatique de semaine

## Objectif

Pouvoir générer automatiquement une semaine de repas.

L'application doit pouvoir proposer une semaine complète avec :
- petit déjeuner
- déjeuner
- goûter
- dîner

---

## Fonctionnement

Le système choisit des recettes aléatoirement parmi les recettes disponibles.

---

## Contraintes importantes

Le générateur doit :

- afficher les calories de chaque repas
- afficher le total par jour
- afficher le total moyen sur la semaine
- inclure parfois des cheat meals
- rester dans une plage calorique définie
- avoir des options pour pouvoir jouer avec les curseurs (curseaur cheat meal par semaine, curseur calories par jour en moyenne, curseur écart max de calories entre deux jours, etc)

---

## Exemple de logique

Objectif utilisateur :
- 2700 kcal / jour

Tolérance :
- +/- 300 kcal

Le système peut générer :

| Jour | Calories |
|---|---|
| Lundi | 2500 |
| Mardi | 2850 |
| Mercredi | 3000 |
| Jeudi | 2600 |
| Vendredi | 2750 |
| Samedi | 3200 |
| Dimanche | 2400 |

Puis afficher :
- moyenne hebdomadaire
- total semaine

---

## Gestion des cheat meals

Certaines recettes doivent pouvoir être taggées :

- cheat meal
- fast food
- plaisir

Le générateur doit pouvoir :
- limiter le nombre de cheat meals
- ex : maximum 2 par semaine

---

# 3. Suivi du poids

## Objectif

Avoir un système ultra simple de suivi du poids.

---

## Fonctionnalités

Pouvoir :
- ajouter un poids
- modifier un poids
- supprimer un poids

Chaque entrée contient :
- date
- poids

---

## Affichage

Afficher :
- courbe d'évolution du poids
- différence depuis le début
- poids actuel
- meilleur poids

---

## Graphique

Utiliser une librairie légère type :
- Chart.js

Objectif :
- graphique propre
- responsive
- simple

---

# 4. Dashboard principal

## Objectif

Avoir un écran d'accueil clair.

---

## Le dashboard doit afficher

### Calories

- objectif calorique
- calories du jour
- moyenne semaine

---

### Poids

- poids actuel
- évolution récente
- graphique rapide

---

### Menus

- menu du jour
- menu de demain

---

# 5. Philosophie UX/UI

## Important

L'application ne doit PAS ressembler à :
- une appli fitness agressive
- une appli de musculation hardcore
- une appli culpabilisante

---

## Le ton doit être

- simple
- calme
- propre
- minimaliste
- rassurant

---

## Objectif UX

L'utilisateur doit ressentir :
- simplicité
- absence de pression
- facilité d'utilisation
- plaisir d'utilisation

---

# 6. Architecture projet

## Structure suggérée

```txt
/index.html
/style.css
/app.js
/firebase.js
/components/
/pages/
```

---

# 7. Firebase

## Collections Firestore suggérées

### recipes

```json
{
  "name": "Pâtes bolo",
  "category": "pasta",
  "ingredients": [],
  "totalCalories": 900,
  "tags": ["comfort"]
}
```

---

### weights

```json
{
  "date": "2026-05-18",
  "weight": 140
}
```

---

### generated_weeks

```json
{
  "startDate": "2026-05-18",
  "days": []
}
```

---

# 8. Évolutions futures possibles

## Idées futures

- connexion Google
- export PDF
- système de favoris
- statistiques avancées
- suivi protéines
- génération IA de recettes
- estimation perte de poids
- système de streaks
- rappels

---

# 9. Priorité MVP

## IMPORTANT

Commencer SIMPLE.

Le MVP doit uniquement contenir :

1. gestion recettes
2. génération semaine
3. suivi poids
4. dashboard simple
5. firebase

Le reste est secondaire.

---

# 10. Vision produit

Le produit doit aider quelqu'un à :

- perdre du poids durablement
- sans obsession
- sans culpabilité
- sans système compliqué
- avec des repas agréables
- avec de la flexibilité
- avec des cheat meals intégrés intelligemment

L'application doit donner une sensation de :
- contrôle simple
- progression lente mais stable
- confort mental
- durabilité sur plusieurs années.

