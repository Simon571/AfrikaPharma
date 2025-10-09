# Guide de création d'APK Android pour PAJO PHARMA

## 🎯 Option 1 : Capacitor (Recommandée)

Capacitor permet de créer une APK native à partir de votre application Next.js existante.

### Installation

```bash
# Installer Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialiser Capacitor
npx cap init "PAJO PHARMA" "com.pajopharma.app"

# Ajouter la plateforme Android
npx cap add android
```

### Configuration

1. **Configurer capacitor.config.ts :**

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pajopharma.app',
  appName: 'PAJO PHARMA',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#ffffff"
    }
  }
};

export default config;
```

2. **Modifier next.config.ts pour export statique :**

```typescript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: './',
  // Autres configurations...
};
```

3. **Ajouter scripts dans package.json :**

```json
{
  "scripts": {
    "build:mobile": "next build && npx cap sync",
    "android:dev": "npm run build:mobile && npx cap run android",
    "android:build": "npm run build:mobile && npx cap build android"
  }
}
```

### Build et génération APK

```bash
# Build pour mobile
npm run build:mobile

# Ouvrir dans Android Studio
npx cap open android

# Ou directement build l'APK
npm run android:build
```

---

## 🔧 Option 2 : Cordova (Alternative)

### Installation

```bash
# Installer Cordova
npm install -g cordova

# Créer projet Cordova
cordova create pajo-pharma-mobile com.pajopharma.app "PAJO PHARMA"
cd pajo-pharma-mobile

# Ajouter plateforme Android
cordova platform add android
```

### Configuration

1. **Copier le build Next.js dans www/ :**

```bash
# Dans votre projet principal
npm run build

# Copier le contenu de 'out' vers le dossier 'www' de Cordova
cp -r out/* ../pajo-pharma-mobile/www/
```

2. **Build APK :**

```bash
# Debug APK
cordova build android

# Release APK (signée)
cordova build android --release
```

---

## 📱 Option 3 : PWA + TWA (Progressive Web App)

Transformez votre app en PWA puis en APK via Trusted Web Activities.

### 1. Configuration PWA

**public/manifest.json :**

```json
{
  "name": "PAJO PHARMA",
  "short_name": "PajoPharma",
  "description": "Système de gestion de pharmacie",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png", 
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker (public/sw.js) :**

```javascript
const CACHE_NAME = 'pajo-pharma-v1';
const urlsToCache = [
  '/',
  '/static/css/',
  '/static/js/',
  '/api/medications',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
```

### 2. Génération APK avec PWA Builder

```bash
# Installer PWA Builder CLI
npm install -g @pwabuilder/cli

# Générer APK
pwa-builder https://votre-domaine.com --platforms android
```

---

## 🎨 Optimisations pour Mobile

### Styles responsive supplémentaires

**styles/mobile.css :**

```css
@media (max-width: 768px) {
  /* Navigation mobile */
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  /* Tables responsive */
  .table-container {
    overflow-x: auto;
  }
  
  /* Boutons plus grands pour touch */
  .btn-mobile {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Scanner amélioré */
  .scanner-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }
}
```

### Configuration base de données mobile

**Pour Capacitor, adapter la DB :**

```typescript
// capacitor-sqlite.config.ts
import { CapacitorSQLite } from '@capacitor-community/sqlite';

export const initMobileDB = async () => {
  if (Capacitor.isNativePlatform()) {
    // Utiliser SQLite native sur mobile
    const db = await CapacitorSQLite.createConnection({
      database: 'pajo-pharma.db',
      version: 1,
    });
    return db;
  } else {
    // Utiliser la DB web normale
    return prisma;
  }
};
```

---

## 🔐 Considérations de sécurité pour mobile

1. **Variables d'environnement :**
   - Les secrets ne doivent PAS être inclus dans l'APK
   - Utilisez un serveur backend pour les opérations sensibles

2. **Authentification :**
   - Implémentez la biométrie si nécessaire
   - Timeout de session plus court sur mobile

3. **Données locales :**
   - Chiffrement des données sensibles
   - Synchronisation serveur obligatoire

---

## 🚀 Recommendation finale

**Pour PAJO PHARMA, je recommande l'Option 1 (Capacitor)** car :

✅ Garde votre code Next.js intact  
✅ Accès aux APIs natives (caméra, stockage)  
✅ Performance native  
✅ Facilité de maintenance  
✅ Compatible avec votre architecture actuelle

Voulez-vous que je vous aide à implémenter Capacitor pour votre projet ?