const Database = require('better-sqlite3');

function inspectSQLite() {
  console.log('🔍 Inspection de la base SQLite...');
  
  try {
    const db = new Database('./prisma/dev.db', { readonly: true });
    
    // Lister toutes les tables
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();
    
    console.log('📋 Tables trouvées:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
      
      // Compter les enregistrements
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
        console.log(`    → ${count.count} enregistrements`);
      } catch (e) {
        console.log(`    → Erreur de comptage: ${e.message}`);
      }
    });
    
    db.close();
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

inspectSQLite();