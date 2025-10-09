import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const { PrismaClient } = require('@prisma/client');

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const prisma = new PrismaClient();

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Seuls les vendeurs peuvent accéder à leurs propres dépenses
    if (session.user.role !== 'seller') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const sellerId = session.user.id;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Dépenses du jour pour ce vendeur
    const todayExpenses = await prisma.expense.findMany({
      where: {
        userId: sellerId,
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const totalExpenses = todayExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);

    return new NextResponse(JSON.stringify({
      expenses: todayExpenses,
      totalExpenses,
      count: todayExpenses.length,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
    
  } catch (error) {
    console.error('Erreur lors du chargement des dépenses:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des dépenses' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  const prisma = new PrismaClient();

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session.user.role !== 'seller') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { description, amount } = await request.json();

    // Validation
    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Description requise' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const sellerId = session.user.id;
    const sellerUsername = session.user.name; // Utiliser 'name' au lieu de 'username'

    // Créer la nouvelle dépense
    const newExpense = await prisma.expense.create({
      data: {
        description: description.trim(),
        amount: parseFloat(amount),
        category: 'Dépense vendeur',
        registeredBy: sellerUsername,
        userId: sellerId,
        date: new Date(),
      },
    });

  return NextResponse.json(newExpense, { status: 201, headers: { 'Cache-Control': 'no-store' } });
    
  } catch (error) {
    console.error('Erreur lors de la création de la dépense:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement de la dépense' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}