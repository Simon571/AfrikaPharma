const { PrismaClient } = require('@prisma/client');

async function testDailyReportApi() {
  console.log('🔍 Test de l\'API daily-report...');
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.log('❌ Utilisez DATABASE_URL PostgreSQL');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // Simuler exactement ce que fait l'API
    const sellerId = 'cmftpumcb0001wevscshcawgh'; // ID du vendeur
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    console.log(`📅 Recherche de ventes pour:`);
    console.log(`   sellerId: ${sellerId}`);
    console.log(`   période: ${startOfToday.toLocaleString('fr-FR')} - ${endOfToday.toLocaleString('fr-FR')}`);

    // Ventes du jour pour ce vendeur (exactement comme l'API)
    const todaySales = await prisma.sale.findMany({
      where: {
        sellerId: sellerId,
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
      },
    });

    console.log(`📊 Résultat de la requête:`);
    console.log(`   Nombre de ventes trouvées: ${todaySales.length}`);

    // Calculs comme dans l'API
    const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const averageOrderValue = todaySales.length > 0 ? totalRevenue / todaySales.length : 0;

    console.log(`   Chiffre d'affaires: ${totalRevenue}€`);
    console.log(`   Panier moyen: ${averageOrderValue.toFixed(2)}€`);

    // Détail des ventes
    todaySales.forEach((sale, index) => {
      console.log(`   
   Vente ${index + 1}:
     - ID: ${sale.id}
     - Client: ${sale.client.name}
     - Montant: ${sale.totalAmount}€
     - Date: ${sale.date.toLocaleString('fr-FR')}
     - Articles: ${sale.items.length}`);
      
      sale.items.forEach(item => {
        console.log(`       * ${item.medication.name} x${item.quantity} à ${item.priceAtSale}€`);
      });
    });

    // Simulation du résultat final de l'API
    const reportData = {
      todaySales: {
        count: todaySales.length,
        totalRevenue,
        averageOrderValue,
      }
    };

    console.log(`\n🎯 Données qui devraient apparaître dans l'interface:`);
    console.log(JSON.stringify(reportData, null, 2));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDailyReportApi();