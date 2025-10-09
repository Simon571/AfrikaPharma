const { PrismaClient } = require('@prisma/client');

async function testUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📊 Récupération des utilisateurs avec informations d\'essai...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        trialStartDate: true,
        trialEndDate: true,
        isTrialActive: true,
        subscriptionType: true,
        lastTrialCheck: true,
        trialDaysUsed: true
      }
    });

    console.log('👥 Utilisateurs trouvés:', users.length);
    console.log('\n📋 Détails des utilisateurs:');
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.username} (${user.role})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Essai actif: ${user.isTrialActive}`);
      console.log(`   Type d'abonnement: ${user.subscriptionType || 'Non défini'}`);
      console.log(`   Début d'essai: ${user.trialStartDate || 'Non défini'}`);
      console.log(`   Fin d'essai: ${user.trialEndDate || 'Non défini'}`);
      console.log(`   Dernière vérification: ${user.lastTrialCheck || 'Jamais'}`);
      console.log(`   Jours d'essai utilisés: ${user.trialDaysUsed || 0}`);
    });

    // Test de création d'un utilisateur avec période d'essai
    console.log('\n🧪 Test de création d\'un utilisateur d\'essai...');
    
    const testUser = await prisma.user.create({
      data: {
        username: 'testeur_essai',
        passwordHash: '$2b$10$test', // Hash temporaire
        role: 'seller',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        isTrialActive: true,
        subscriptionType: 'trial',
        lastTrialCheck: new Date(),
        trialDaysUsed: 0
      }
    });

    console.log('✅ Utilisateur de test créé:', {
      id: testUser.id,
      username: testUser.username,
      role: testUser.role,
      isTrialActive: testUser.isTrialActive,
      subscriptionType: testUser.subscriptionType
    });

    return testUser.id;

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

testUsers().then((userId) => {
  if (userId) {
    console.log(`\n🎯 ID de l'utilisateur de test: ${userId}`);
    console.log(`🔗 Testez l'API avec: http://localhost:3000/api/trial/status/${userId}`);
  }
});