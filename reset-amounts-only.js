const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetSalesAndExpensesAmounts() {
  try {
    console.log('🔄 Réinitialisation des montants des ventes et dépenses...\n');

    // Compter les données avant modification
    const salesCount = await prisma.sale.count();
    const saleItemsCount = await prisma.saleItem.count();
    const expensesCount = await prisma.expense.count();

    console.log('📊 Données à modifier:');
    console.log(`   • Ventes: ${salesCount}`);
    console.log(`   • Articles vendus: ${saleItemsCount}`);
    console.log(`   • Dépenses: ${expensesCount}`);
    console.log('');

    if (salesCount === 0 && saleItemsCount === 0 && expensesCount === 0) {
      console.log('❌ Aucune donnée de vente ou de dépense trouvée.');
      return;
    }

    console.log('🔄 Réinitialisation des montants en cours...\n');

    // Remettre à zéro les montants des ventes
    const updatedSales = await prisma.sale.updateMany({
      data: {
        totalAmount: 0,
        discount: 0
      }
    });
    console.log(`✅ ${updatedSales.count} ventes - montants remis à zéro`);

    // Remettre à zéro les articles de vente
    const updatedSaleItems = await prisma.saleItem.updateMany({
      data: {
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0
      }
    });
    console.log(`✅ ${updatedSaleItems.count} articles vendus - montants remis à zéro`);

    // Remettre à zéro les dépenses
    const updatedExpenses = await prisma.expense.updateMany({
      data: {
        amount: 0
      }
    });
    console.log(`✅ ${updatedExpenses.count} dépenses - montants remis à zéro`);

    console.log('\n🎯 Réinitialisation des montants terminée!');
    console.log('');
    console.log('📊 Nouvelles valeurs:');
    console.log('   • Montants des ventes: 0 CDF');
    console.log('   • Quantités vendues: 0');
    console.log('   • Prix unitaires: 0 CDF');
    console.log('   • Montants des dépenses: 0 CDF');
    console.log('');
    console.log('📝 Note: Les enregistrements sont conservés mais avec des montants à zéro');
    console.log('✨ Vous pouvez maintenant mettre à jour les montants selon vos besoins!');

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Demander confirmation avant de procéder
console.log('⚠️  ATTENTION: Cette action va remettre à ZÉRO tous les montants!');
console.log('   - Tous les montants de ventes seront mis à 0');
console.log('   - Toutes les quantités vendues seront mises à 0');
console.log('   - Tous les montants de dépenses seront mis à 0');
console.log('   - Les enregistrements seront CONSERVÉS (pas de suppression)');
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Êtes-vous sûr de vouloir remettre à ZÉRO tous les montants? (tapez "ZERO" pour confirmer): ', (answer) => {
  if (answer.toUpperCase() === 'ZERO') {
    resetSalesAndExpensesAmounts();
  } else {
    console.log('❌ Opération annulée.');
  }
  rl.close();
});