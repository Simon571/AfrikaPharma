const { PrismaClient } = require('@prisma/client');

async function testTables() {
  console.log('🔄 Test des tables PostgreSQL...');
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.log('❌ Utilisez DATABASE_URL PostgreSQL');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // Test des tables principales
    const medicationCount = await prisma.medication.count();
    console.log('💊 Médicaments:', medicationCount);

    const userCount = await prisma.user.count();
    console.log('👥 Utilisateurs:', userCount);

    const saleCount = await prisma.sale.count();
    console.log('💰 Ventes:', saleCount);

    console.log('✅ Schéma PostgreSQL créé avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testTables();