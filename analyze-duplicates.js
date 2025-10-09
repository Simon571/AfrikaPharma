const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function analyzeDuplicates() {
  console.log('🔍 Analyse des doublons (LECTURE SEULE)...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://username:password@host:port/database'
      }
    }
  });

  try {
    // 1. Récupérer tous les médicaments
    const medications = await prisma.medication.findMany({
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Total des médicaments: ${medications.length}`);

    // 2. Grouper par nom
    const grouped = {};
    medications.forEach(med => {
      const key = med.name.trim();
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(med);
    });

    const duplicateGroups = Object.entries(grouped).filter(([_, meds]) => meds.length > 1);
    const singleMeds = Object.entries(grouped).filter(([_, meds]) => meds.length === 1);
    
    console.log(`📊 Médicaments uniques: ${singleMeds.length}`);
    console.log(`📊 Noms avec doublons: ${duplicateGroups.length}`);

    // 3. Créer un rapport détaillé
    let report = `RAPPORT D'ANALYSE DES DOUBLONS - ${new Date().toISOString()}\n`;
    report += `===============================================\n\n`;
    report += `Total médicaments: ${medications.length}\n`;
    report += `Noms uniques: ${singleMeds.length}\n`;
    report += `Noms avec doublons: ${duplicateGroups.length}\n\n`;

    let totalDuplicates = 0;
    let totalValue = 0;

    duplicateGroups.slice(0, 20).forEach(([name, duplicates], index) => {
      report += `${index + 1}. "${name}" (${duplicates.length} variantes):\n`;
      
      duplicates.forEach((med, i) => {
        const value = med.price * med.quantity;
        totalValue += value;
        report += `   ${i + 1}. ID: ${med.id.slice(-8)} | ${med.price} CDF | Stock: ${med.quantity} | Valeur: ${value.toLocaleString()} CDF\n`;
      });
      
      // Simulation de fusion
      const totalStock = duplicates.reduce((sum, med) => sum + med.quantity, 0);
      const totalWorth = duplicates.reduce((sum, med) => sum + (med.price * med.quantity), 0);
      const avgPrice = totalStock > 0 ? Math.round(totalWorth / totalStock) : duplicates[0].price;
      
      report += `   → FUSION: Stock total: ${totalStock}, Prix moyen: ${avgPrice} CDF, Valeur: ${totalWorth.toLocaleString()} CDF\n`;
      report += `   → SUPPRESSION: ${duplicates.length - 1} doublons\n\n`;
      
      totalDuplicates += duplicates.length - 1;
    });

    report += `\nRÉSUMÉ:\n`;
    report += `- Doublons à supprimer: ${totalDuplicates}\n`;
    report += `- Médicaments après nettoyage: ${medications.length - totalDuplicates}\n`;
    report += `- Réduction: ${((totalDuplicates / medications.length) * 100).toFixed(1)}%\n`;

    // 4. Sauvegarder le rapport
    fs.writeFileSync('rapport-doublons.txt', report, 'utf8');
    console.log('📝 Rapport sauvegardé: rapport-doublons.txt');

    // 5. Afficher les 10 premiers doublons
    console.log('\n📋 Top 10 des doublons:');
    duplicateGroups.slice(0, 10).forEach(([name, duplicates], index) => {
      console.log(`\n${index + 1}. "${name}" (${duplicates.length} variantes):`);
      duplicates.forEach((med, i) => {
        console.log(`   ${i + 1}. ${med.price} CDF | Stock: ${med.quantity} | ID: ...${med.id.slice(-8)}`);
      });
    });

    // 6. Créer une sauvegarde JSON
    const backup = {
      timestamp: new Date().toISOString(),
      totalMedications: medications.length,
      duplicateGroups: duplicateGroups.map(([name, meds]) => ({
        name,
        count: meds.length,
        medications: meds.map(med => ({
          id: med.id,
          name: med.name,
          price: med.price,
          quantity: med.quantity,
          barcode: med.barcode
        }))
      }))
    };

    fs.writeFileSync('backup-doublons.json', JSON.stringify(backup, null, 2), 'utf8');
    console.log('💾 Sauvegarde créée: backup-doublons.json');

    console.log(`\n✅ Analyse terminée. ${totalDuplicates} doublons détectés.`);
    console.log('📋 Fichiers créés: rapport-doublons.txt, backup-doublons.json');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  if (!process.env.DATABASE_URL) {
    console.log('❌ Variable DATABASE_URL non définie');
    process.exit(1);
  }
  analyzeDuplicates();
}