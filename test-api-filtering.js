const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAPIFiltering() {
  try {
    console.log('🧪 Test du filtrage API pour admin...');
    
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    // Simuler la logique de l'API daily-report pour un admin
    const whereCondition = {
      date: {
        gte: startOfToday,
        lte: endOfToday,
      },
    };
    
    console.log('📅 Where condition pour admin:', whereCondition);
    console.log('📅 Date range:', {
      start: startOfToday.toISOString(),
      end: endOfToday.toISOString()
    });
    
    const todaySales = await prisma.sale.findMany({
      where: whereCondition,
      include: {
        items: {
          include: {
            medication: true,
          },
        },
        client: true,
        seller: true,
      },
      orderBy: { date: 'asc' },
    });
    
    console.log('📊 Résultats pour admin:');
    console.log(`   Nombre de ventes: ${todaySales.length}`);
    console.log(`   Total revenus: ${todaySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)} CDF`);
    
    if (todaySales.length > 0) {
      console.log('📋 Détail des ventes trouvées:');
      todaySales.forEach((sale, index) => {
        console.log(`   ${index + 1}. ${new Date(sale.date).toLocaleString()} - ${sale.totalAmount} CDF`);
        console.log(`      Seller: ${sale.seller?.username} (${sale.seller?.role})`);
      });
    }
    
    // Test également l'API sales
    console.log('');
    console.log('🧪 Test API sales pour admin...');
    
    const salesWhereCondition = {
      date: {
        gte: startOfToday,
        lte: endOfToday,
      },
    };
    
    const salesResult = await prisma.sale.findMany({
      where: salesWhereCondition,
      orderBy: { date: 'desc' },
      include: { seller: true, items: { include: { medication: true } }, client: true },
    });
    
    console.log(`📋 API sales result: ${salesResult.length} ventes`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIFiltering();