import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withTrialCheck } from '@/lib/trial-middleware';

/**
 * API pour vérifier l'accès à une fonctionnalité
 * POST /api/trial/check-access
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { feature, action } = await request.json();
    
    if (!feature) {
      return NextResponse.json({ error: 'Fonctionnalité non spécifiée' }, { status: 400 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // Définir les règles d'accès par fonctionnalité
    const accessRules: Record<string, {
      trialAccess: boolean;
      premiumOnly: boolean;
      adminOnly: boolean;
      description: string;
    }> = {
      'inventory-management': {
        trialAccess: true,
        premiumOnly: false,
        adminOnly: false,
        description: 'Gestion des stocks'
      },
      'sales-management': {
        trialAccess: true,
        premiumOnly: false,
        adminOnly: false,
        description: 'Gestion des ventes'
      },
      'user-management': {
        trialAccess: false,
        premiumOnly: true,
        adminOnly: true,
        description: 'Gestion des utilisateurs'
      },
      'data-export': {
        trialAccess: false,
        premiumOnly: true,
        adminOnly: false,
        description: 'Export de données'
      },
      'advanced-reports': {
        trialAccess: false,
        premiumOnly: true,
        adminOnly: false,
        description: 'Rapports avancés'
      },
      'bulk-operations': {
        trialAccess: false,
        premiumOnly: true,
        adminOnly: false,
        description: 'Opérations en lot'
      }
    };

    const rule = accessRules[feature];
    if (!rule) {
      return NextResponse.json({ error: 'Fonctionnalité non reconnue' }, { status: 400 });
    }

    // Vérifier les permissions administrateur
    if (rule.adminOnly && userRole !== 'admin') {
      return NextResponse.json({
        hasAccess: false,
        reason: 'admin_required',
        message: 'Cette fonctionnalité nécessite des privilèges administrateur',
        feature: rule.description
      });
    }

    // Obtenir le statut d'essai (appel à notre API)
    const trialResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/trial/status`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    let trialStatus = null;
    let hasTrialAccess = true; // Par défaut, donner accès

    if (trialResponse.ok) {
      const trialData = await trialResponse.json();
      trialStatus = trialData.status;
      hasTrialAccess = trialData.hasAccess;
    }

    // Vérifier l'accès basé sur le statut d'essai
    if (!hasTrialAccess && !rule.trialAccess) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'trial_expired',
        message: 'Votre période d\'essai a expiré. Cette fonctionnalité nécessite un abonnement premium.',
        feature: rule.description,
        trialStatus,
        upgradeRequired: true
      });
    }

    // Si l'utilisateur est en essai mais la fonctionnalité est premium seulement
    if (trialStatus?.subscriptionType === 'trial' && rule.premiumOnly) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'premium_required',
        message: `${rule.description} est disponible uniquement avec un abonnement premium.`,
        feature: rule.description,
        trialStatus,
        upgradeRequired: true
      });
    }

    // Accès accordé
    return NextResponse.json({
      hasAccess: true,
      reason: 'access_granted',
      message: `Accès autorisé à ${rule.description}`,
      feature: rule.description,
      trialStatus
    });

  } catch (error) {
    console.error('Erreur lors de la vérification d\'accès:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la vérification',
      hasAccess: false
    }, { status: 500 });
  }
}

/**
 * GET /api/trial/check-access?feature=FEATURE_NAME
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const feature = searchParams.get('feature');

    if (!feature) {
      return NextResponse.json({ error: 'Paramètre feature manquant' }, { status: 400 });
    }

    // Créer un objet request pour POST
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ feature })
    });

    return await POST(postRequest);

  } catch (error) {
    console.error('Erreur lors de la vérification d\'accès (GET):', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la vérification',
      hasAccess: false
    }, { status: 500 });
  }
}