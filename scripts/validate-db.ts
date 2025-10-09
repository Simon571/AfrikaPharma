import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateDatabase() {
  console.log('🔍 Validation de l\'intégrité de la base de données...\n');
  
  try {
    // Test de connexion
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
    
    // Vérification des contraintes et index
    const medications = await prisma.medication.findMany({
      where: {
        barcode: {
          not: null,
        },
      },
      select: {
        id: true,
        barcode: true,
      },
    });
    
    // Vérifier les barcodes uniques
    const barcodes = medications.map(m => m.barcode).filter(Boolean);
    const uniqueBarcodes = new Set(barcodes);
    
    if (barcodes.length !== uniqueBarcodes.size) {
      console.log('❌ Erreur: Des barcodes en double détectés');
      return false;
    } else {
      console.log('✅ Contrainte d\'unicité des barcodes respectée');
    }
    
    // Vérifier l'intégrité référentielle des ventes
    const salesWithInvalidItems = await prisma.sale.findMany({
      where: {
        items: {
          none: {},
        },
      },
    });
    
    if (salesWithInvalidItems.length > 0) {
      console.log(`⚠️  Attention: ${salesWithInvalidItems.length} ventes sans articles détectées`);
    } else {
      console.log('✅ Intégrité des ventes validée');
    }
    
    // Vérifier les stocks négatifs
    const negativeStocks = await prisma.medication.findMany({
      where: {
        quantity: {
          lt: 0,
        },
      },
    });
    
    if (negativeStocks.length > 0) {
      console.log(`❌ Erreur: ${negativeStocks.length} médicaments avec stock négatif`);
      negativeStocks.forEach(med => {
        console.log(`  - ${med.name}: ${med.quantity}`);
      });
      return false;
    } else {
      console.log('✅ Aucun stock négatif détecté');
    }
    
    // Statistiques générales
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.medication.count(),
      prisma.sale.count(),
      prisma.client.count(),
      prisma.stockMovement.count(),
    ]);
    
    console.log('\n📊 Statistiques de la base de données:');
    console.log(`  - Utilisateurs: ${counts[0]}`);
    console.log(`  - Médicaments: ${counts[1]}`);
    console.log(`  - Ventes: ${counts[2]}`);
    console.log(`  - Clients: ${counts[3]}`);
    console.log(`  - Mouvements de stock: ${counts[4]}`);
    
    console.log('\n✅ Validation de la base de données terminée avec succès');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function optimizeDatabase() {
  console.log('\n🔧 Optimisation de la base de données...');
  
  try {
    // Analyse et optimisation SQLite
    await prisma.$executeRaw`ANALYZE;`;
    await prisma.$executeRaw`VACUUM;`;
    
    console.log('✅ Optimisation terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation:', error);
  }
}

// Script principal
if (require.main === module) {
  validateDatabase()
    .then(async (isValid) => {
      if (isValid) {
        await optimizeDatabase();
        process.exit(0);
      } else {
        console.log('\n❌ Validation échouée - Veuillez corriger les erreurs avant de continuer');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}

export { validateDatabase, optimizeDatabase };