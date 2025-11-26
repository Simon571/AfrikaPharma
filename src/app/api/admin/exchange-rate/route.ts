import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getExchangeRate, upsertExchangeRate } from '@/lib/exchange-rate';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const usdToCdf = await getExchangeRate();
  return NextResponse.json({ usdToCdf });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { usdToCdf } = body;

    if (typeof usdToCdf !== 'number' || Number.isNaN(usdToCdf) || usdToCdf <= 0) {
      return NextResponse.json(
        { message: 'Le taux doit être un nombre positif.' },
        { status: 400 }
      );
    }

    // Récupérer l'ancien taux avant la mise à jour
    const oldRate = await getExchangeRate();

    // Mettre à jour le taux de change
    const record = await upsertExchangeRate({
      usdToCdf,
      updatedBy: session.user?.id,
    });

    // Recalculer tous les prix des médicaments si le taux a changé
    if (oldRate !== usdToCdf) {
      // Calculer le ratio de changement
      const ratio = usdToCdf / oldRate;

      // Mettre à jour tous les médicaments
      const medications = await prisma.medication.findMany();
      
      let updatedCount = 0;
      for (const medication of medications) {
        // Recalculer les prix en multipliant par le ratio
        const newPurchasePrice = Math.round(medication.purchasePrice * ratio);
        const newPrice = Math.round(medication.price * ratio);

        await prisma.medication.update({
          where: { id: medication.id },
          data: {
            purchasePrice: newPurchasePrice,
            price: newPrice,
          },
        });
        updatedCount++;
      }

      console.log(`[EXCHANGE_RATE] Taux changé de ${oldRate} à ${usdToCdf}. ${updatedCount} médicaments mis à jour.`);

      return NextResponse.json({ 
        usdToCdf: record.usdToCdf, 
        updatedAt: record.updatedAt,
        medicationsUpdated: updatedCount,
        message: `Taux mis à jour et ${updatedCount} médicaments recalculés.`
      });
    }

    return NextResponse.json({ usdToCdf: record.usdToCdf, updatedAt: record.updatedAt });
  } catch (error) {
    console.error('[EXCHANGE_RATE_PUT]', error);
    return NextResponse.json(
      { message: 'Impossible de mettre à jour le taux de change.' },
      { status: 500 }
    );
  }
}
