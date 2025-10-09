# Guide de Configuration Vercel - PAJO PHARMA

## 🚨 Problème identifié
L'application utilise SQLite qui ne fonctionne pas sur Vercel. Il faut migrer vers PostgreSQL.

## ✅ Modifications déjà effectuées
- ✅ `prisma/schema.prisma` modifié pour PostgreSQL
- ✅ Scripts de migration préparés

## 🔧 Étapes à suivre pour résoudre les problèmes

### 1. Créer une base PostgreSQL gratuite

**Option A : Neon (Recommandé)**
1. Aller sur https://neon.tech
2. Créer un compte gratuit
3. Créer une nouvelle base de données
4. Copier la `DATABASE_URL` (format: `postgresql://username:password@host/database`)

**Option B : Supabase**
1. Aller sur https://supabase.com
2. Créer un compte gratuit
3. Créer un nouveau projet
4. Aller dans Settings > Database
5. Copier la `Connection string`

### 2. Configurer les variables d'environnement sur Vercel

Dans le dashboard Vercel de votre projet :

1. Aller dans **Settings** → **Environment Variables**
2. Ajouter ces variables :

```
DATABASE_URL=postgresql://votre-url-neon-ou-supabase
NEXTAUTH_SECRET=votre-secret-super-securise-de-32-caracteres-minimum
NEXTAUTH_URL=https://votre-domaine.vercel.app
NODE_ENV=production
```

### 3. Redéployer l'application

Après avoir configuré les variables :
1. Aller dans l'onglet **Deployments**
2. Cliquer sur "Redeploy" sur le dernier déploiement
3. Ou faire un nouveau commit pour déclencher un redéploiement

### 4. Initialiser la base de données

Une fois redéployé, visiter ces URLs pour initialiser :
```
https://votre-domaine.vercel.app/api/setup-users
```

### 5. Test de connexion

Utiliser ces identifiants pour tester :
- **Admin** : admin / admin123
- **Vendeur** : vendeur / vendeur123

## 🔍 Diagnostic des erreurs actuelles

### Erreur actuelle
```
❌ Erreur: Unexpected token '<', "<!doctype "... is not valid JSON
```

**Cause** : L'application retourne une page HTML d'erreur au lieu de JSON
**Solution** : Configurer DATABASE_URL pour PostgreSQL

### URLs à tester après correction
- API Setup: `https://votre-domaine.vercel.app/api/setup-users`
- API Login: `https://votre-domaine.vercel.app/api/test-login`
- Health Check: `https://votre-domaine.vercel.app/api/health`

## 📝 Variables d'environnement requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@host/db` |
| `NEXTAUTH_SECRET` | Clé secrète (32+ caractères) | `super-secret-key-32-chars-min` |
| `NEXTAUTH_URL` | URL de l'application | `https://votre-app.vercel.app` |
| `NODE_ENV` | Environnement | `production` |

## 🚀 Commandes utiles après migration

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma db push

# Voir l'état de la base
npx prisma db seed
```

## ⚠️ Points d'attention

1. **Ne pas** utiliser SQLite sur Vercel
2. **Toujours** configurer DATABASE_URL avant le déploiement
3. **Vérifier** que les migrations sont appliquées
4. **Tester** l'API setup-users après chaque déploiement

## 📞 Test après correction

Une fois corrigé, ces commandes devraient fonctionner :

```bash
# Local
node test-production-auth.js

# Ou via curl
curl https://votre-domaine.vercel.app/api/setup-users
```