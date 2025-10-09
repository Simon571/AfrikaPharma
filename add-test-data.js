#!/usr/bin/env node

/**
 * Script pour ajouter des médicaments de test
 * Permet de tester l'interface mobile avec des données
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestMedications() {
  console.log('🔄 Ajout de médicaments de test pour l\'interface mobile...\n');

  const testMedications = [
    {
      name: 'Paracétamol 500mg',
      pharmaceuticalForm: 'Comprimé',
      purchasePrice: 0.15,
      price: 0.25,
      quantity: 120,
      expirationDate: new Date('2026-12-31'),
      barcode: '123456789012',
      isAvailableForSale: true
    },
    {
      name: 'Ibuprofène 200mg',
      pharmaceuticalForm: 'Comprimé',
      purchasePrice: 0.20,
      price: 0.35,
      quantity: 80,
      expirationDate: new Date('2026-06-30'),
      barcode: '123456789013',
      isAvailableForSale: true
    },
    {
      name: 'Aspirine 100mg',
      pharmaceuticalForm: 'Comprimé',
      purchasePrice: 0.12,
      price: 0.22,
      quantity: 150,
      expirationDate: new Date('2027-03-15'),
      barcode: '123456789014',
      isAvailableForSale: true
    },
    {
      name: 'Doliprane 1000mg',
      pharmaceuticalForm: 'Comprimé',
      purchasePrice: 0.25,
      price: 0.45,
      quantity: 60,
      expirationDate: new Date('2026-09-30'),
      barcode: '123456789015',
      isAvailableForSale: true
    },
    {
      name: 'Amoxicilline 500mg',
      pharmaceuticalForm: 'Gélule',
      purchasePrice: 0.80,
      price: 1.20,
      quantity: 45,
      expirationDate: new Date('2025-12-31'),
      barcode: '123456789016',
      isAvailableForSale: true
    },
    {
      name: 'Vitamine C 1000mg',
      pharmaceuticalForm: 'Comprimé effervescent',
      purchasePrice: 0.30,
      price: 0.50,
      quantity: 200,
      expirationDate: new Date('2027-12-31'),
      barcode: '123456789017',
      isAvailableForSale: true
    },
    {
      name: 'Sirop contre la toux',
      pharmaceuticalForm: 'Sirop',
      purchasePrice: 3.50,
      price: 5.80,
      quantity: 25,
      expirationDate: new Date('2026-08-15'),
      barcode: '123456789018',
      isAvailableForSale: true
    },
    {
      name: 'Spray nasal',
      pharmaceuticalForm: 'Spray',
      purchasePrice: 2.20,
      price: 3.90,
      quantity: 30,
      expirationDate: new Date('2026-11-30'),
      barcode: '123456789019',
      isAvailableForSale: true
    },
    {
      name: 'Compresses stériles',
      pharmaceuticalForm: 'Matériel médical',
      purchasePrice: 1.50,
      price: 2.50,
      quantity: 100,
      expirationDate: new Date('2028-01-31'),
      barcode: '123456789020',
      isAvailableForSale: true
    },
    {
      name: 'Thermomètre digital',
      pharmaceuticalForm: 'Dispositif médical',
      purchasePrice: 8.00,
      price: 12.90,
      quantity: 15,
      expirationDate: new Date('2030-12-31'),
      barcode: '123456789021',
      isAvailableForSale: true
    }
  ];

  try {
    // Ajouter les médicaments un par un
    for (const med of testMedications) {
      // Vérifier s'il existe déjà
      const existing = await prisma.medication.findFirst({
        where: { name: med.name }
      });

      if (!existing) {
        await prisma.medication.create({
          data: med
        });
        console.log(`✅ Ajouté: ${med.name} (${med.quantity} en stock)`);
      } else {
        console.log(`⚠️  Existe déjà: ${med.name}`);
      }
    }

    console.log('\n🎯 Médicaments de test ajoutés avec succès !');
    console.log('\n📱 Vous pouvez maintenant tester l\'interface mobile:');
    console.log('1. Aller sur http://localhost:3002/ventes');
    console.log('2. Rechercher "paracetamol" ou "ibuprofen"');
    console.log('3. Ajouter des produits au panier');
    console.log('4. Tester la finalisation de vente');

    // Statistiques
    const totalMeds = await prisma.medication.count();
    const lowStock = await prisma.medication.count({
      where: { quantity: { lte: 20 } }
    });

    console.log('\n📊 Statistiques:');
    console.log(`Total médicaments: ${totalMeds}`);
    console.log(`Stock faible (≤20): ${lowStock}`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des médicaments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Vérifier si on peut créer un utilisateur de test aussi
async function addTestUser() {
  try {
    const testSeller = await prisma.user.findFirst({
      where: { username: 'vendeur' }
    });

    if (!testSeller) {
      await prisma.user.create({
        data: {
          username: 'vendeur',
          passwordHash: 'vendeur123', // En production, utiliser un hash bcrypt
          role: 'seller'
        }
      });
      console.log('✅ Utilisateur vendeur de test créé');
    }

    const testAdmin = await prisma.user.findFirst({
      where: { username: 'admin' }
    });

    if (!testAdmin) {
      await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash: 'admin123', // En production, utiliser un hash bcrypt
          role: 'admin'
        }
      });
      console.log('✅ Utilisateur admin de test créé');
    }

  } catch (error) {
    console.log('⚠️  Utilisateurs de test déjà présents ou erreur:', error.message);
  }
}

async function main() {
  await addTestUser();
  await addTestMedications();
}

main();