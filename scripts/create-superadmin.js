const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  const prisma = new PrismaClient();

  const username = process.env.SUPERADMIN_USERNAME || 'superadmin';
  const password = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin!234';

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.error('❌ DATABASE_URL must point to a Postgres database. Set it in your .env');
    process.exit(1);
  }

  try {
    const hashed = await bcrypt.hash(password, 12);

    // Upsert the super-admin by username
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: hashed, role: 'super-admin' }
      });
      console.log('✅ Super-admin updated:', { id: updated.id, username: updated.username });
      console.log('Credentials:');
      console.log('  username:', username);
      console.log('  password:', password);
      console.log('\nUse this ID as OWNER_ID if needed:', updated.id);
      process.exit(0);
    }

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hashed,
        role: 'super-admin'
      }
    });

    console.log('✅ Super-admin created:', { id: user.id, username: user.username });
    console.log('Credentials:');
    console.log('  username:', username);
    console.log('  password:', password);
    console.log('\nUse this ID as OWNER_ID if needed:', user.id);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super-admin:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createSuperAdmin();
