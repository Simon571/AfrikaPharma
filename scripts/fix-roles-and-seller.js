const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.error('❌ DATABASE_URL must be a Postgres connection string.');
    process.exit(1);
  }

  try {
    console.log('🔧 Correction des rôles et du compte vendeur...');

    // 1) Convertir tous les rôles 'vendeur' -> 'seller'
    const updated = await prisma.user.updateMany({
      where: { role: 'vendeur' },
      data: { role: 'seller' }
    });
    console.log(`  ✅ Rôles convertis: ${updated.count} utilisateur(s) mis à jour`);

    // 2) S'assurer que l'utilisateur 'vendeur' existe avec mot de passe vendeur123 et rôle seller
    const username = 'vendeur';
    const password = 'vendeur123';
    const hash = await bcrypt.hash(password, 12);

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: hash, role: 'seller' }
      });
      console.log('  ✅ Utilisateur vendeur mis à jour (role seller, mdp réinitialisé)');
    } else {
      await prisma.user.create({
        data: { username, passwordHash: hash, role: 'seller' }
      });
      console.log('  ✅ Utilisateur vendeur créé (role seller)');
    }

    console.log('🎉 Correction terminée.');
  } catch (e) {
    console.error('❌ Erreur:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
