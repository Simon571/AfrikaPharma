const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentSales() {
  try {
    console.log('🔍 Vérification des ventes récentes...');
    
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    console.log('📅 Période recherchée:');
    console.log('   Début:', startOfToday.toISOString());
    console.log('   Fin:', endOfToday.toISOString());
    console.log('');
    
    // Récupérer toutes les ventes d'aujourd'hui
    const todaySales = await prisma.sale.findMany({
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
    
    console.log(`📊 Total ventes aujourd'hui: ${todaySales.length}`);
    
    if (todaySales.length > 0) {
      let totalRevenue = 0;
      console.log('');
      console.log('📋 Détail des ventes:');
      
      todaySales.forEach((sale, index) => {
        console.log(`${index + 1}. Vente ID: ${sale.id}`);
        console.log(`   - Date: ${new Date(sale.date).toLocaleString()}`);
        console.log(`   - Vendeur ID: ${sale.sellerId}`);
        console.log(`   - Vendeur Role: ${sale.seller?.role || 'N/A'}`);
        console.log(`   - Client: ${sale.clientName}`);
        console.log(`   - Total: ${sale.totalAmount} CDF`);
        console.log(`   - Articles: ${sale.items.length}`);
        
        sale.items.forEach(item => {
          console.log(`     * ${item.medication.name} x${item.quantity} = ${item.priceAtSale * item.quantity} CDF`);
        });
        
        totalRevenue += sale.totalAmount;
        console.log('');
      });
      
      console.log(`💰 Revenus totaux aujourd'hui: ${totalRevenue} CDF`);
      
    } else {
      console.log('❌ Aucune vente trouvée pour aujourd\'hui');
      
      // Vérifier les dernières ventes en général
      console.log('');
      console.log('🔍 Dernières ventes (toutes dates):');
      const recentSales = await prisma.sale.findMany({
        take: 3,
        orderBy: { date: 'desc' },
        include: {
          seller: true
        }
      });
      
      if (recentSales.length > 0) {
        recentSales.forEach((sale, index) => {
          console.log(`${index + 1}. ${new Date(sale.date).toLocaleString()} - ${sale.totalAmount} CDF - Vendeur: ${sale.seller?.role || 'N/A'}`);
        });
      } else {
        console.log('❌ Aucune vente trouvée dans la base de données');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentSales();