#!/usr/bin/env node

/**
 * Script de déploiement Vercel avec migration de la base de données
 * Ce script s'assure que les 500 médicaments sont importés sur Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Déploiement Vercel avec les 500 médicaments...\n');

async function deployToVercel() {
  try {
    // 1. Vérifier que le fichier CSV existe
    if (!fs.existsSync('./Liste_de_500_M_dicaments.csv')) {
      throw new Error('Le fichier Liste_de_500_M_dicaments.csv est introuvable');
    }
    console.log('✅ Fichier CSV des médicaments trouvé');

    // 2. Vérifier que le script de seed existe
    if (!fs.existsSync('./prisma/seed-medications.js')) {
      throw new Error('Le script de seed des médicaments est introuvable');
    }
    console.log('✅ Script de seed des médicaments trouvé');

    // 3. Construire le projet
    console.log('\n📦 Construction du projet...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Projet construit avec succès');

    // 4. Déployer sur Vercel
    console.log('\n☁️  Déploiement sur Vercel...');
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ Déploiement Vercel terminé');

    // 5. Migrer la base de données de production
    console.log('\n🗄️  Migration de la base de données de production...');
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    console.log('✅ Migration de la base de données terminée');

    // 6. Importer les médicaments en production
    console.log('\n💊 Importation des 500 médicaments en production...');
    execSync('node prisma/seed-medications.js', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    console.log('✅ 500 médicaments importés en production');

    console.log('\n🎉 Déploiement complet réussi !');
    console.log('📋 Résumé:');
    console.log('  - Projet déployé sur Vercel');
    console.log('  - Base de données migrée');
    console.log('  - 500 médicaments importés');
    console.log('  - API /api/medications disponible');
    
  } catch (error) {
    console.error('\n❌ Erreur pendant le déploiement:', error.message);
    console.log('\n🔧 Actions à effectuer manuellement:');
    console.log('  1. Vérifier la configuration de la base de données');
    console.log('  2. Exécuter: npm run build');
    console.log('  3. Exécuter: vercel --prod');
    console.log('  4. Exécuter: npx prisma db push');
    console.log('  5. Exécuter: node prisma/seed-medications.js');
    process.exit(1);
  }
}

// Afficher les informations sur l'utilisation
console.log('📖 Informations sur les médicaments:');
console.log('  - 500 médicaments avec noms, prix, stocks, dates d\'expiration');
console.log('  - 7 formes pharmaceutiques: Comprimé, Sirop, Gélule, etc.');
console.log('  - API complète pour recherche et gestion');
console.log('  - Endpoints disponibles:');
console.log('    • GET /api/medications - Liste tous les médicaments');
console.log('    • GET /api/medications?search=terme - Recherche');
console.log('    • GET /api/medications?inStock=true - Médicaments en stock');
console.log('    • POST /api/medications - Ajouter un médicament');
console.log('');

deployToVercel();