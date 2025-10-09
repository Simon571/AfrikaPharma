const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAllUsers() {
  const prisma = new PrismaClient();

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.error('❌ DATABASE_URL must point to a Postgres database. Set it in your .env');
    process.exit(1);
  }

  try {
    console.log('🔍 Vérification des utilisateurs existants...\n');

    // Vérifier tous les utilisateurs existants
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    console.log('👥 Utilisateurs existants:');
    existingUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.role}) - ID: ${user.id}`);
    });
    console.log('');

    // Définir les utilisateurs à créer
    const usersToCreate = [
      {
        username: 'superadmin',
        password: 'SuperAdmin!234',
        role: 'super-admin'
      },
      {
        username: 'admin',
        password: 'Admin!123',
        role: 'admin'
      },
      {
        username: 'vendeur',
        password: 'vendeur123',
        role: 'seller'
      }
    ];

    console.log('🔧 Création/Mise à jour des utilisateurs...\n');

    for (const userData of usersToCreate) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { username: userData.username }
      });

      if (existingUser) {
        // Mettre à jour l'utilisateur existant
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash: hashedPassword,
            role: userData.role
          }
        });
        console.log(`✅ Utilisateur mis à jour: ${updatedUser.username} (${updatedUser.role})`);
        console.log(`   Username: ${userData.username}`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   ID: ${updatedUser.id}\n`);
      } else {
        // Créer un nouvel utilisateur
        const newUser = await prisma.user.create({
          data: {
            username: userData.username,
            passwordHash: hashedPassword,
            role: userData.role
          }
        });
        console.log(`✅ Nouvel utilisateur créé: ${newUser.username} (${newUser.role})`);
        console.log(`   Username: ${userData.username}`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   ID: ${newUser.id}\n`);
      }
    }

    console.log('📋 RÉSUMÉ DES IDENTIFIANTS:');
    console.log('================================');
    console.log('🔹 SUPER ADMINISTRATEUR:');
    console.log('   Username: superadmin');
    console.log('   Password: SuperAdmin!234');
    console.log('   Rôle: super-admin\n');
    
    console.log('🔹 ADMINISTRATEUR:');
    console.log('   Username: admin');
    console.log('   Password: Admin!123');
    console.log('   Rôle: admin\n');
    
    console.log('🔹 VENDEUR:');
    console.log('   Username: vendeur');
    console.log('   Password: Vendeur!123');
    console.log('   Rôle: vendeur\n');

    console.log('✨ Tous les utilisateurs ont été créés/mis à jour avec succès!');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAllUsers();