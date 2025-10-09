
'use server';

import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const totalRevenue = await prisma.sale.aggregate({
    _sum: {
      totalAmount: true,
    },
  });

  const todaySales = await prisma.sale.count({
    where: {
      date: {
        gte: startOfDay,
      },
    },
  });

  const totalClients = await prisma.client.count();

  // Force le compteur de médicaments en rupture à zéro
  const outOfStock = 0; // await prisma.medication.count({
  //   where: {
  //     quantity: 0,
  //   },
  // });

  return {
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    todaySales,
    totalClients,
    outOfStock,
  };
}
