import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const { PrismaClient } = require('@prisma/client');

interface SellerReport {
  sellerId: string;
  sellerName: string;
  totalSales: number;
  salesCount: number;
  totalExpenses: number;
  expensesCount: number;
  netResult: number;
  topMedications: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  salesDetails: Array<{
    id: string;
    date: string;
    totalAmount: number;
    paymentMethod: string;
    client: { name: string };
    itemsCount: number;
  }>;
  expensesDetails: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
  }>;
}

interface GlobalReportData {
  overallStats: {
    totalSales: number;
    totalExpenses: number;
    netResult: number;
    activeSellers: number;
    totalTransactions: number;
  };
  sellerReports: SellerReport[];
  topSellingMedications: Array<{
    name: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  paymentMethodsBreakdown: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const prisma = new PrismaClient();

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Seuls les administrateurs peuvent accéder au rapport global
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Récupérer tous les vendeurs
    const sellers = await prisma.user.findMany({
      where: { role: 'seller' },
      select: { id: true, username: true },
    });

    // Récupérer toutes les ventes du jour
    const todaySales = await prisma.sale.findMany({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        items: {
          include: {
            medication: true,
          },
        },
        client: true,
        seller: true,
      },
    });

    // Récupérer toutes les dépenses du jour
    const todayExpenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        user: true,
      },
    });

    // Calculer les statistiques globales
    const totalSales = todaySales.reduce((sum: number, sale: any) => sum + sale.totalAmount, 0);
    const totalExpenses = todayExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
    const activeSellers = new Set(todaySales.map((sale: any) => sale.sellerId)).size;

    // Grouper par vendeur
    const sellerReports: SellerReport[] = sellers.map((seller: any) => {
      const sellerSales = todaySales.filter((sale: any) => sale.sellerId === seller.id);
      const sellerExpenses = todayExpenses.filter((expense: any) => expense.userId === seller.id);

      const salesTotal = sellerSales.reduce((sum: number, sale: any) => sum + sale.totalAmount, 0);
      const expensesTotal = sellerExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);

      // Calculer les médicaments les plus vendus par ce vendeur
      const medicationSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      
      sellerSales.forEach((sale: any) => {
        sale.items.forEach((item: any) => {
          const key = item.medicationId;
          if (!medicationSales[key]) {
            medicationSales[key] = {
              name: item.medication.name,
              quantity: 0,
              revenue: 0,
            };
          }
          medicationSales[key].quantity += item.quantity;
          medicationSales[key].revenue += item.priceAtSale * item.quantity;
        });
      });

      const topMedications = Object.values(medicationSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3);

      return {
        sellerId: seller.id,
        sellerName: seller.username,
        totalSales: salesTotal,
        salesCount: sellerSales.length,
        totalExpenses: expensesTotal,
        expensesCount: sellerExpenses.length,
        netResult: salesTotal - expensesTotal,
        topMedications,
        salesDetails: sellerSales.map((sale: any) => ({
          id: sale.id,
          date: sale.date.toISOString(),
          totalAmount: sale.totalAmount,
          paymentMethod: sale.paymentMethod,
          client: { name: sale.client.name },
          itemsCount: sale.items.length,
        })),
        expensesDetails: sellerExpenses.map((expense: any) => ({
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          date: expense.date.toISOString(),
        })),
      };
    });

    // Top des médicaments vendus globalement
    const globalMedicationSales: Record<string, { name: string; totalQuantity: number; totalRevenue: number }> = {};
    
    todaySales.forEach((sale: any) => {
      sale.items.forEach((item: any) => {
        const key = item.medicationId;
        if (!globalMedicationSales[key]) {
          globalMedicationSales[key] = {
            name: item.medication.name,
            totalQuantity: 0,
            totalRevenue: 0,
          };
        }
        globalMedicationSales[key].totalQuantity += item.quantity;
        globalMedicationSales[key].totalRevenue += item.priceAtSale * item.quantity;
      });
    });

    const topSellingMedications = Object.values(globalMedicationSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    // Répartition des méthodes de paiement
    const paymentMethods: Record<string, { count: number; amount: number }> = {};
    
    todaySales.forEach((sale: any) => {
      if (!paymentMethods[sale.paymentMethod]) {
        paymentMethods[sale.paymentMethod] = { count: 0, amount: 0 };
      }
      paymentMethods[sale.paymentMethod].count += 1;
      paymentMethods[sale.paymentMethod].amount += sale.totalAmount;
    });

    const paymentMethodsBreakdown = Object.entries(paymentMethods).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount,
      percentage: totalSales > 0 ? (data.amount / totalSales) * 100 : 0,
    }));

    const globalReportData: GlobalReportData = {
      overallStats: {
        totalSales,
        totalExpenses,
        netResult: totalSales - totalExpenses,
        activeSellers,
        totalTransactions: todaySales.length,
      },
      sellerReports,
      topSellingMedications,
      paymentMethodsBreakdown,
    };

    return new NextResponse(JSON.stringify(globalReportData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération du rapport global:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport global' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}