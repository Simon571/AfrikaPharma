const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetSalesAndExpenses() {
  try {
    console.log('🔄 Réinitialisation de l\'historique des ventes et des dépenses...\n');

    // Compter les données avant suppression
    const salesCount = await prisma.sale.count();
    const saleItemsCount = await prisma.saleItem.count();
    const expensesCount = await prisma.expense.count();
    const clientsCount = await prisma.client.count();

    console.log('📊 Données actuelles dans la base:');
    console.log(`   • Ventes: ${salesCount}`);
    console.log(`   • Articles vendus: ${saleItemsCount}`);
    console.log(`   • Dépenses: ${expensesCount}`);
    console.log(`   • Clients: ${clientsCount}`);
    console.log('');

    if (salesCount === 0 && saleItemsCount === 0 && expensesCount === 0 && clientsCount === 0) {
      console.log('❌ Aucune donnée de vente ou de dépense trouvée.');
      return;
    }

    // Afficher un échantillon des données à supprimer
    if (salesCount > 0) {
      const sampleSales = await prisma.sale.findMany({
        take: 3,
        include: {
          client: true,
          seller: true,
          items: {
            include: {
              medication: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log('📋 Échantillon des ventes à supprimer:');
      sampleSales.forEach((sale, index) => {
        console.log(`${index + 1}. Vente #${sale.id.substring(0, 8)}... - ${sale.totalAmount} CDF`);
        console.log(`   Client: ${sale.client?.name || 'Inconnu'}`);
        console.log(`   Vendeur: ${sale.seller?.username || 'Inconnu'}`);
        console.log(`   Date: ${sale.createdAt.toLocaleDateString()}`);
        console.log(`   Articles: ${sale.items.length}`);
        console.log('');
      });
    }

    if (expensesCount > 0) {
      const sampleExpenses = await prisma.expense.findMany({
        take: 3,
        include: {
          user: true
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log('💸 Échantillon des dépenses à supprimer:');
      sampleExpenses.forEach((expense, index) => {
        console.log(`${index + 1}. Dépense #${expense.id.substring(0, 8)}... - ${expense.amount} CDF`);
        console.log(`   Description: ${expense.description}`);
        console.log(`   Catégorie: ${expense.category}`);
        console.log(`   Utilisateur: ${expense.user?.name || 'Inconnu'}`);
        console.log(`   Date: ${expense.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    console.log('🗑️  Suppression en cours...\n');

    // Supprimer dans l'ordre correct (contraintes de clés étrangères)
    
    // 1. Supprimer les articles de vente (SaleItem)
    const deletedSaleItems = await prisma.saleItem.deleteMany({});
    console.log(`✅ ${deletedSaleItems.count} articles de vente supprimés`);

    // 2. Supprimer les ventes (Sale)
    const deletedSales = await prisma.sale.deleteMany({});
    console.log(`✅ ${deletedSales.count} ventes supprimées`);

    // 3. Supprimer les dépenses (Expense)
    const deletedExpenses = await prisma.expense.deleteMany({});
    console.log(`✅ ${deletedExpenses.count} dépenses supprimées`);

    // 4. Supprimer les clients (Client)
    const deletedClients = await prisma.client.deleteMany({});
    console.log(`✅ ${deletedClients.count} clients supprimés`);

    console.log('\n🎯 Réinitialisation terminée avec succès!');
    console.log('');
    console.log('📊 État final:');
    console.log('   • Historique des ventes: Vide');
    console.log('   • Articles vendus: Vide');
    console.log('   • Dépenses: Vides');
    console.log('   • Clients: Vide');
    console.log('');
    console.log('✨ Le système est maintenant prêt pour de nouvelles données!');
    console.log('');
    console.log('📈 Vous pouvez maintenant:');
    console.log('   • Créer de nouvelles ventes');
    console.log('   • Ajouter de nouveaux clients');
    console.log('   • Enregistrer de nouvelles dépenses');
    console.log('   • Consulter des rapports vierges');

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Demander confirmation avant de procéder
console.log('⚠️  ATTENTION: Cette action va SUPPRIMER TOUTES les données de ventes et de dépenses!');
console.log('   - Toutes les ventes seront définitivement supprimées');
console.log('   - Tous les articles vendus seront supprimés');
console.log('   - Toutes les dépenses seront supprimées');
console.log('   - Tous les clients seront supprimés');
console.log('   - Cette action est IRRÉVERSIBLE');
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Êtes-vous sûr de vouloir SUPPRIMER tout l\'historique? (tapez "SUPPRIMER" pour confirmer): ', (answer) => {
  if (answer.toUpperCase() === 'SUPPRIMER') {
    resetSalesAndExpenses();
  } else {
    console.log('❌ Opération annulée.');
  }
  rl.close();
});