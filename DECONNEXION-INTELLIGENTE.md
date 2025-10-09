# Comportement de Déconnexion Intelligent

## Fonctionnement

Le système de déconnexion a été amélioré pour rediriger automatiquement vers la page de connexion appropriée selon le rôle de l'utilisateur.

### 🔄 Redirections Automatiques

- **Admin** → Redirigé vers `/login-admin`
- **Vendeur** → Redirigé vers `/login-seller`
- **Utilisateur sans rôle** → Redirigé vers `/` (page d'accueil)

### 📍 Emplacements des Boutons de Déconnexion

1. **Sidebar Layout** (`src/components/layout/sidebar-layout.tsx`)
   - Bouton dans la barre latérale, visible sur tous les dashboards
   - Utilisé par : Admin Dashboard, Seller Dashboard, etc.

2. **Paramètres Profil** (`src/components/users/profile-settings.tsx`)
   - Bouton dans les paramètres de profil utilisateur
   - Accessible via l'avatar dans l'en-tête

### ⚙️ Implementation Technique

Le hook `useSmartSignOut` (`src/hooks/use-smart-signout.ts`) centralise la logique :

```typescript
// Déconnexion intelligente selon le rôle
const smartSignOut = useCallback(() => {
  const callbackUrl = session.user.role === 'admin' 
    ? '/login-admin' 
    : '/login-seller';
  signOut({ callbackUrl });
}, [session?.user?.role]);
```

### 🧪 Test

1. **Connexion Admin:**
   - Aller sur http://localhost:3001/login-admin
   - Se connecter avec : `admin` / `admin123`
   - Cliquer sur "Déconnexion"
   - **Résultat attendu:** Redirection vers `/login-admin`

2. **Connexion Vendeur:**
   - Aller sur http://localhost:3001/login-seller
   - Se connecter avec : `vendeur` / `vendeur123`
   - Cliquer sur "Déconnexion"
   - **Résultat attendu:** Redirection vers `/login-seller`

### ✅ Avantages

- ✅ Expérience utilisateur améliorée
- ✅ Pas besoin de naviguer manuellement vers la bonne page de connexion
- ✅ Cohérence dans toute l'application
- ✅ Sécurité maintenue (même comportement NextAuth)