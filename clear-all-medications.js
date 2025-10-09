const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearAllMedications() {
  try {
    console.log('🗑️  Suppression complète de tous les médicaments...\n');

    // Compter le nombre total de médicaments avant suppression
    const totalMedications = await prisma.medication.count();
    console.log(`📊 Nombre total de médicaments à supprimer: ${totalMedications}`);

    if (totalMedications === 0) {
      console.log('❌ Aucun médicament trouvé dans la base de données.');
      return;
    }

    // Afficher un échantillon avant suppression
    const sampleMedications = await prisma.medication.findMany({
      take: 5,
      select: {
        name: true,
        pharmaceuticalForm: true,
        quantity: true
      },
      orderBy: { name: 'asc' }
    });

    console.log('📋 Échantillon des médicaments à supprimer:');
    sampleMedications.forEach((med, index) => {
      console.log(`${index + 1}. ${med.name} (${med.pharmaceuticalForm}) - Stock: ${med.quantity}`);
    });
    console.log('');

    // Supprimer tous les médicaments
    const result = await prisma.medication.deleteMany({});

    console.log(`✅ ${result.count} médicaments ont été supprimés avec succès!`);
    console.log('🎯 La base de données des médicaments est maintenant complètement vide.');
    console.log('✨ Vous pouvez maintenant ajouter de nouveaux médicaments via l\'interface ou l\'import!');

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Demander confirmation avant de procéder
console.log('⚠️  ATTENTION: Cette action va SUPPRIMER TOUS les médicaments de la base de données!');
console.log('   - Tous les médicaments seront définitivement supprimés');
console.log('   - Cette action est IRRÉVERSIBLE');
console.log('   - La liste des médicaments sera complètement vide');
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Êtes-vous sûr de vouloir SUPPRIMER TOUS les médicaments? (tapez "SUPPRIMER" pour confirmer): ', (answer) => {
  if (answer.toUpperCase() === 'SUPPRIMER') {
    clearAllMedications();
  } else {
    console.log('❌ Opération annulée.');
  }
  rl.close();
});