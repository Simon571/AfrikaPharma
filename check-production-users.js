const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  console.log('🔍 Vérification des utilisateurs...');
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.log('❌ Utilisez DATABASE_URL PostgreSQL');
    return;
  }

  const prisma = new PrismaClient();

  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, passwordHash: true }
    });
    console.log(`👥 ${users.length} utilisateurs trouvés:`);

    users.forEach(user => {
      console.log(`  - ${user.username} (${user.role})`);
      if (user.passwordHash) {
        console.log(`    Hash: ${user.passwordHash.substring(0, 20)}...`);
      }
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();