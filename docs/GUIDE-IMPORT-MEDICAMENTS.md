# Guide d'Import des Médicaments

## Comment utiliser la fonctionnalité d'import

La page "Gestion des médicaments" dispose maintenant d'une fonctionnalité d'import en lot qui vous permet d'ajouter plusieurs médicaments en une seule fois.

### Format requis

Chaque ligne doit respecter le format suivant :
```
Nom | Forme | Prix d'achat | Prix de vente | Quantité | Date d'expiration
```

### Exemple de données à importer

```
Paracétamol | Comprimé | 100 | 150 | 50 | 2025-12-31
Ibuprofène | Comprimé | 120 | 180 | 30 | 2025-11-15
Amoxicilline | Gélule | 200 | 300 | 40 | 2025-10-20
Aspirine | Comprimé | 80 | 120 | 60 | 2026-01-10
Sirop Toux | Sirop | 150 | 250 | 25 | 2025-09-30
Vitamine C | Comprimé | 90 | 140 | 100 | 2026-03-15
Oméprazole | Gélule | 180 | 270 | 35 | 2025-08-25
Dexamethasone | Comprimé | 220 | 320 | 20 | 2025-12-10
Metformine | Comprimé | 160 | 240 | 45 | 2026-02-28
Cétamol | Sirop | 130 | 200 | 30 | 2025-11-05
```

### Instructions d'utilisation

1. **Accédez à la page "Gestion des médicaments"**
   - Connectez-vous en tant qu'administrateur
   - Naviguez vers la section "Gestion des médicaments"

2. **Ouvrez la boîte de dialogue d'import**
   - Cliquez sur le bouton "Importer" en haut à droite de la page

3. **Préparez vos données**
   - Copiez votre liste de médicaments au format requis
   - Assurez-vous que chaque ligne contient tous les champs séparés par des barres verticales (|)

4. **Collez et importez**
   - Collez vos données dans la zone de texte
   - Cliquez sur "Importer les médicaments"

5. **Vérifiez les résultats**
   - Le système vous informera du nombre de médicaments importés avec succès
   - Les lignes avec des erreurs seront signalées

### Conseils

- **Dates** : Utilisez le format YYYY-MM-DD (ex: 2025-12-31)
- **Prix** : Entrez les prix en nombres entiers (ex: 150 pour 150 CDF)
- **Quantités** : Entrez des nombres entiers uniquement
- **Noms** : Évitez les caractères spéciaux dans les noms de médicaments

### Fonctionnalités supplémentaires

- **Tri alphabétique** : La liste des médicaments est maintenant automatiquement triée par ordre alphabétique
- **Recherche** : Utilisez le champ de recherche pour filtrer les médicaments par nom
- **Gestion individuelle** : Vous pouvez toujours ajouter, modifier et supprimer des médicaments individuellement

### Dépannage

Si une ligne n'est pas importée :
- Vérifiez que tous les champs sont présents
- Assurez-vous que les prix et quantités sont des nombres valides
- Vérifiez le format de la date d'expiration
- Évitez les espaces supplémentaires avant ou après les barres verticales

Le système ignorera les lignes incorrectes et continuera l'import des lignes valides.