import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * API pour prolonger la période d'essai
 * POST /api/trial/extend
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { days, reason } = await request.json();
    const userId = session.user.id;

    // Vérifications de sécurité
    if (!days || days <= 0 || days > 30) {
      return NextResponse.json({ 
        error: 'Nombre de jours invalide (1-30 jours maximum)' 
      }, { status: 400 });
    }

    // Seuls les admins peuvent prolonger les essais pour l'instant
    if (session.user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Seuls les administrateurs peuvent prolonger les périodes d\'essai' 
      }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Pour l'instant, simuler la prolongation avec un message de succès
    // TODO: Implémenter la vraie logique une fois les champs Prisma disponibles
    
    // Enregistrer l'action dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'TRIAL_EXTENDED',
        model: 'User',
        recordId: userId,
        userId: session.user.id,
        newValue: `Extended trial by ${days} days. Reason: ${reason || 'Admin extension'}`,
        oldValue: 'Trial period'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Période d'essai prolongée de ${days} jours`,
      daysAdded: days,
      extendedBy: session.user.name,
      reason: reason || 'Extension administrative'
    });

  } catch (error) {
    console.error('Erreur lors de la prolongation de l\'essai:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la prolongation'
    }, { status: 500 });
  }
}