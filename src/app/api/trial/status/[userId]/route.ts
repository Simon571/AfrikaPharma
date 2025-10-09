import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API pour vérifier le statut d'essai d'un utilisateur spécifique par ID
 * GET /api/trial/status/[userId]
 */

interface RouteContext {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur manquant' }, { status: 400 });
    }

    // Vérifier l'utilisateur
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
      return NextResponse.json({ 
        hasAccess: false,
        error: 'Utilisateur non trouvé' 
      }, { status: 404 });
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
    
    // Déterminer le type d'abonnement
    let subscriptionType: 'trial' | 'expired' | 'premium' = isExpired ? 'expired' : 'trial';
    
    // Si l'utilisateur est admin, on lui donne accès premium par défaut
    if (user.role === 'admin') {
      subscriptionType = 'premium';
    }

    const trialStatus = {
      isActive: subscriptionType === 'trial' && !isExpired,
      daysRemaining,
      totalDays,
      daysUsed,
      startDate: trialStartDate,
      endDate: trialEndDate,
      subscriptionType,
      canExtend: subscriptionType === 'trial' && daysRemaining <= 5,
      features: {
        inventory: true,
        sales: true,
        basicReports: true,
        userManagement: subscriptionType === 'premium',
        advancedReports: subscriptionType === 'premium',
        dataExport: subscriptionType === 'premium'
      }
    };

    return NextResponse.json({
      hasAccess: !isExpired || subscriptionType === 'premium',
      status: trialStatus,
      message: isExpired && subscriptionType !== 'premium' ? 'Période d\'essai expirée' : undefined
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du statut d\'essai:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la vérification du statut',
      hasAccess: false
    }, { status: 500 });
  }
}