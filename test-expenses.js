// Test simple pour vérifier les dépenses
const { PrismaClient } = require('@prisma/client');

async function testExpenses() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Test de récupération des dépenses...\n');

    const expenses = await prisma.expense.findMany({
      include: {
        user: {
          select: {
            username: true,
          }
        }
      },
      orderBy: { date: 'desc' },
    });

    console.log(`✅ ${expenses.length} dépenses trouvées:`);
    expenses.forEach((expense, index) => {
      console.log(`${index + 1}. ${expense.description} - ${expense.amount} CDF (${expense.category})`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testExpenses();