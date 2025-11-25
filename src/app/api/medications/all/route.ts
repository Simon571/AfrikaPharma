import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const searchTerm = searchParams.get('search');

  try {
    let medications;
    
    // Filtrer: prix > 0 ET quantité > 0
    const baseWhere = {
      price: { gt: 0 },
      quantity: { gt: 0 }
    };

    if (searchTerm) {
      medications = await prisma.medication.findMany({
        where: {
          AND: [
            baseWhere,
            {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { barcode: { contains: searchTerm, mode: 'insensitive' } },
                { pharmaceuticalForm: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          ],
        },
        orderBy: { name: 'asc' },
      });
    } else {
      medications = await prisma.medication.findMany({
        where: baseWhere,
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json(medications, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error fetching all medications:', error);
    return NextResponse.json({ message: 'Erreur lors de la récupération des médicaments.' }, { status: 500 });
  }
}
