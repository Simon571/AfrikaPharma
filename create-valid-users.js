const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createValidUsers() {
  console.log('👥 Création des utilisateurs valides...');
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.log('❌ Utilisez DATABASE_URL PostgreSQL');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // Supprimer les utilisateurs existants
    await prisma.user.deleteMany();
    console.log('🗑️  Utilisateurs existants supprimés');

    // Créer le hash des mots de passe
    const adminPassword = await bcrypt.hash('admin123', 12);
    const vendeurPassword = await bcrypt.hash('vendeur123', 12);

    // Créer l'administrateur
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: adminPassword,
        role: 'admin'
      }
    });
    console.log('✅ Admin créé:', admin.username);

    // Créer le vendeur
    const vendeur = await prisma.user.create({
      data: {
        username: 'vendeur',
        passwordHash: vendeurPassword,
        role: 'seller'
      }
    });
    console.log('✅ Vendeur créé:', vendeur.username);

    console.log('🎉 Utilisateurs créés avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createValidUsers();