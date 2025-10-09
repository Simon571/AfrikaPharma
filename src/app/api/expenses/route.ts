import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Import Prisma dynamically to avoid client generation issues
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('Fetching expenses for user:', session.user?.name);
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');

    // Construire la clause WHERE
    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (category) {
      whereClause.category = category;
    }

    const expenses = await (prisma as any).expense.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            username: true,
          }
        }
      },
      orderBy: { date: 'desc' },
    });

    await prisma.$disconnect();
    return NextResponse.json(expenses, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ message: 'Erreur lors de la récupération des dépenses.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { description, amount, category, date } = await req.json();

    if (!description || !amount) {
      return NextResponse.json({ message: 'Description et montant sont requis.' }, { status: 400 });
    }

    // Import Prisma dynamically
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const newExpense = await (prisma as any).expense.create({
      data: {
        description,
        amount: parseFloat(amount),
        category: category || 'Général',
        date: date ? new Date(date) : new Date(),
        registeredBy: (session.user as any)?.username || 'Inconnu',
        userId: session.user?.id || '',
      },
      include: {
        user: {
          select: {
            username: true,
          }
        }
      }
    });

    await prisma.$disconnect();
    return NextResponse.json(newExpense, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ message: 'Erreur lors de la création de la dépense.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { id, description, amount, category, date } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'ID de la dépense requis.' }, { status: 400 });
    }

    // Import Prisma dynamically
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const updatedExpense = await (prisma as any).expense.update({
      where: { id },
      data: {
        description,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
      },
      include: {
        user: {
          select: {
            username: true,
          }
        }
      }
    });

    await prisma.$disconnect();
    return NextResponse.json(updatedExpense, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ message: 'Erreur lors de la mise à jour de la dépense.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID de la dépense requis.' }, { status: 400 });
    }

    // Import Prisma dynamically
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    await (prisma as any).expense.delete({
      where: { id },
    });

    await prisma.$disconnect();
    return NextResponse.json({ message: 'Dépense supprimée avec succès.' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ message: 'Erreur lors de la suppression de la dépense.' }, { status: 500 });
  }
}