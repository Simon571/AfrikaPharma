import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const { PrismaClient } = require('@prisma/client');

interface DailyReportData {
  todaySales: {
    count: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  topSellingMedications: Array<{
    name: string;
    quantitySold: number;
    revenue: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    sales: number;
    revenue: number;
  }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const prisma = new PrismaClient();

  try {
    const session = await getServerSession(authOptions);
    
    console.log('🔍 Daily Report API - Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userName: session?.user?.name
    });
    
    if (!session?.user) {
      console.log('❌ Daily Report API - No session found');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Les vendeurs et les admins peuvent accéder aux rapports
    if (session.user.role !== 'seller' && session.user.role !== 'admin') {
      console.log('❌ Daily Report API - Role not allowed:', session.user.role);
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    console.log('📅 Daily Report API - Date range:', {
      startOfToday: startOfToday.toISOString(),
      endOfToday: endOfToday.toISOString()
    });

    // Pour les vendeurs : seulement leurs ventes, pour les admins : toutes les ventes
    const whereCondition: any = {
      date: {
        gte: startOfToday,
        lte: endOfToday,
      },
    };

    // Si c'est un vendeur, filtrer par son ID
    // Si c'est un admin, voir toutes les ventes (pas de filtre sellerId)
    if (session.user.role === 'seller') {
      whereCondition.sellerId = session.user.id;
    }
    // Pour admin : pas de filtre sellerId, donc voit toutes les ventes

    console.log('🔍 Daily Report API - Where condition:', whereCondition);
    console.log('📊 Daily Report API - User role:', session.user.role);

    // Récupérer les ventes du jour
    const todaySales = await prisma.sale.findMany({
      where: whereCondition,
      include: {
        items: {
          include: {
            medication: true,
          },
        },
        client: true,
        seller: true, // Inclure les infos du vendeur pour les admins
      },
      orderBy: { date: 'asc' },
    });

    console.log('📋 Daily Report API - Sales found:', {
      count: todaySales.length,
      totalAmount: todaySales.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0)
    });

    // Calcul des statistiques de ventes
    const totalRevenue = todaySales.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0);
    const averageOrderValue = todaySales.length > 0 ? totalRevenue / todaySales.length : 0;

    // Top des médicaments vendus
    const medicationSales: Record<string, { name: string; quantitySold: number; revenue: number }> = {};
    todaySales.forEach((sale: any) => {
      sale.items.forEach((item: any) => {
        const key = item.medicationId;
        if (!medicationSales[key]) {
          medicationSales[key] = {
            name: item.medication.name,
            quantitySold: 0,
            revenue: 0,
          };
        }
        medicationSales[key].quantitySold += item.quantity;
        medicationSales[key].revenue += (item.priceAtSale || 0) * item.quantity;
      });
    });

    const topSellingMedications = Object.values(medicationSales)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // Répartition par méthode de paiement
    const paymentMethodsData: Record<string, { count: number; amount: number }> = {};
    todaySales.forEach((sale: any) => {
      const method = sale.paymentMethod || 'Inconnu';
      if (!paymentMethodsData[method]) {
        paymentMethodsData[method] = { count: 0, amount: 0 };
      }
      paymentMethodsData[method].count += 1;
      paymentMethodsData[method].amount += sale.totalAmount || 0;
    });
    const paymentMethods = Object.entries(paymentMethodsData).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount,
    }));

    // Répartition par heure
    const hourlyData = Array(24)
      .fill(0)
      .map((_, hour) => ({ hour, sales: 0, revenue: 0 }));
    todaySales.forEach((sale: any) => {
      const date = new Date(sale.date);
      const hour = date.getHours();
      if (hour >= 0 && hour < 24) {
        hourlyData[hour].sales += 1;
        hourlyData[hour].revenue += sale.totalAmount || 0;
      }
    });
    const hourlyBreakdown = hourlyData.filter((d) => d.sales > 0);

    const reportData: DailyReportData = {
      todaySales: {
        count: todaySales.length,
        totalRevenue,
        averageOrderValue,
      },
      topSellingMedications,
      paymentMethods,
      hourlyBreakdown,
    };

    return new NextResponse(JSON.stringify(reportData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération du rapport journalier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}