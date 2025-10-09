const { PrismaClient } = require('@prisma/client');

async function checkDuplicateMedications() {
  console.log('🔍 Vérification des médicaments dupliqués...');
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.log('❌ Utilisez DATABASE_URL PostgreSQL');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // 1. Compter tous les médicaments
    const totalMedications = await prisma.medication.count();
    console.log(`📊 Total des médicaments: ${totalMedications}`);

    // 2. Chercher les doublons par nom
    const duplicatesByName = await prisma.medication.groupBy({
      by: ['name'],
      _count: {
        name: true
      },
      having: {
        name: {
          _count: {
            gt: 1
          }
        }
      },
      orderBy: {
        _count: {
          name: 'desc'
        }
      }
    });

    console.log(`\n🔍 Médicaments avec noms dupliqués: ${duplicatesByName.length}`);
    
    if (duplicatesByName.length > 0) {
      console.log('\n📋 Top 10 des doublons par nom:');
      for (let i = 0; i < Math.min(10, duplicatesByName.length); i++) {
        const duplicate = duplicatesByName[i];
        console.log(`   - "${duplicate.name}": ${duplicate._count.name} fois`);
        
        // Afficher les détails de ces doublons
        const details = await prisma.medication.findMany({
          where: { name: duplicate.name },
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
            barcode: true,
            isAvailableForSale: true
          }
        });
        
        details.forEach((med, index) => {
          console.log(`     ${index + 1}. ID: ${med.id.slice(-8)} | Prix: ${med.price}€ | Stock: ${med.quantity} | Barcode: ${med.barcode || 'N/A'} | Disponible: ${med.isAvailableForSale}`);
        });
        console.log('');
      }
    }

    // 3. Chercher les doublons par code-barres (s'il y en a)
    const duplicatesByBarcode = await prisma.medication.groupBy({
      by: ['barcode'],
      _count: {
        barcode: true
      },
      where: {
        barcode: {
          not: null
        }
      },
      having: {
        barcode: {
          _count: {
            gt: 1
          }
        }
      }
    });

    console.log(`🔍 Médicaments avec codes-barres dupliqués: ${duplicatesByBarcode.length}`);

    // 4. Suggestions de nettoyage
    if (duplicatesByName.length > 0) {
      console.log('\n💡 Suggestions pour nettoyer les doublons:');
      console.log('   1. Fusionner les quantités des doublons');
      console.log('   2. Garder celui avec le prix le plus récent');
      console.log('   3. Supprimer les doublons avec stock = 0');
      console.log('   4. Vérifier les différences de prix');
    }

    // 5. Analyser un échantillon de la liste actuelle
    console.log('\n📋 Échantillon de médicaments disponibles à la vente:');
    const sampleMedications = await prisma.medication.findMany({
      where: {
        isAvailableForSale: true,
        quantity: { gt: 0 }
      },
      take: 20,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        price: true,
        quantity: true
      }
    });

    sampleMedications.forEach((med, index) => {
      console.log(`   ${index + 1}. ${med.name} | ${med.price}€ | Stock: ${med.quantity}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicateMedications();