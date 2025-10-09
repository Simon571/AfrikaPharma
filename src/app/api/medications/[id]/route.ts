import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { id } = await params;

    // Si c'est juste pour changer la disponibilité
    if (Object.keys(data).length === 1 && 'isAvailableForSale' in data) {
      const updatedMedication = await prisma.medication.update({
        where: { id },
        data: { isAvailableForSale: data.isAvailableForSale },
      });
      return NextResponse.json(updatedMedication, { status: 200 });
    }

    // Pour une mise à jour complète
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.pharmaceuticalForm) updateData.pharmaceuticalForm = data.pharmaceuticalForm;
    if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.expirationDate) updateData.expirationDate = new Date(data.expirationDate);
    if (data.barcode) updateData.barcode = data.barcode;
    if (data.isAvailableForSale !== undefined) updateData.isAvailableForSale = data.isAvailableForSale;

    const updatedMedication = await prisma.medication.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedMedication, { status: 200 });
  } catch (error: any) {
    console.error('Error updating medication:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la mise à jour du médicament.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.medication.delete({ where: { id } });
    return NextResponse.json({ message: 'Médicament supprimé avec succès.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting medication:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la suppression du médicament.' },
      { status: 500 }
    );
  }
}