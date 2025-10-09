const { PrismaClient } = require('@prisma/client');

async function checkMedicationsWithDic() {
  console.log('🔍 Recherche de médicaments commençant par "Dic"...');
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.log('❌ Utilisez DATABASE_URL PostgreSQL');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // 1. Chercher tous les médicaments contenant "dic" (insensible à la casse)
    const dicMedications = await prisma.medication.findMany({
      where: {
        name: {
          contains: 'dic',
          mode: 'insensitive'
        }
      },
      take: 20
    });

    console.log(`📊 Médicaments contenant "dic" (insensible à la casse): ${dicMedications.length}`);
    dicMedications.slice(0, 10).forEach(med => {
      console.log(`   - ${med.name} (stock: ${med.quantity})`);
    });

    // 2. Chercher avec "Dic" exactement
    const dicExact = await prisma.medication.findMany({
      where: {
        name: {
          contains: 'Dic'
        }
      },
      take: 20
    });

    console.log(`\n📊 Médicaments contenant "Dic" (sensible à la casse): ${dicExact.length}`);
    dicExact.slice(0, 10).forEach(med => {
      console.log(`   - ${med.name} (stock: ${med.quantity})`);
    });

    // 3. Chercher tous les médicaments disponibles en commençant par D
    const dMedications = await prisma.medication.findMany({
      where: {
        AND: [
          { isAvailableForSale: true },
          { quantity: { gt: 0 } },
          {
            name: {
              startsWith: 'D',
              mode: 'insensitive'
            }
          }
        ]
      },
      take: 20,
      orderBy: { name: 'asc' }
    });

    console.log(`\n📊 Médicaments disponibles commençant par "D": ${dMedications.length}`);
    dMedications.slice(0, 15).forEach(med => {
      console.log(`   - ${med.name} (stock: ${med.quantity})`);
    });

    // 4. Test de l'API exactement comme elle fonctionne actuellement
    console.log('\n🔍 Test de la recherche API actuelle avec "Dic":');
    const apiResult = await prisma.medication.findMany({
      where: {
        AND: [
          { isAvailableForSale: true, quantity: { gt: 0 } },
          {
            OR: [
              { name: { contains: 'Dic' } },
              { barcode: { contains: 'Dic' } },
            ],
          },
        ],
      },
      take: 100,
      orderBy: { name: 'asc' },
    });

    console.log(`📊 Résultat API avec "Dic": ${apiResult.length} médicaments`);
    apiResult.slice(0, 10).forEach(med => {
      console.log(`   - ${med.name} (stock: ${med.quantity})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMedicationsWithDic();