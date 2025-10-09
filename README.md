# PAJO PHARMA - Système de Gestion de Pharmacie

## 📖 Description

PAJO PHARMA est une application web complète de gestion de pharmacie développée avec Next.js 15, TypeScript, et Prisma. Elle permet la gestion des stocks, des ventes, des utilisateurs et des rapports financiers.

## ✨ Fonctionnalités

### 👨‍💼 Interface Administrateur
- **Dashboard complet** avec statistiques en temps réel
- **Gestion des médicaments** (CRUD, codes-barres, stocks)
- **Gestion des utilisateurs** (admin/vendeur avec authentification)
- **Rapports financiers** globaux et détaillés
- **Inventaire** avec filtres et recherche
- **Historique des mouvements de stock** (entrées, corrections)

### 👩‍💻 Interface Vendeur
- **Dashboard simplifié** avec ventes du jour
- **Point de vente** intuitif avec scanner de codes-barres
- **Gestion des expenses** personnelles
- **Historique des ventes** personnelles

### 🔐 Sécurité
- **Authentification** NextAuth avec rôles (admin/seller)
- **Middleware** de protection des routes
- **Validation** des entrées API
- **Headers de sécurité** configurés

## 🛠️ Technologies

- **Framework**: Next.js 15.3.5 (App Router)
- **Language**: TypeScript 5
- **Base de données**: Prisma ORM + SQLite (dev) / PostgreSQL (prod)
- **Authentification**: NextAuth.js
- **UI**: TailwindCSS + Shadcn/ui
- **Icons**: Lucide React
- **Validation**: React Hook Form + Zod
- **State Management**: Zustand

## 🚀 Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Git

### Configuration

1. **Cloner le projet**
```bash
git clone [URL_DU_REPO]
cd pajo-pharma
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env.local

# Éditer les variables d'environnement
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=your-secret-key
# DATABASE_URL="file:./dev.db"
```

4. **Base de données**
```bash
# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:migrate

# Peupler la base de données (optionnel)
npm run db:seed
```

5. **Démarrer en développement**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 📁 Structure du projet

```
pajo-pharma/
├── src/
│   ├── app/                    # Pages et API routes (App Router)
│   │   ├── (app)/             # Routes protégées de l'application
│   │   ├── admin/             # Pages administrateur
│   │   ├── api/               # API endpoints
│   │   └── login-*/           # Pages de connexion
│   ├── components/            # Composants React
│   │   ├── admin/            # Composants admin
│   │   ├── auth/             # Composants d'authentification
│   │   ├── ui/               # Composants UI de base
│   │   └── ...
│   ├── lib/                  # Utilitaires et configuration
│   │   ├── actions/          # Server actions
│   │   ├── store/            # État global (Zustand)
│   │   ├── auth.ts           # Configuration NextAuth
│   │   ├── prisma.ts         # Client Prisma
│   │   └── ...
│   └── types/                # Définitions TypeScript
├── prisma/                   # Schéma et migrations
├── public/                   # Assets statiques
├── docs/                     # Documentation
└── scripts/                  # Scripts utilitaires
```

## 🎯 Utilisation

### Connexion
- **Admin**: Accès complet à toutes les fonctionnalités
- **Vendeur**: Accès limité aux ventes et dashboard personnel

### Gestion des stocks
1. **Ajouter des médicaments** via l'interface admin
2. **Gérer les entrées/sorties** de stock
3. **Suivre l'historique** des mouvements

### Point de vente
1. **Scanner ou saisir** les codes-barres
2. **Calculer automatiquement** les totaux
3. **Enregistrer les ventes** avec détails client

### Rapports
- **Dashboard temps réel** avec métriques clés
- **Historique des ventes** filtrable
- **Analyse financière** détaillée

## 🧪 Tests et validation

```bash
# Vérification TypeScript
npm run type-check

# Linting
npm run lint

# Test de build
npm run test:build

# Validation base de données
node scripts/validate-db.ts
```

## 📦 Déploiement

Voir le guide détaillé : [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

### Production rapide
```bash
# Build
npm run build

# Démarrer
npm run start:prod
```

## 🐛 Résolution de problèmes

### Problèmes courants

1. **Erreurs de build TypeScript**
   ```bash
   npm run type-check
   ```

2. **Problèmes de base de données**
   ```bash
   npm run db:reset
   npm run db:migrate
   ```

3. **Erreurs d'authentification**
   - Vérifiez `NEXTAUTH_SECRET` dans `.env.local`
   - Redémarrez le serveur de développement

## 📊 Surveillance et logs

- **Logs de développement**: Console du navigateur + terminal
- **Logs de production**: Voir `/api/log-error` et logs serveur
- **Monitoring**: Dashboard admin avec métriques temps réel

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les modifications (`git commit -m 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence privée. Tous droits réservés.

## 📞 Support

Pour toute question ou problème :
- Consultez la documentation dans `/docs/`
- Vérifiez les logs d'erreur
- Contactez l'équipe de développement

---

**Version**: 1.0.0  
**Dernière mise à jour**: Janvier 2025
