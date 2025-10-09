import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware de vérification de période d'essai
 * S'intègre avec le système NextAuth existant
 */

// Routes qui nécessitent une vérification d'essai
const PREMIUM_ROUTES = [
  '/admin-dashboard',
  '/medications',
  '/sales',
  '/api/medications',
  '/api/sales',
  '/api/data/export',
  '/users' // Administration des utilisateurs
];

// Fonctionnalités limitées en version d'essai
const TRIAL_LIMITED_ROUTES = [
  '/api/users',
  '/api/data/export',
  '/api/sales/export'
];

/**
 * Vérifie si une route nécessite une vérification d'essai
 */
function requiresTrialCheck(pathname: string): boolean {
  return PREMIUM_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Vérifie si une route est limitée en version d'essai
 */
function isTrialLimited(pathname: string): boolean {
  return TRIAL_LIMITED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Vérifie le statut d'essai d'un utilisateur
 * Cette fonction sera remplacée par un appel au TrialService une fois les types corrigés
 */
async function checkUserTrialStatus(userId: string): Promise<{
  hasAccess: boolean;
  isExpired: boolean;
  daysRemaining: number;
  subscriptionType: string;
}> {
  try {
    // Pour l'instant, on simule la logique
    // TODO: Remplacer par TrialService.checkTrialStatus(userId) une fois les types Prisma corrigés
    
    // Vérification basique via une requête directe
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/trial/status/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        hasAccess: data.hasAccess || false,
        isExpired: data.status?.subscriptionType === 'expired',
        daysRemaining: data.status?.daysRemaining || 0,
        subscriptionType: data.status?.subscriptionType || 'trial'
      };
    }

    // Par défaut, donner accès si on ne peut pas vérifier
    return {
      hasAccess: true,
      isExpired: false,
      daysRemaining: 30,
      subscriptionType: 'trial'
    };
  } catch (error) {
    console.error('Erreur lors de la vérification d\'essai:', error);
    // En cas d'erreur, on donne l'accès pour éviter de bloquer l'application
    return {
      hasAccess: true,
      isExpired: false,
      daysRemaining: 30,
      subscriptionType: 'trial'
    };
  }
}

/**
 * Middleware principal de vérification d'essai
 */
export async function trialMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  // Passer les routes qui n'ont pas besoin de vérification
  if (!requiresTrialCheck(pathname)) {
    return null; // Continuer le traitement normal
  }

  try {
    // Obtenir le token de session
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      // Pas de token, rediriger vers la connexion
      return NextResponse.redirect(new URL('/login-admin', request.url));
    }

    const userId = token.id as string;
    
    // Vérifier le statut d'essai
    const trialStatus = await checkUserTrialStatus(userId);

    // Si l'essai a expiré, bloquer l'accès aux fonctionnalités premium
    if (trialStatus.isExpired && trialStatus.subscriptionType === 'expired') {
      // Rediriger vers une page d'abonnement
      const subscriptionUrl = new URL('/subscription-required', request.url);
      subscriptionUrl.searchParams.set('feature', pathname);
      subscriptionUrl.searchParams.set('reason', 'expired');
      return NextResponse.redirect(subscriptionUrl);
    }

    // Si la route est limitée en version d'essai et que l'utilisateur n'a pas d'abonnement premium
    if (isTrialLimited(pathname) && trialStatus.subscriptionType === 'trial') {
      const limitedUrl = new URL('/trial-limited', request.url);
      limitedUrl.searchParams.set('feature', pathname);
      limitedUrl.searchParams.set('daysRemaining', trialStatus.daysRemaining.toString());
      return NextResponse.redirect(limitedUrl);
    }

    // Ajouter les informations d'essai aux headers pour l'utilisation côté client
    const response = NextResponse.next();
    response.headers.set('x-trial-status', JSON.stringify({
      hasAccess: trialStatus.hasAccess,
      daysRemaining: trialStatus.daysRemaining,
      subscriptionType: trialStatus.subscriptionType,
      isExpired: trialStatus.isExpired
    }));

    return response;

  } catch (error) {
    console.error('Erreur dans le middleware d\'essai:', error);
    // En cas d'erreur, on laisse passer pour éviter de casser l'application
    return null;
  }
}

/**
 * Hook pour vérifier l'accès à une fonctionnalité côté serveur
 */
export async function requireTrialAccess(
  request: NextRequest, 
  feature: string
): Promise<{ hasAccess: boolean; response?: NextResponse }> {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return {
        hasAccess: false,
        response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
      };
    }

    const userId = token.id as string;
    const trialStatus = await checkUserTrialStatus(userId);

    if (!trialStatus.hasAccess) {
      return {
        hasAccess: false,
        response: NextResponse.json({
          error: 'Accès limité - Période d\'essai expirée',
          trialStatus,
          upgradeRequired: true
        }, { status: 403 })
      };
    }

    // Vérifier les limitations spécifiques par fonctionnalité
    if (feature === 'users' && trialStatus.subscriptionType === 'trial') {
      return {
        hasAccess: false,
        response: NextResponse.json({
          error: 'Gestion des utilisateurs limitée en version d\'essai',
          trialStatus,
          upgradeRequired: true
        }, { status: 403 })
      };
    }

    if (feature === 'export' && trialStatus.subscriptionType === 'trial') {
      return {
        hasAccess: false,
        response: NextResponse.json({
          error: 'Export des données limité en version d\'essai',
          trialStatus,
          upgradeRequired: true
        }, { status: 403 })
      };
    }

    return { hasAccess: true };

  } catch (error) {
    console.error('Erreur lors de la vérification d\'accès:', error);
    return {
      hasAccess: false,
      response: NextResponse.json({ error: 'Erreur de vérification' }, { status: 500 })
    };
  }
}

/**
 * Utilitaire pour vérifier l'accès depuis une API route
 */
export function withTrialCheck(handler: Function, feature?: string) {
  return async function(request: NextRequest, ...args: any[]) {
    if (feature) {
      const accessCheck = await requireTrialAccess(request, feature);
      if (!accessCheck.hasAccess) {
        return accessCheck.response;
      }
    }
    
    return handler(request, ...args);
  };
}