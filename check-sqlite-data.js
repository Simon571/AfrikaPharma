const Database = require('better-sqlite3');
const fs = require('fs');

try {
  console.log('🔄 Connexion à la base SQLite...');
  
  const db = new Database('./prisma/dev.db', { readonly: true });
  
  // Lister toutes les tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📋 Tables trouvées:', tables.map(t => t.name));
  
  // Compter les données dans chaque table
  const summary = {};
  
  for (const table of tables) {
    if (table.name === 'sqlite_sequence' || table.name.startsWith('_')) continue;
    
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM "${table.name}"`).get();
      summary[table.name] = count.count;
      console.log(`📊 ${table.name}: ${count.count} entrées`);
    } catch (e) {
      console.log(`⚠️  Erreur pour ${table.name}:`, e.message);
    }
  }
  
  // Sauvegarder le résumé
  fs.writeFileSync('database-summary.json', JSON.stringify({
    tables: tables.map(t => t.name),
    counts: summary,
    exportedAt: new Date().toISOString()
  }, null, 2));
  
  console.log('\n✅ Résumé sauvegardé dans database-summary.json');
  
  db.close();
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}