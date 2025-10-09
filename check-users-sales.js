const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 Vérification des utilisateurs...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });
    
    console.log('📋 Utilisateurs trouvés:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Nom: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rôle: ${user.role}`);
      console.log('');
    });
    
    console.log('🔍 Vérification seller dans les ventes...');
    const sales = await prisma.sale.findMany({
      select: {
        id: true,
        sellerId: true,
        seller: {
          select: {
            username: true,
            role: true
          }
        },
        date: true,
        totalAmount: true
      },
      orderBy: { date: 'desc' },
      take: 5
    });
    
    console.log('📊 Dernières ventes:');
    sales.forEach((sale, index) => {
      console.log(`${index + 1}. Vente ID: ${sale.id}`);
      console.log(`   Seller ID: ${sale.sellerId}`);
      console.log(`   Seller: ${sale.seller?.username || 'N/A'} (${sale.seller?.role || 'N/A'})`);
      console.log(`   Date: ${new Date(sale.date).toLocaleString()}`);
      console.log(`   Total: ${sale.totalAmount} CDF`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();