#!/usr/bin/env node

/**
 * Script pour configurer correctement DATABASE_URL sur Vercel
 */

const { execSync } = require('child_process');

const DATABASE_URL = 'postgresql://neondb_owner:npg_pnTUlE2r7ecG@ep-polished-glade-aghxcb05-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

console.log('🔧 Configuration de DATABASE_URL sur Vercel...\n');

try {
  // Supprimer l'ancienne variable (forcer avec yes)
  console.log('1. Suppression de l\'ancienne variable DATABASE_URL...');
  try {
    execSync('echo "y" | vercel env rm DATABASE_URL production', { 
      stdio: 'pipe',
      input: 'y\n'
    });
    console.log('   ✅ Ancienne variable supprimée');
  } catch (error) {
    console.log('   ⚠️ Variable pas trouvée ou déjà supprimée');
  }

  // Ajouter la nouvelle variable
  console.log('\n2. Ajout de la nouvelle DATABASE_URL...');
  execSync(`vercel env add DATABASE_URL production`, {
    input: DATABASE_URL + '\n',
    stdio: 'pipe'
  });
  console.log('   ✅ Nouvelle variable ajoutée');

  // Redéployer
  console.log('\n3. Redéploiement automatique...');
  execSync('vercel --prod', { stdio: 'inherit' });

} catch (error) {
  console.error('❌ Erreur:', error.message);
  console.log('\n📋 Configuration manuelle requise:');
  console.log('\n1. Aller sur https://vercel.com/dashboard');
  console.log('2. Sélectionner le projet pajo-pharma');
  console.log('3. Settings → Environment Variables');
  console.log('4. Supprimer DATABASE_URL existante');
  console.log('5. Ajouter nouvelle DATABASE_URL:');
  console.log(`   ${DATABASE_URL}`);
  console.log('6. Redéployer');
}