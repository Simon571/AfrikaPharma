const { PrismaClient } = require('@prisma/client');

async function cleanDuplicateMedications() {
  console.log('🧹 Nettoyage des médicaments dupliqués...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://username:password@host:port/database'
      }
    }
  });

  try {
    // 1. Trouver tous les groupes de médicaments avec le même nom
    console.log('🔍 Recherche des doublons par nom...');
    
    const medications = await prisma.medication.findMany({
      orderBy: { name: 'asc' }
    });

    const grouped = {};
    medications.forEach(med => {
      const key = med.name.trim();
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(med);
    });

    const duplicateGroups = Object.entries(grouped).filter(([_, meds]) => meds.length > 1);
    
    console.log(`📊 Trouvé ${duplicateGroups.length} noms avec doublons`);
    console.log(`📊 Total des médicaments: ${medications.length}`);

    let totalMerged = 0;
    let totalDeleted = 0;

    // 2. Pour chaque groupe de doublons, fusionner intelligemment
    for (const [name, duplicates] of duplicateGroups) {
      console.log(`\n🔧 Traitement: "${name}" (${duplicates.length} doublons)`);
      
      // Trier par quantité (plus gros stock en premier), puis par prix
      duplicates.sort((a, b) => {
        if (b.quantity !== a.quantity) return b.quantity - a.quantity;
        return b.price - a.price; // Prix plus élevé en premier
      });

      // Garder le premier (meilleur stock/prix), fusionner les autres
      const masterRecord = duplicates[0];
      const toMerge = duplicates.slice(1);
      
      console.log(`   📌 Garder: ID ${masterRecord.id.slice(-8)} - ${masterRecord.price} CDF - Stock: ${masterRecord.quantity}`);
      
      // Calculer la somme des stocks
      const totalStock = duplicates.reduce((sum, med) => sum + med.quantity, 0);
      
      // Calculer le prix moyen pondéré par le stock
      const totalValue = duplicates.reduce((sum, med) => sum + (med.price * med.quantity), 0);
      const averagePrice = totalStock > 0 ? Math.round(totalValue / totalStock) : masterRecord.price;

      // Mettre à jour le master avec les valeurs consolidées
      await prisma.medication.update({
        where: { id: masterRecord.id },
        data: {
          quantity: totalStock,
          price: averagePrice,
          // Garder les autres champs du master
        }
      });

      console.log(`   ✅ Fusionné en: Stock total: ${totalStock}, Prix moyen: ${averagePrice} CDF`);

      // Supprimer les doublons
      for (const duplicate of toMerge) {
        console.log(`   🗑️ Suppression: ID ${duplicate.id.slice(-8)} - ${duplicate.price} CDF - Stock: ${duplicate.quantity}`);
        await prisma.medication.delete({
          where: { id: duplicate.id }
        });
        totalDeleted++;
      }

      totalMerged++;
    }

    // 3. Statistiques finales
    const finalCount = await prisma.medication.count();
    
    console.log('\n✅ Nettoyage terminé!');
    console.log(`📊 Statistiques:`);
    console.log(`   - Groupes fusionnés: ${totalMerged}`);
    console.log(`   - Enregistrements supprimés: ${totalDeleted}`);
    console.log(`   - Médicaments avant: ${medications.length}`);
    console.log(`   - Médicaments après: ${finalCount}`);
    console.log(`   - Gain: ${medications.length - finalCount} doublons éliminés`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Assurez-vous que DATABASE_URL est définie dans .env.local');
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter seulement si appelé directement
if (require.main === module) {
  // Vérifier que la variable d'environnement est définie
  if (!process.env.DATABASE_URL) {
    console.log('❌ Variable DATABASE_URL non définie');
    console.log('💡 Exécutez: $env:DATABASE_URL = "votre_url"; node clean-duplicates.js');
    process.exit(1);
  }
  
  cleanDuplicateMedications();
}

module.exports = { cleanDuplicateMedications };