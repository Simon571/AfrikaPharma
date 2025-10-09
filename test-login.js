const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function testLogin() {
  console.log('🔐 Test de connexion...');
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.log('❌ Utilisez DATABASE_URL PostgreSQL');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // Tester avec admin
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (adminUser) {
      console.log('✅ Utilisateur admin trouvé');
      console.log('  ID:', adminUser.id);
      console.log('  Username:', adminUser.username);
      console.log('  Role:', adminUser.role);
      console.log('  Password hash:', adminUser.passwordHash.substring(0, 20) + '...');
      
      // Tester le mot de passe
      const isValidPassword = await bcrypt.compare('admin123', adminUser.passwordHash);
      console.log('  Test mot de passe "admin123":', isValidPassword ? '✅ Valide' : '❌ Invalide');
      
      if (!isValidPassword) {
        console.log('  🔧 Recréation du hash...');
        const newHash = await bcrypt.hash('admin123', 12);
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { passwordHash: newHash }
        });
        console.log('  ✅ Hash mis à jour');
      }
    } else {
      console.log('❌ Utilisateur admin non trouvé');
    }

    // Lister tous les utilisateurs
    const allUsers = await prisma.user.findMany();
    console.log(`\n📋 Tous les utilisateurs (${allUsers.length}):`);
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.role})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();