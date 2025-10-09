const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDailyReportLogic() {
  try {
    console.log('🧪 Test de la logique du rapport journalier...');
    
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    console.log('📅 Test avec différents filtres:');
    console.log('');
    
    // Test 1: Toutes les ventes d'aujourd'hui (comme admin)
    console.log('1️⃣ Test filtre ADMIN (toutes les ventes):');
    const adminWhereCondition = {
      date: {
        gte: startOfToday,
        lte: endOfToday,
      },
    };
    
    const adminSales = await prisma.sale.findMany({
      where: adminWhereCondition,
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
    
    console.log(`   Résultat: ${adminSales.length} ventes trouvées`);
    const adminRevenue = adminSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    console.log(`   Revenus: ${adminRevenue} CDF`);
    console.log('');
    
    // Test 2: Ventes filtrées par vendeur spécifique (comme seller)
    console.log('2️⃣ Test filtre SELLER (ventes d\'un vendeur spécifique):');
    const sellerWhereCondition = {
      date: {
        gte: startOfToday,
        lte: endOfToday,
      },
      sellerId: 'cmftpulvp0000wevscnlevd9r' // L'ID du vendeur/admin qui a fait les ventes
    };
    
    const sellerSales = await prisma.sale.findMany({
      where: sellerWhereCondition,
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
    
    console.log(`   Résultat: ${sellerSales.length} ventes trouvées`);
    const sellerRevenue = sellerSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    console.log(`   Revenus: ${sellerRevenue} CDF`);
    console.log('');
    
    // Test 3: Vérifier l'utilisateur qui se connecte
    console.log('3️⃣ Informations sur l\'utilisateur vendeur:');
    const user = await prisma.user.findUnique({
      where: { id: 'cmftpulvp0000wevscnlevd9r' },
      select: { id: true, username: true, role: true }
    });
    
    if (user) {
      console.log(`   ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
    } else {
      console.log('   ❌ Utilisateur non trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDailyReportLogic();