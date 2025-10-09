const { PrismaClient } = require('@prisma/client');

async function checkMedications() {
  console.log('💊 Vérification des médicaments...');
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.log('❌ Utilisez DATABASE_URL PostgreSQL');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // Récupérer tous les médicaments
    const medications = await prisma.medication.findMany({
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Total des médicaments: ${medications.length}`);

    if (medications.length > 0) {
      const inStock = medications.filter(m => m.quantity > 0);
      const lowStock = medications.filter(m => m.quantity > 0 && m.quantity <= 10);
      const outOfStock = medications.filter(m => m.quantity === 0);
      const available = medications.filter(m => m.isAvailableForSale);

      console.log(`📦 En stock: ${inStock.length}`);
      console.log(`⚠️  Stock faible: ${lowStock.length}`);
      console.log(`❌ Rupture: ${outOfStock.length}`);
      console.log(`✅ Disponibles à la vente: ${available.length}`);

      console.log('\n📋 Premiers médicaments disponibles:');
      inStock.slice(0, 5).forEach(med => {
        console.log(`  - ${med.name}: ${med.quantity} unités, ${med.price}€, vente: ${med.isAvailableForSale ? 'OUI' : 'NON'}`);
      });

      if (available.length === 0) {
        console.log('\n⚠️  PROBLÈME: Aucun médicament n\'est marqué comme disponible à la vente!');
        console.log('   Pour résoudre cela, exécutez:');
        console.log('   UPDATE "Medication" SET "isAvailableForSale" = true WHERE quantity > 0;');
      }
    } else {
      console.log('\n❌ PROBLÈME: Aucun médicament dans la base de données!');
      console.log('   Il faut d\'abord ajouter des médicaments.');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMedications();