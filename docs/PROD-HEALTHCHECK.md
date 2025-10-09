# Vérification de santé des déploiements (Production)

Ce document décrit comment vérifier automatiquement l'état de vos déploiements Vercel (health + test-login) et comment intégrer un contrôle dans CI (GitHub Actions).

Prérequis
- Node.js installé localement
- Le script `scripts/check-two-prod.js` (fourni) qui teste `/api/health` et `/api/test-login` pour les deux domaines

Obtenir un token de contournement (Bypass Token) dans Vercel
1. Dans Vercel, ouvrez le projet souhaité (ex: `pajo-pharma-oftri0ikc-nzamba-simons-projects`).
2. Allez dans Settings → Security / Access Protection (Password Protection).
3. Générez un **Bypass Token** (Authentication bypass token) et copiez la chaîne.
4. Traitez ce token comme un secret — ne le publiez pas.

Tester localement
- Tester sans token (pour les déploiements publics) :

```powershell
# exécute les vérifications pour les deux domaines configurés dans le script
node .\scripts\check-two-prod.js
```

- Tester avec token (nécessaire si un déploiement est protégé) :

```powershell
# méthode 1 : exporter en variable d'environnement
$env:BYPASS_TOKEN = '<VOTRE_TOKEN>'
node .\scripts\check-two-prod.js

# méthode 2 : passer en argument CLI
node .\scripts\check-two-prod.js '<VOTRE_TOKEN>'
```

Remarques :
- Le script envoie un header `Authorization: Bearer <token>` si un token est fourni.
- Le script affiche le status, le content-type et prévisualise le JSON/HTML retourné.

Intégration GitHub Actions (CI)
- Ajoutez le secret `VERCEL_BYPASS_TOKEN` dans votre dépôt GitHub (Settings → Secrets → Actions) pour stocker le token.
- Un workflow exemple est fourni dans `.github/workflows/prod-healthcheck.yml`.

Sécurité
- Gardez le token dans les secrets de GitHub / votre gestionnaire de secrets (ne le collez pas dans les issues ou discussions publiques).
- Si vous ne souhaitez pas gérer de token, désactivez la protection d'accès pour le déploiement dans Vercel (Settings → Access Protection).

Que faire en cas d'alerte
- Si `/api/health` renvoie HTML ou 5xx : vérifier les variables d'environnement en production (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`) et les logs Vercel (Deployments → Logs → Functions).
- Si `test-login` renvoie 401 en UI alors que l'API répond correctement : vérifier la configuration NEXTAUTH, cookies et domaine (NEXTAUTH_URL).

Contact
- Pour automatiser davantage, vous pouvez ajouter checks supplémentaires (métriques de performance, tests E2E UI, etc.).
