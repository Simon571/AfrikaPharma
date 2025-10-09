const { PrismaClient } = require('@prisma/client');

async function checkUserIds() {
  console.log('🔍 Vérification des IDs utilisateurs vs ventes...');
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.log('❌ Utilisez DATABASE_URL PostgreSQL');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // 1. Vérifier tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true
      }
    });

    console.log('👥 Utilisateurs dans la base:');
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.role}): ID = ${user.id}`);
    });

    // 2. Vérifier toutes les ventes avec leur vendeur
    const sales = await prisma.sale.findMany({
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      }
    });

    console.log('\n💰 Ventes dans la base:');
    sales.forEach(sale => {
      console.log(`   - Vente ${sale.id}:`);
      console.log(`     sellerId: ${sale.sellerId}`);
      console.log(`     vendeur: ${sale.seller ? sale.seller.username : 'INTROUVABLE'}`);
      console.log(`     date: ${sale.date.toLocaleString('fr-FR')}`);
    });

    // 3. Test spécifique pour le vendeur
    const vendeur = await prisma.user.findUnique({
      where: { username: 'vendeur' }
    });

    if (vendeur) {
      console.log(`\n🎯 Focus vendeur:`);
      console.log(`   username: ${vendeur.username}`);
      console.log(`   role: ${vendeur.role}`);
      console.log(`   id: ${vendeur.id}`);

      // Ses ventes
      const vendeurSales = await prisma.sale.findMany({
        where: { sellerId: vendeur.id }
      });

      console.log(`   ventes: ${vendeurSales.length}`);
      
      // Ses ventes d'aujourd'hui
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const todaySales = await prisma.sale.findMany({
        where: {
          sellerId: vendeur.id,
          date: {
            gte: startOfToday,
            lte: endOfToday,
          }
        }
      });

      console.log(`   ventes aujourd'hui: ${todaySales.length}`);
      console.log(`   période: ${startOfToday.toLocaleString('fr-FR')} - ${endOfToday.toLocaleString('fr-FR')}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserIds();