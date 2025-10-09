import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stockItem = await prisma.medication.findUnique({
      where: { id },
    });
    if (!stockItem) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }
    return NextResponse.json(stockItem);
  } catch (error: unknown) {
    let errorMessage = 'Une erreur inconnue est survenue';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: `Erreur lors de la récupération du produit: ${errorMessage}` }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const updatedStockItem = await prisma.medication.update({
      where: { id },
      data,
    });
    return NextResponse.json(updatedStockItem);
  } catch (error: unknown) {
    let errorMessage = 'Une erreur inconnue est survenue';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: `Erreur lors de la mise à jour du produit: ${errorMessage}` }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.medication.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    let errorMessage = 'Une erreur inconnue est survenue';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: `Erreur lors de la suppression du produit: ${errorMessage}` }, { status: 500 });
  }
}
