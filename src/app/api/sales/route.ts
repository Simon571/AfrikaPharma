import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface SaleItemInput {
  medicationId: string;
  quantity: number;
  priceAtSale: number;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const todayParam = searchParams.get('today');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = {};

  if (todayParam === 'true') {
    // Filtrer les ventes d'aujourd'hui uniquement
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    whereClause.date = {
      gte: startOfToday,
      lte: endOfToday,
    };
  } else if (startDateParam && endDateParam) {
    whereClause.date = {
      gte: new Date(startDateParam),
      lte: new Date(endDateParam),
    };
  }

  // Filtrage par rôle : vendeurs voient leurs ventes, admins voient toutes les ventes
  if (session.user?.role === 'seller') {
    whereClause.sellerId = session.user.id;
  }
  // Pour admin : pas de filtre sellerId, donc voit toutes les ventes

  try {
    const sales = await prisma.sale.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: { seller: true, items: { include: { medication: true } }, client: true },
    });
    
    // Retourner dans le format attendu par la page daily-report
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    } as Record<string, string>;

    if (todayParam === 'true') {
      return NextResponse.json({ sales }, { status: 200, headers });
    }

    return NextResponse.json(sales, { status: 200, headers });
  } catch (error: unknown) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des ventes.' }, 
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

import { getCurrentUser } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { clientName, totalAmount, amountPaid, changeDue, paymentMethod, items }: { clientName: string; totalAmount: number; amountPaid: number; changeDue: number; paymentMethod: string; items: SaleItemInput[] } = await req.json();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: 'Utilisateur non authentifié' }, { status: 401 });
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ message: 'Aucun article dans la vente.' }, { status: 400 });
  }

  try {
    let client = await prisma.client.findFirst({
      where: { name: clientName },
    });

    if (!client) {
      client = await prisma.client.create({
        data: { name: clientName },
      });
    }

    const newSale = await prisma.sale.create({
      data: {
        clientId: client.id,
        sellerId: user.id,
        totalAmount,
        amountPaid,
        changeDue,
        paymentMethod,
        items: {
          create: items.map((item) => ({
            medication: {
              connect: { id: item.medicationId },
            },
            quantity: item.quantity,
            priceAtSale: item.priceAtSale,
          })),
        },
      },
    });

    // Update medication stock
    for (const item of items) {
      await prisma.medication.update({
        where: { id: item.medicationId },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    return NextResponse.json(newSale, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    console.error('Error saving sale:', error);
    return NextResponse.json(
      { message: 'Erreur lors de l\'enregistrement de la vente.' }, 
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
