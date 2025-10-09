import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * API pour vérifier le statut d'essai d'un utilisateur
 * GET /api/trial/status - Vérifie le statut de l'utilisateur connecté
 * GET /api/trial/status/[userId] - Vérifie le statut d'un utilisateur spécifique (admin seulement)
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Vérifier le statut de l'essai (version temporaire avec les champs existants)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Calculer les informations d'essai (version temporaire)
    const now = new Date();
    const trialStartDate = user.createdAt; // Utiliser la date de création comme début d'essai
    const defaultTrialDays = 30;
    
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + defaultTrialDays);

    const daysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = defaultTrialDays;
    const daysUsed = totalDays - daysRemaining;
    const isExpired = daysRemaining <= 0;
    
    // Pour l'instant, considérer tous les nouveaux utilisateurs comme étant en essai
    // On ajoute la possibilité d'avoir un statut premium pour les futurs abonnements
    let currentSubscriptionType: 'trial' | 'expired' | 'premium' = isExpired ? 'expired' : 'trial';
    
    // Si l'utilisateur est admin, on lui donne accès premium par défaut pour les tests
    if (user.role === 'admin') {
      currentSubscriptionType = 'premium';
    }

    const trialStatus = {
      isActive: currentSubscriptionType === 'trial' && !isExpired,
      daysRemaining,
      totalDays,
      daysUsed,
      startDate: trialStartDate,
      endDate: trialEndDate,
      subscriptionType: currentSubscriptionType,
      canExtend: currentSubscriptionType === 'trial' && daysRemaining <= 5, // Permettre extension dans les 5 derniers jours
      features: {
        inventory: true,
        sales: true,
        basicReports: true,
        userManagement: currentSubscriptionType === 'premium',
        advancedReports: currentSubscriptionType === 'premium',
        dataExport: currentSubscriptionType === 'premium'
      }
    };

    return NextResponse.json({
      hasAccess: !isExpired || currentSubscriptionType === 'premium',
      status: trialStatus,
      message: isExpired ? 'Votre période d\'essai a expiré' : undefined
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du statut d\'essai:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la vérification du statut',
      hasAccess: false
    }, { status: 500 });
  }
}

/**
 * POST /api/trial/status - Initialise ou met à jour l'essai
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { action, trialDays } = await request.json();
    const userId = session.user.id;

    if (action === 'initialize') {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + (trialDays || 30));

      // Pour l'instant, on stocke les informations d'essai dans les métadonnées utilisateur
      // Une fois les nouveaux champs Prisma disponibles, on pourra utiliser les vrais champs
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          updatedAt: new Date()
          // TODO: Utiliser les vrais champs une fois les types Prisma mis à jour
          // trialStartDate: startDate,
          // trialEndDate: endDate,
          // isTrialActive: true,
          // subscriptionType: 'trial',
          // trialDaysUsed: 0,
          // lastTrialCheck: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Période d\'essai initialisée',
        trialEndDate: endDate,
        daysRemaining: trialDays || 30
      });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });

  } catch (error) {
    console.error('Erreur lors de l\'initialisation de l\'essai:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'initialisation'
    }, { status: 500 });
  }
}