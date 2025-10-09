const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function exportData() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "file:./prisma/dev.db"
      }
    }
  });

  try {
    console.log('🔄 Export des données SQLite...');

    // Export des utilisateurs
    const users = await prisma.user.findMany();
    console.log(`✅ ${users.length} utilisateurs trouvés`);

    // Export des médicaments  
    const medications = await prisma.medication.findMany();
    console.log(`✅ ${medications.length} médicaments trouvés`);

    // Export des ventes
    const sales = await prisma.sale.findMany({
      include: {
        items: true
      }
    });
    console.log(`✅ ${sales.length} ventes trouvées`);

    // Export des mouvements de stock
    const stockMovements = await prisma.stockMovement?.findMany() || [];
    console.log(`✅ ${stockMovements.length} mouvements de stock trouvés`);

    // Export des dépenses (si elles existent)
    let expenses = [];
    try {
      expenses = await prisma.expense?.findMany() || [];
      console.log(`✅ ${expenses.length} dépenses trouvées`);
    } catch (e) {
      console.log('ℹ️  Pas de table expenses (normal)');
    }

    // Sauvegarde dans un fichier JSON
    const exportData = {
      users,
      medications,
      sales,
      stockMovements,
      expenses,
      exportedAt: new Date().toISOString()
    };

    fs.writeFileSync('data-export.json', JSON.stringify(exportData, null, 2));
    console.log('🎉 Export terminé ! Fichier créé: data-export.json');

    // Afficher un résumé
    console.log('\n📊 RÉSUMÉ DES DONNÉES :');
    console.log(`👥 Utilisateurs: ${users.length}`);
    console.log(`💊 Médicaments: ${medications.length}`);
    console.log(`💰 Ventes: ${sales.length}`);
    console.log(`📦 Mouvements stock: ${stockMovements.length}`);
    console.log(`💳 Dépenses: ${expenses.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();