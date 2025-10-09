const Database = require('better-sqlite3');
const fs = require('fs');

function exportSQLiteData() {
  console.log('🔄 Export des données SQLite avec better-sqlite3...');
  
  try {
    // Connexion à la base SQLite
    const db = new Database('./prisma/dev.db', { readonly: true });
    
    // Export des utilisateurs
    const users = db.prepare('SELECT * FROM User').all();
    console.log(`👥 ${users.length} utilisateurs trouvés`);
    
    // Export des médicaments
    const medications = db.prepare('SELECT * FROM Medication').all();
    console.log(`💊 ${medications.length} médicaments trouvés`);
    
    // Export des ventes
    const sales = db.prepare('SELECT * FROM Sale').all();
    console.log(`💰 ${sales.length} ventes trouvées`);
    
    // Export des détails de vente
    const saleDetails = db.prepare('SELECT * FROM SaleDetail').all();
    console.log(`📋 ${saleDetails.length} détails de vente trouvés`);
    
    // Export des paramètres de facture (si existe)
    let invoiceSettings = [];
    try {
      invoiceSettings = db.prepare('SELECT * FROM InvoiceSettings').all();
      console.log(`⚙️ ${invoiceSettings.length} paramètres de facture trouvés`);
    } catch (e) {
      console.log('⚙️ Table InvoiceSettings non trouvée');
    }
    
    // Export des dépenses (si existe)
    let expenses = [];
    try {
      expenses = db.prepare('SELECT * FROM Expense').all();
      console.log(`💸 ${expenses.length} dépenses trouvées`);
    } catch (e) {
      console.log('💸 Table Expense non trouvée');
    }
    
    // Sauvegarder dans un fichier JSON
    const exportData = {
      users,
      medications,
      sales,
      saleDetails,
      invoiceSettings,
      expenses,
      exportDate: new Date().toISOString()
    };
    
    fs.writeFileSync('sqlite-export.json', JSON.stringify(exportData, null, 2));
    console.log('✅ Export terminé : sqlite-export.json');
    
    db.close();
    return exportData;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    throw error;
  }
}

exportSQLiteData();