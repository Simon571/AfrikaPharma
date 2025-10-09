// Test simple pour vérifier que l'API des dépenses fonctionne
console.log('🔍 Test de connexion à l\'API des dépenses...\n');

// Test de base - pas d'authentification (doit retourner 401)
fetch('http://localhost:3000/api/expenses')
  .then(response => {
    console.log(`📡 Status: ${response.status}`);
    if (response.status === 401) {
      console.log('✅ L\'API refuse correctement les connexions non authentifiées');
    } else {
      console.log('⚠️ Réponse inattendue:', response.status);
    }
    return response.text();
  })
  .then(data => {
    try {
      const json = JSON.parse(data);
      console.log('📄 Réponse:', json.message);
    } catch {
      console.log('📄 Réponse texte:', data);
    }
  })
  .catch(error => {
    console.error('❌ Erreur de connexion:', error.message);
  });

// Test des données directes dans la base
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\n🗄️ Vérification de la base de données...');
    const count = await prisma.expense.count();
    console.log(`✅ ${count} dépense(s) trouvée(s) dans la base`);
    
    if (count > 0) {
      const latest = await prisma.expense.findFirst({
        orderBy: { date: 'desc' },
        include: {
          user: {
            select: { username: true }
          }
        }
      });
      
      console.log(`📊 Dernière dépense: "${latest.description}" - ${latest.amount} CDF`);
    }
    
  } catch (error) {
    console.error('❌ Erreur base de données:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();