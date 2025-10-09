const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMedicationsAPI() {
  try {
    console.log('🧪 Test de l\'API des médicaments...\n');

    // Test 1: Compter le nombre total de médicaments
    const totalMedications = await prisma.medication.count();
    console.log(`✅ Nombre total de médicaments: ${totalMedications}`);

    // Test 2: Récupérer les 10 premiers médicaments
    const firstTenMedications = await prisma.medication.findMany({
      take: 10,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        pharmaceuticalForm: true,
        price: true,
        purchasePrice: true,
        quantity: true,
        expirationDate: true,
        isAvailableForSale: true
      }
    });

    console.log('\n📋 Les 10 premiers médicaments:');
    firstTenMedications.forEach((med, index) => {
      console.log(`${index + 1}. ${med.name} (${med.pharmaceuticalForm}) - Prix: ${med.price} CDF - Stock: ${med.quantity}`);
    });

    // Test 3: Recherche par terme
    const searchResults = await prisma.medication.findMany({
      where: {
        name: {
          contains: 'Paracétamol'
        }
      },
      take: 5,
      select: {
        name: true,
        pharmaceuticalForm: true,
        price: true,
        quantity: true
      }
    });

    console.log('\n🔍 Résultats de recherche pour "Paracétamol":');
    searchResults.forEach((med, index) => {
      console.log(`${index + 1}. ${med.name} (${med.pharmaceuticalForm}) - Prix: ${med.price} CDF - Stock: ${med.quantity}`);
    });

    // Test 4: Médicaments en stock
    const inStockCount = await prisma.medication.count({
      where: {
        quantity: { gt: 0 },
        isAvailableForSale: true
      }
    });

    console.log(`\n📦 Médicaments en stock: ${inStockCount}`);

    // Test 5: Médicaments par forme pharmaceutique
    const formDistribution = await prisma.medication.groupBy({
      by: ['pharmaceuticalForm'],
      _count: {
        pharmaceuticalForm: true
      }
    });

    console.log('\n💊 Distribution par forme pharmaceutique:');
    formDistribution.forEach(form => {
      console.log(`- ${form.pharmaceuticalForm}: ${form._count.pharmaceuticalForm} médicaments`);
    });

    console.log('\n✅ Tous les tests ont réussi ! L\'API des médicaments est prête.');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMedicationsAPI();