const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetMedicationsData() {
  try {
    console.log('🔄 Réinitialisation des données des médicaments...\n');

    // Compter le nombre total de médicaments avant la réinitialisation
    const totalMedications = await prisma.medication.count();
    console.log(`📊 Nombre total de médicaments à réinitialiser: ${totalMedications}`);

    if (totalMedications === 0) {
      console.log('❌ Aucun médicament trouvé dans la base de données.');
      return;
    }

    // Réinitialiser toutes les données des médicaments
    const result = await prisma.medication.updateMany({
      data: {
        quantity: 0,                    // Quantité à zéro
        price: 0,                       // Prix de vente à zéro
        purchasePrice: 0,               // Prix d'achat à zéro
        expirationDate: new Date('2025-01-01'), // Date d'expiration par défaut
        isAvailableForSale: false,      // Non disponible à la vente
        barcode: null                   // Code-barres vide
      }
    });

    console.log(`✅ ${result.count} médicaments ont été réinitialisés avec succès!\n`);

    // Afficher un échantillon des médicaments réinitialisés
    const sampleMedications = await prisma.medication.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        pharmaceuticalForm: true,
        quantity: true,
        price: true,
        purchasePrice: true,
        expirationDate: true,
        isAvailableForSale: true
      },
      orderBy: { name: 'asc' }
    });

    console.log('📋 Échantillon des médicaments réinitialisés:');
    console.log('═'.repeat(80));
    sampleMedications.forEach((med, index) => {
      console.log(`${index + 1}. ${med.name} (${med.pharmaceuticalForm})`);
      console.log(`   - Quantité: ${med.quantity}`);
      console.log(`   - Prix d'achat: ${med.purchasePrice} CDF`);
      console.log(`   - Prix de vente: ${med.price} CDF`);
      console.log(`   - Date d'expiration: ${med.expirationDate.toLocaleDateString()}`);
      console.log(`   - Disponible: ${med.isAvailableForSale ? 'Oui' : 'Non'}`);
      console.log('');
    });

    console.log('🎯 Toutes les données des médicaments ont été réinitialisées:');
    console.log('   • Quantités: 0');
    console.log('   • Prix d\'achat: 0 CDF');
    console.log('   • Prix de vente: 0 CDF');
    console.log('   • Date d\'expiration: 01/01/2025');
    console.log('   • Disponibilité: Non');
    console.log('   • Code-barres: Vide');
    console.log('\n✨ Les médicaments sont maintenant prêts à être mis à jour avec de nouvelles données!');

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Demander confirmation avant de procéder
console.log('⚠️  ATTENTION: Cette action va réinitialiser TOUTES les données des médicaments!');
console.log('   - Les quantités seront mises à 0');
console.log('   - Les prix seront mis à 0');
console.log('   - Les dates d\'expiration seront remises au 01/01/2025');
console.log('   - Tous les médicaments seront marqués comme non disponibles');
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Êtes-vous sûr de vouloir continuer? (tapez "OUI" pour confirmer): ', (answer) => {
  if (answer.toUpperCase() === 'OUI') {
    resetMedicationsData();
  } else {
    console.log('❌ Opération annulée.');
  }
  rl.close();
});