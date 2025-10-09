// Script de test pour créer des dépenses d'exemple
const { PrismaClient } = require('@prisma/client');

async function createSampleExpenses() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Création des dépenses d\'exemple...\n');

    // D'abord, récupérer l'utilisateur admin
    const adminUser = await prisma.user.findFirst({
      where: { username: 'admin' }
    });

    if (!adminUser) {
      console.log('❌ Utilisateur admin non trouvé');
      return;
    }

    // Créer quelques dépenses d'exemple
    const sampleExpenses = [
      {
        description: 'Facture d\'électricité',
        amount: 3000,
        category: 'Utilitaires',
        date: new Date('2025-09-02'),
        registeredBy: 'Administrateur',
        userId: adminUser.id
      },
      {
        description: 'Loyer mensuel',
        amount: 15000,
        category: 'Location',
        date: new Date('2025-09-01'),
        registeredBy: 'Administrateur',
        userId: adminUser.id
      },
      {
        description: 'Fournitures de bureau',
        amount: 2500,
        category: 'Matériel',
        date: new Date('2025-09-15'),
        registeredBy: 'Administrateur',
        userId: adminUser.id
      },
      {
        description: 'Maintenance équipement',
        amount: 5000,
        category: 'Maintenance',
        date: new Date('2025-09-10'),
        registeredBy: 'Administrateur',
        userId: adminUser.id
      }
    ];

    // Vérifier si des dépenses existent déjà
    const existingExpenses = await prisma.expense.count();
    
    if (existingExpenses > 0) {
      console.log(`✅ Il y a déjà ${existingExpenses} dépense(s) dans la base`);
    } else {
      console.log('📝 Aucune dépense existante, création des exemples...');
      
      for (const expense of sampleExpenses) {
        await prisma.expense.create({
          data: expense
        });
      }
      
      console.log(`✅ ${sampleExpenses.length} dépenses d'exemple créées`);
    }

    // Afficher toutes les dépenses
    const allExpenses = await prisma.expense.findMany({
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    console.log('\n📊 LISTE DES DÉPENSES:');
    console.log('─'.repeat(80));
    
    let total = 0;
    allExpenses.forEach(expense => {
      console.log(`📅 ${expense.date.toISOString().split('T')[0]} | ${expense.description} | ${expense.amount} CDF | ${expense.category || 'Général'}`);
      total += expense.amount;
    });
    
    console.log('─'.repeat(80));
    console.log(`💰 TOTAL DES DÉPENSES: ${total.toLocaleString()} CDF`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleExpenses();