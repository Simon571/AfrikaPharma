import { signOut, useSession } from 'next-auth/react';
import { useCallback } from 'react';

export function useSmartSignOut() {
  const { data: session } = useSession();

  const smartSignOut = useCallback(() => {
    if (!session?.user?.role) {
      // Si pas de rôle, redirection vers l'accueil
      signOut({ callbackUrl: '/' });
      return;
    }

    // Redirection vers la page de connexion appropriée selon le rôle
    const callbackUrl = session.user.role === 'admin' 
      ? '/login-admin' 
      : '/login-seller';

    signOut({ callbackUrl });
  }, [session?.user?.role]);

  return smartSignOut;
}