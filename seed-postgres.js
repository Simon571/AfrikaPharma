const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function seedPostgreSQL() {
  console.log('🌱 Seed PostgreSQL avec données de base...');
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.log('❌ Utilisez DATABASE_URL PostgreSQL');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // Créer l'utilisateur administrateur
    const adminPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        passwordHash: adminPassword,
        role: 'admin',
      },
    });

    // Créer l'utilisateur vendeur
    const sellerPassword = await bcrypt.hash('vendeur123', 10);
    await prisma.user.upsert({
      where: { username: 'vendeur' },
      update: {},
      create: {
        username: 'vendeur',
        passwordHash: sellerPassword,
        role: 'seller',
      },
    });

    // Créer quelques médicaments de base
    const medications = [
      {
        name: 'Paracétamol 500mg',
        pharmaceuticalForm: 'Comprimé',
        purchasePrice: 1000,
        price: 1500,
        quantity: 100,
        expirationDate: new Date('2026-12-31'),
        barcode: 'PAR500-001'
      },
      {
        name: 'Ibuprofène 400mg',
        pharmaceuticalForm: 'Comprimé',
        purchasePrice: 1500,
        price: 2000,
        quantity: 50,
        expirationDate: new Date('2026-12-31'),
        barcode: 'IBU400-001'
      },
      {
        name: 'Aspirine 500mg',
        pharmaceuticalForm: 'Comprimé',
        purchasePrice: 800,
        price: 1200,
        quantity: 75,
        expirationDate: new Date('2026-12-31'),
        barcode: 'ASP500-001'
      },
      {
        name: 'Amoxicilline 500mg',
        pharmaceuticalForm: 'Gélule',
        purchasePrice: 2500,
        price: 3500,
        quantity: 30,
        expirationDate: new Date('2026-06-30'),
        barcode: 'AMO500-001'
      },
      {
        name: 'Doliprane 1000mg',
        pharmaceuticalForm: 'Comprimé',
        purchasePrice: 1200,
        price: 1800,
        quantity: 60,
        expirationDate: new Date('2026-12-31'),
        barcode: 'DOL1000-001'
      }
    ];

    for (const medication of medications) {
      await prisma.medication.create({
        data: medication
      });
    }

    console.log('✅ Seed terminé !');
    console.log('👥 2 utilisateurs créés (admin/admin123, vendeur/vendeur123)');
    console.log('💊 5 médicaments créés');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPostgreSQL();