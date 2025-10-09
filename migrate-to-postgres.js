const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');

async function migrateData() {
  // Vérifier que DATABASE_URL est configuré pour PostgreSQL
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.error('❌ DATABASE_URL doit être configuré pour PostgreSQL');
    console.log('Ajoutez votre URL Neon dans .env.local :');
    console.log('DATABASE_URL="postgresql://username:password@host/database"');
    return;
  }

  console.log('🚀 Migration SQLite → PostgreSQL');
  console.log('📡 PostgreSQL URL:', process.env.DATABASE_URL.substring(0, 30) + '...');

  // Connexion SQLite (source)
  const sqlite = new Database('./prisma/dev.db', { readonly: true });
  
  // Connexion PostgreSQL (destination) 
  const postgres = new PrismaClient();

  try {
    // 1. Migrer les utilisateurs
    console.log('\n👥 Migration des utilisateurs...');
    const users = sqlite.prepare('SELECT * FROM User').all();
    
    for (const user of users) {
      await postgres.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          id: user.id,
          email: user.email,
          password: user.password,
          username: user.username,
          role: user.role,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      });
    }
    console.log(`✅ ${users.length} utilisateurs migrés`);

    // 2. Migrer les médicaments
    console.log('\n💊 Migration des médicaments...');
    const medications = sqlite.prepare('SELECT * FROM Medication').all();
    
    for (const med of medications) {
      await postgres.medication.upsert({
        where: { id: med.id },
        update: {},
        create: {
          id: med.id,
          name: med.name,
          category: med.category,
          price: med.price,
          quantity: med.quantity,
          minQuantity: med.minQuantity,
          expirationDate: med.expirationDate ? new Date(med.expirationDate) : null,
          barcode: med.barcode,
          supplier: med.supplier,
          purchasePrice: med.purchasePrice,
          isAvailableForSale: med.isAvailableForSale === 1,
          createdAt: new Date(med.createdAt),
          updatedAt: new Date(med.updatedAt)
        }
      });
    }
    console.log(`✅ ${medications.length} médicaments migrés`);

    // 3. Migrer les clients
    console.log('\n🏥 Migration des clients...');
    const clients = sqlite.prepare('SELECT * FROM Client').all();
    
    for (const client of clients) {
      await postgres.client.upsert({
        where: { id: client.id },
        update: {},
        create: {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          createdAt: new Date(client.createdAt),
          updatedAt: new Date(client.updatedAt)
        }
      });
    }
    console.log(`✅ ${clients.length} clients migrés`);

    // 4. Migrer les ventes
    console.log('\n💰 Migration des ventes...');
    const sales = sqlite.prepare('SELECT * FROM Sale').all();
    
    for (const sale of sales) {
      // Créer la vente
      await postgres.sale.upsert({
        where: { id: sale.id },
        update: {},
        create: {
          id: sale.id,
          clientName: sale.clientName,
          totalAmount: sale.totalAmount,
          sellerId: sale.sellerId,
          createdAt: new Date(sale.createdAt),
          updatedAt: new Date(sale.updatedAt)
        }
      });

      // Migrer les items de vente
      const saleItems = sqlite.prepare('SELECT * FROM SaleItem WHERE saleId = ?').all(sale.id);
      
      for (const item of saleItems) {
        await postgres.saleItem.upsert({
          where: { id: item.id },
          update: {},
          create: {
            id: item.id,
            saleId: item.saleId,
            medicationId: item.medicationId,
            quantity: item.quantity,
            priceAtSale: item.priceAtSale,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
          }
        });
      }
    }
    console.log(`✅ ${sales.length} ventes migrées`);

    // 5. Migrer les mouvements de stock
    console.log('\n📦 Migration des mouvements de stock...');
    const stockMovements = sqlite.prepare('SELECT * FROM StockMovement').all();
    
    for (const movement of stockMovements) {
      await postgres.stockMovement.upsert({
        where: { id: movement.id },
        update: {},
        create: {
          id: movement.id,
          medicationId: movement.medicationId,
          type: movement.type,
          quantity: movement.quantity,
          reason: movement.reason,
          userId: movement.userId,
          createdAt: new Date(movement.createdAt)
        }
      });
    }
    console.log(`✅ ${stockMovements.length} mouvements de stock migrés`);

    // 6. Migrer les dépenses
    console.log('\n💳 Migration des dépenses...');
    const expenses = sqlite.prepare('SELECT * FROM Expense').all();
    
    for (const expense of expenses) {
      await postgres.expense.upsert({
        where: { id: expense.id },
        update: {},
        create: {
          id: expense.id,
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          userId: expense.userId,
          createdAt: new Date(expense.createdAt),
          updatedAt: new Date(expense.updatedAt)
        }
      });
    }
    console.log(`✅ ${expenses.length} dépenses migrées`);

    console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS !');
    console.log('\n📊 RÉSUMÉ :');
    console.log(`👥 Utilisateurs: ${users.length}`);
    console.log(`💊 Médicaments: ${medications.length}`);
    console.log(`🏥 Clients: ${clients.length}`);
    console.log(`💰 Ventes: ${sales.length}`);
    console.log(`📦 Mouvements: ${stockMovements.length}`);
    console.log(`💳 Dépenses: ${expenses.length}`);

  } catch (error) {
    console.error('❌ Erreur de migration:', error);
  } finally {
    sqlite.close();
    await postgres.$disconnect();
  }
}

// Exécuter la migration
migrateData();