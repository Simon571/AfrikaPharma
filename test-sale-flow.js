const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function testSaleFlow() {
  console.log('🛒 Test du processus de vente...');
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.log('❌ Utilisez DATABASE_URL PostgreSQL');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // 1. Vérifier l'utilisateur vendeur
    const seller = await prisma.user.findUnique({
      where: { username: 'vendeur' }
    });

    if (!seller) {
      console.log('❌ Utilisateur vendeur non trouvé');
      return;
    }

    console.log(`✅ Vendeur trouvé: ${seller.username} (${seller.role})`);

    // 2. Prendre un médicament disponible
    const medication = await prisma.medication.findFirst({
      where: {
        quantity: { gt: 0 },
        isAvailableForSale: true
      }
    });

    if (!medication) {
      console.log('❌ Aucun médicament disponible');
      return;
    }

    console.log(`✅ Médicament sélectionné: ${medication.name} (stock: ${medication.quantity}, prix: ${medication.price}€)`);

    // 3. Créer un client
    let client = await prisma.client.findFirst({
      where: { name: 'Client Test' }
    });

    if (!client) {
      client = await prisma.client.create({
        data: { name: 'Client Test' }
      });
      console.log('✅ Client créé: Client Test');
    } else {
      console.log('✅ Client existant trouvé: Client Test');
    }

    // 4. Créer une vente de test
    const saleData = {
      clientId: client.id,
      sellerId: seller.id,
      totalAmount: medication.price * 2, // acheter 2 unités
      amountPaid: medication.price * 2,
      changeDue: 0,
      paymentMethod: 'Espèces',
      items: {
        create: [{
          medicationId: medication.id,
          quantity: 2,
          priceAtSale: medication.price
        }]
      }
    };

    console.log('📝 Création de la vente test...');
    const sale = await prisma.sale.create({
      data: saleData,
      include: {
        items: {
          include: {
            medication: true
          }
        },
        client: true,
        seller: true
      }
    });

    console.log(`✅ Vente créée avec succès!`);
    console.log(`   ID: ${sale.id}`);
    console.log(`   Date: ${sale.date.toLocaleString('fr-FR')}`);
    console.log(`   Montant: ${sale.totalAmount}€`);
    console.log(`   Articles: ${sale.items.length}`);

    // 5. Mettre à jour le stock
    await prisma.medication.update({
      where: { id: medication.id },
      data: {
        quantity: {
          decrement: 2
        }
      }
    });

    console.log(`✅ Stock mis à jour (${medication.quantity} -> ${medication.quantity - 2})`);

    // 6. Vérifier que la vente apparaît dans les rapports
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const todaySales = await prisma.sale.findMany({
      where: {
        sellerId: seller.id,
        date: {
          gte: startOfToday,
          lte: endOfToday
        }
      },
      include: {
        items: {
          include: {
            medication: true
          }
        }
      }
    });

    console.log(`📊 Ventes du vendeur aujourd'hui: ${todaySales.length}`);
    todaySales.forEach(s => {
      console.log(`   - Vente ${s.id}: ${s.totalAmount}€ à ${s.date.toLocaleTimeString('fr-FR')}`);
    });

    console.log('\n🎉 Test terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testSaleFlow();