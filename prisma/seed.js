const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Créer l'utilisateur administrateur
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      role: 'admin',
    },
  });

  // Créer l'utilisateur vendeur
  const sellerPassword = await bcrypt.hash('vendeur123', 10);
  await prisma.user.upsert({
    where: { username: 'vendeur' },
    update: {},
    create: {
      username: 'vendeur',
      passwordHash: sellerPassword,
      role: 'seller',
    },
  });

  console.log('Seed completed - Admin and Seller users created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });