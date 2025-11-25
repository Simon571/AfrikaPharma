import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getExchangeRate, upsertExchangeRate } from '@/lib/exchange-rate';

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

    const record = await upsertExchangeRate({
      usdToCdf,
      updatedBy: session.user?.id,
    });

    return NextResponse.json({ usdToCdf: record.usdToCdf, updatedAt: record.updatedAt });
  } catch (error) {
    console.error('[EXCHANGE_RATE_PUT]', error);
    return NextResponse.json(
      { message: 'Impossible de mettre à jour le taux de change.' },
      { status: 500 }
    );
  }
}
