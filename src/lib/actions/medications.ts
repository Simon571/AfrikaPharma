
'use server';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function getMedications() {
  return await prisma.medication.findMany();
}

export async function createMedication(data: Prisma.MedicationUncheckedCreateInput) {
  return await prisma.medication.create({ data });
}

export async function updateMedication(id: string, data: Prisma.MedicationUncheckedUpdateInput) {
  return await prisma.medication.update({ where: { id }, data });
}

export async function deleteMedication(id: string) {
  return await prisma.medication.delete({ where: { id } });
}
