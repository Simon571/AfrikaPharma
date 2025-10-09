const { PrismaClient } = require('@prisma/client');

async function checkSales() {
  console.log('🔍 Vérification des ventes...');
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.log('❌ Utilisez DATABASE_URL PostgreSQL');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // Récupérer toutes les ventes
    const sales = await prisma.sale.findMany({
      include: {
        seller: { select: { id: true, username: true, role: true } },
        client: { select: { name: true } },
        items: {
          include: {
            medication: { select: { name: true } }
          }
        }
      }
    });

    console.log(`📊 Total des ventes: ${sales.length}`);

    if (sales.length > 0) {
      console.log('\n📋 Dernières ventes:');
      sales.slice(-5).forEach(sale => {
        console.log(`  - ID: ${sale.id}`);
        console.log(`    Vendeur: ${sale.seller?.username || 'inconnu'} (${sale.seller?.role || 'N/A'})`);
        console.log(`    Client: ${sale.client?.name || 'anonyme'}`);
        console.log(`    Date: ${new Date(sale.date).toLocaleString('fr-FR')}`);
        console.log(`    Montant: ${sale.totalAmount}€`);
        console.log(`    Articles: ${sale.items.length}`);
        console.log('');
      });

      // Ventes d'aujourd'hui
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const todaySales = sales.filter(sale => new Date(sale.date) >= startOfToday);
      console.log(`📅 Ventes d'aujourd'hui: ${todaySales.length}`);
      
      if (todaySales.length > 0) {
        todaySales.forEach(sale => {
          console.log(`  - ${sale.seller?.username}: ${sale.totalAmount}€ à ${new Date(sale.date).toLocaleTimeString('fr-FR')}`);
        });
      } else {
        console.log('  Aucune vente aujourd\'hui');
      }

      // Ventes par vendeur
      const salesByUser = {};
      sales.forEach(sale => {
        const userId = sale.sellerId;
        const username = sale.seller?.username || 'inconnu';
        if (!salesByUser[userId]) {
          salesByUser[userId] = { username, count: 0, total: 0 };
        }
        salesByUser[userId].count++;
        salesByUser[userId].total += sale.totalAmount;
      });

      console.log('\n👥 Ventes par vendeur:');
      Object.entries(salesByUser).forEach(([userId, data]) => {
        console.log(`  - ${data.username}: ${data.count} ventes, ${data.total}€ total`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSales();