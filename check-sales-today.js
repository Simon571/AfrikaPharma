const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSales() {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    console.log('🔍 Vérification des ventes pour:', startOfToday.toLocaleDateString());
    console.log('Période:', startOfToday.toISOString(), 'à', endOfToday.toISOString());
    console.log('');
    
    const allSales = await prisma.sale.findMany({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        seller: true,
        items: {
          include: {
            medication: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    
    console.log(`📊 Total ventes aujourd'hui: ${allSales.length}`);
    
    if (allSales.length > 0) {
      console.log('');
      console.log('📋 Détail des ventes:');
      allSales.forEach((sale, index) => {
        console.log(`${index + 1}. Vente ID: ${sale.id}`);
        console.log(`   - Date: ${new Date(sale.date).toLocaleString()}`);
        console.log(`   - Vendeur: ${sale.seller?.name || 'N/A'} (Role: ${sale.seller?.role || 'N/A'})`);
        console.log(`   - Client: ${sale.clientName}`);
        console.log(`   - Total: ${sale.totalAmount} CDF`);
        console.log(`   - Articles: ${sale.items.length}`);
        sale.items.forEach(item => {
          console.log(`     * ${item.medication.name} x${item.quantity} = ${item.priceAtSale * item.quantity} CDF`);
        });
        console.log('');
      });
    } else {
      console.log('❌ Aucune vente trouvée pour aujourd\'hui');
      
      console.log('');
      console.log('🔍 Vérification des dernières ventes (peu importe la date):');
      const recentSales = await prisma.sale.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          seller: true
        }
      });
      
      if (recentSales.length > 0) {
        console.log(`📋 ${recentSales.length} dernières ventes:`);
        recentSales.forEach((sale, index) => {
          console.log(`${index + 1}. ${new Date(sale.date).toLocaleString()} - ${sale.totalAmount} CDF - Vendeur: ${sale.seller?.name}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSales();