import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Dynamic import to avoid prisma client generation issues
async function getPrisma() {
  const { PrismaClient } = await import('@prisma/client');
  return new PrismaClient();
}

// GET /api/stock-movements?medicationId=&type=&limit=50&grouped=true
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const prisma = await getPrisma();
    const { searchParams } = new URL(req.url);
    const medicationId = searchParams.get('medicationId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const grouped = searchParams.get('grouped') === 'true';

    const where: any = {};
    if (medicationId) where.medicationId = medicationId;
    if (type) where.type = type;

    const movements = await (prisma as any).stockMovement.findMany({
      where,
      include: {
        medication: { select: { name: true, quantity: true } },
        user: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: grouped ? undefined : limit,
    });

    if (grouped) {
      // Grouper par mois pour l'interface d'historique
      const groupedByMonth: { [key: string]: any } = {};
      
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];

      movements.forEach((movement: any) => {
        const date = new Date(movement.createdAt);
        const year = date.getFullYear();
        const monthIndex = date.getMonth();
        const monthName = monthNames[monthIndex];
        const key = `${year}-${monthIndex}`;

        if (!groupedByMonth[key]) {
          groupedByMonth[key] = {
            month: monthName,
            year: year,
            corrections: [],
            count: 0
          };
        }

        groupedByMonth[key].corrections.push({
          id: movement.id,
          medicationId: movement.medicationId,
          medicationName: movement.medication.name,
          type: movement.type,
          quantity: movement.quantity,
          reason: movement.reason || 'Non spécifié',
          previousStock: movement.previousStock,
          newStock: movement.newStock,
          createdAt: movement.createdAt.toISOString(),
          userId: movement.userId,
          userName: movement.user.username
        });

        groupedByMonth[key].count = groupedByMonth[key].corrections.length;
      });

      // Convertir en array et trier par date décroissante
      const result = Object.values(groupedByMonth).sort((a: any, b: any) => {
        if (a.year !== b.year) {
          return b.year - a.year;
        }
        const aMonthIndex = monthNames.indexOf(a.month);
        const bMonthIndex = monthNames.indexOf(b.month);
        return bMonthIndex - aMonthIndex;
      });

      await prisma.$disconnect();
      return NextResponse.json(result);
    }

    await prisma.$disconnect();
    return NextResponse.json(movements);
  } catch (e) {
    console.error('Error fetching stock movements', e);
    return NextResponse.json({ message: 'Erreur lors de la récupération des mouvements.' }, { status: 500 });
  }
}

// POST /api/stock-movements
// Body for entries (batch): { type: 'ENTRY', items: [{ medicationId, quantity, reason? }] }
// Body for single EXIT or CORRECTION: { type: 'EXIT'|'CORRECTION', medicationId, quantity, reason? }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const prisma = await getPrisma();

    if (body.type === 'ENTRY' && Array.isArray(body.items)) {
      if (body.items.length === 0) {
        return NextResponse.json({ message: 'Aucun article à enregistrer.' }, { status: 400 });
      }
      const result = await prisma.$transaction(async (tx) => {
        const created: any[] = [];
        for (const item of body.items) {
          if (!item.medicationId || !item.quantity || item.quantity <= 0) continue;
          const med = await tx.medication.findUnique({ where: { id: item.medicationId } });
          if (!med) continue;
          const previousStock = med.quantity;
          const newStock = previousStock + item.quantity;
          await tx.medication.update({ where: { id: med.id }, data: { quantity: newStock } });
          const movement = await (tx as any).stockMovement.create({
            data: {
              medicationId: med.id,
              userId: session.user?.id || '',
              type: 'ENTRY',
              quantity: item.quantity,
              reason: item.reason || 'Arrivage',
              previousStock,
              newStock,
            }
          });
          created.push(movement);
        }
        return created;
      });
      await prisma.$disconnect();
      return NextResponse.json({ success: true, created: result });
    }

    // EXIT or CORRECTION (single)
    if ((body.type === 'EXIT' || body.type === 'CORRECTION') && body.medicationId && body.quantity) {
      const quantity = parseInt(body.quantity, 10);
      if (quantity <= 0) return NextResponse.json({ message: 'Quantité invalide.' }, { status: 400 });

      const movement = await prisma.$transaction(async (tx) => {
        const med = await tx.medication.findUnique({ where: { id: body.medicationId } });
        if (!med) throw new Error('Médicament introuvable');
        const previousStock = med.quantity;
        let newStock = previousStock;
        if (body.type === 'EXIT') newStock = Math.max(0, previousStock - quantity);
        if (body.type === 'CORRECTION') newStock = quantity; // quantity représente le stock corrigé
        await tx.medication.update({ where: { id: med.id }, data: { quantity: newStock } });
        return (tx as any).stockMovement.create({
          data: {
            medicationId: med.id,
            userId: session.user?.id || '',
            type: body.type,
            quantity: body.type === 'CORRECTION' ? Math.abs(newStock - previousStock) : quantity,
            reason: body.reason || (body.type === 'EXIT' ? 'Sortie manuelle' : 'Correction inventaire'),
            previousStock,
            newStock,
          }
        });
      });

      await prisma.$disconnect();
      return NextResponse.json({ success: true, movement });
    }

    await prisma.$disconnect();
    return NextResponse.json({ message: 'Requête invalide.' }, { status: 400 });
  } catch (e: any) {
    console.error('Error creating stock movement', e);
    return NextResponse.json({ message: e.message || 'Erreur lors de l\'enregistrement du mouvement.' }, { status: 500 });
  }
}
