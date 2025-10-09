const { PrismaClient } = require('@prisma/client');

async function testPostgreSQLConnection() {
  console.log('🔄 Test de connexion PostgreSQL...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL n\'est pas configuré');
    console.log('Ajoutez votre URL Neon dans .env.local');
    return;
  }

  if (process.env.DATABASE_URL.includes('file:')) {
    console.log('ℹ️  Vous utilisez encore SQLite. Changez DATABASE_URL pour PostgreSQL.');
    return;
  }

  console.log('📡 URL:', process.env.DATABASE_URL.substring(0, 50) + '...');

  const prisma = new PrismaClient();

  try {
    // Test de connexion simple
    await prisma.$connect();
    console.log('✅ Connexion PostgreSQL réussie !');

    // Test de requête simple
    const result = await prisma.$queryRaw`SELECT CURRENT_TIMESTAMP as current_time`;
    console.log('⏰ Heure serveur PostgreSQL:', result[0].current_time);

    // Vérifier les tables existantes
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('📋 Tables existantes:', tables.map(t => t.table_name));

    console.log('🎉 PostgreSQL est prêt pour la migration !');

  } catch (error) {
    console.error('❌ Erreur de connexion PostgreSQL:', error.message);
    console.log('');
    console.log('💡 Solutions possibles :');
    console.log('1. Vérifiez que l\'URL DATABASE_URL est correcte');
    console.log('2. Assurez-vous que ?sslmode=require est dans l\'URL');
    console.log('3. Vérifiez vos identifiants Neon');
    
  } finally {
    await prisma.$disconnect();
  }
}

testPostgreSQLConnection();