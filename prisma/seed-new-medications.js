#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  
  if (lines.length < 2) return [];

  const headers = [];
  let headerLine = lines[0];
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headers.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  headers.push(current.trim().replace(/^"|"$/g, ''));

  const records = [];
  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const parts = [];
    let inQuotes2 = false;
    let current2 = '';

    for (let i = 0; i < lines[lineIdx].length; i++) {
      const char = lines[lineIdx][i];
      if (char === '"') {
        inQuotes2 = !inQuotes2;
      } else if (char === ',' && !inQuotes2) {
        parts.push(current2.trim().replace(/^"|"$/g, ''));
        current2 = '';
      } else {
        current2 += char;
      }
    }
    parts.push(current2.trim().replace(/^"|"$/g, ''));

    if (parts.length === headers.length) {
      const record = {};
      headers.forEach((h, i) => {
        record[h] = parts[i];
      });
      records.push(record);
    }
  }

  return records;
}

async function main() {
  try {
    console.log('\n🚀 Importation des 2377 médicaments...\n');

    const csvPath = path.join(__dirname, '..', 'Liste_de_500_M_dicaments.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ Fichier CSV non trouvé: ${csvPath}`);
      process.exit(1);
    }

    console.log('📄 Parsing du fichier CSV...');
    const records = await parseCsv(csvPath);
    console.log(`✅ ${records.length} médicaments lus du CSV\n`);

    // Supprimer les médicaments existants
    console.log('🗑️  Suppression des médicaments existants...');
    const deleteResult = await prisma.medication.deleteMany({});
    console.log(`✅ ${deleteResult.count} médicaments supprimés\n`);

    // Importer les nouveaux
    console.log('📥 Importation des nouveaux médicaments...');
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];
        
        let expirationDate = null;
        if (record["Date d'Expiration"] && record["Date d'Expiration"].trim()) {
          const parts = record["Date d'Expiration"].split('/');
          if (parts.length === 2) {
            const month = parseInt(parts[0]);
            const year = parseInt(parts[1]);
            if (month && year) {
              expirationDate = new Date(year, month - 1, 1);
            }
          }
        }

        const purchasePrice = parseInt(record["Prix d'Achat (CDF)"]?.replace(/\D/g, '')) || 0;
        const price = parseFloat(record["Prix de Vente (CDF)"]?.replace(',', '.')) || 0;
        const quantity = parseInt(record['Stock Disponible']?.replace(/\D/g, '')) || 0;

        const medicationData = {
          name: record['Nom du Médicament']?.trim() || `Med ${i}`,
          pharmaceuticalForm: record['Forme']?.trim() || 'Autre',
          purchasePrice: purchasePrice,
          price: price,
          quantity: quantity,
          barcode: uuidv4(),
          isAvailableForSale: false,
        };

        // Ajouter expirationDate seulement s'il a une valeur
        if (expirationDate) {
          medicationData.expirationDate = expirationDate;
        }

        await prisma.medication.create({
          data: medicationData,
        });

        successCount++;

        // Progress every 100 items
        if ((i + 1) % 100 === 0 || i === records.length - 1) {
          console.log(`   ${i + 1}/${records.length} ✓`);
        }
      } catch (error) {
        errorCount++;
        if (errorCount <= 3) {
          console.error(`   Erreur ligne ${i + 1}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Import complété!`);
    console.log(`   Succès: ${successCount}`);
    console.log(`   Erreurs: ${errorCount}\n`);

    // Vérify
    const total = await prisma.medication.count();
    console.log(`📊 Total en base de données: ${total} médicaments`);

    if (total > 0) {
      const samples = await prisma.medication.findMany({
        take: 5,
        orderBy: { name: 'asc' },
        select: { name: true, pharmaceuticalForm: true, price: true, quantity: true }
      });

      console.log('\n📋 Échantillons:');
      samples.forEach((med, idx) => {
        console.log(`   ${idx + 1}. ${med.name} | Forme: ${med.pharmaceuticalForm} | Prix: ${med.price} | Stock: ${med.quantity}`);
      });
    }

    console.log('\n🎉 Mission accomplie!\n');

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
