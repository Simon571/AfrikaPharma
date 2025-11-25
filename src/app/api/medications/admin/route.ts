import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const searchTerm = searchParams.get('search');

  try {
    let medications;

    if (searchTerm) {
      medications = await prisma.medication.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { barcode: { contains: searchTerm, mode: 'insensitive' } },
            { pharmaceuticalForm: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        orderBy: { name: 'asc' },
      });
    } else {
      medications = await prisma.medication.findMany({
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json(medications, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error fetching admin medications:', error);
    return NextResponse.json({ message: 'Erreur lors de la récupération des médicaments.' }, { status: 500 });
  }
}
