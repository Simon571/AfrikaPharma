# Guide de Déploiement - PAJO PHARMA

## 📋 Prérequis

### Environnement de développement
- Node.js 18+ 
- npm ou yarn
- Git

### Environnement de production
- Serveur compatible Node.js
- Base de données (SQLite pour développement, PostgreSQL/MySQL recommandé pour production)
- Certificat SSL (recommandé)

## 🚀 Déploiement en production

### 1. Configuration de l'environnement

Créez un fichier `.env.production` :

```env
# Base URL de l'application (OBLIGATOIRE)
NEXTAUTH_URL=https://votre-domaine.com
NEXTAUTH_SECRET=votre-secret-super-securise-de-production-32-caracteres-minimum

# Base de données (Remplacez par PostgreSQL/MySQL en production)
DATABASE_URL="postgresql://user:password@localhost:5432/pajo_pharma"

# Configuration Firebase (si utilisé)
FIREBASE_PROJECT_ID=pajo-pharma-1914
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@pajo-pharma-1914.iam.gserviceaccount.com

# Variables de production
NODE_ENV=production
PORT=3000

# Logging
LOG_LEVEL=warn
```

### 2. Installation et build

```bash
# Cloner le repository
git clone [URL_DU_REPO]
cd pajo-pharma

# Installer les dépendances
npm install

# Générer le client Prisma
npm run db:generate

# Exécuter les migrations
npm run db:migrate

# Valider la base de données
npm run validate-db

# Vérifications pré-build
npm run type-check
npm run lint

# Build pour production
npm run build

# Démarrer en production
npm run start:prod
```

### 3. Avec Docker (optionnel)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Générer Prisma Client
RUN npx prisma generate

# Build de l'application
RUN npm run build

# Exposer le port
EXPOSE 3000

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Démarrer l'application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/pajo_pharma
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=pajo_pharma
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 🔒 Configuration de sécurité

### Variables d'environnement critiques

1. **NEXTAUTH_SECRET** : Générez avec `openssl rand -base64 32`
2. **DATABASE_URL** : Utilisez des connexions chiffrées en production
3. **Certificats SSL** : Obligatoires pour HTTPS

### Headers de sécurité

Les headers suivants sont automatiquement configurés dans `next.config.ts` :
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: origin-when-cross-origin

## 📊 Monitoring et maintenance

### Logs de l'application

Les logs sont disponibles via :
```bash
# Logs de production
npm run logs

# Monitoring en temps réel
tail -f logs/app.log
```

### Scripts de maintenance

```bash
# Validation de la base de données
npm run validate-db

# Optimisation de la base de données
npm run optimize-db

# Sauvegarde
npm run backup

# Vérifications de santé
npm run health-check
```

### Monitoring des performances

1. **Métriques de base de données** : Surveillez les requêtes lentes
2. **Mémoire et CPU** : Utilisez `htop` ou équivalent
3. **Logs d'erreur** : Vérifiez régulièrement `/api/log-error`

## 🔄 Processus de mise à jour

### Mise à jour standard

```bash
# 1. Sauvegarder la base de données
npm run backup

# 2. Arrêter l'application
pm2 stop pajo-pharma

# 3. Récupérer les modifications
git pull origin main

# 4. Installer les nouvelles dépendances
npm install

# 5. Exécuter les migrations
npm run db:migrate

# 6. Rebuild l'application
npm run build

# 7. Redémarrer
pm2 start pajo-pharma
```

### Migration de base de données

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name nom_migration

# Appliquer en production
npx prisma migrate deploy

# Reset complet (ATTENTION: perte de données)
npx prisma migrate reset
```

## 🌐 Déploiement sur différentes plateformes

### Vercel (Recommandé)

```bash
# Installation de Vercel CLI
npm i -g vercel

# Configuration
vercel login
vercel

# Variables d'environnement
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add DATABASE_URL
```

### Railway

```bash
# Installation Railway CLI
npm install -g @railway/cli

# Déploiement
railway login
railway init
railway up
```

### DigitalOcean App Platform

1. Connectez votre repository GitHub
2. Configurez les variables d'environnement
3. Définissez le build command: `npm run build`
4. Définissez le run command: `npm start`

## 🚨 Résolution de problèmes

### Erreurs communes

1. **"NEXTAUTH_URL not found"**
   - Vérifiez que la variable est définie dans `.env.production`
   - Utilisez une URL complète avec protocole (https://)

2. **Erreurs de base de données**
   - Vérifiez la chaîne de connexion DATABASE_URL
   - Assurez-vous que les migrations sont à jour

3. **Problèmes de build**
   - Nettoyez le cache : `rm -rf .next && npm run build`
   - Vérifiez les erreurs TypeScript : `npm run type-check`

### Support et maintenance

- **Logs** : Consultez `/var/log/pajo-pharma/`
- **Monitoring** : Utilisez les endpoints `/api/health`
- **Sauvegarde** : Automatisez avec des cron jobs

## 📈 Optimisations post-déploiement

1. **CDN** : Configurez Cloudflare ou équivalent
2. **Cache** : Activez le cache Redis si nécessaire
3. **Compression** : Gzip est activé par défaut
4. **Images** : Optimisation automatique avec Next.js Image
5. **Bundle** : Analysez avec `npm run build:analyze`

---

**Note** : Ce guide couvre les aspects essentiels du déploiement. Pour des configurations spécifiques ou des problèmes particuliers, consultez la documentation technique ou contactez l'équipe de développement.