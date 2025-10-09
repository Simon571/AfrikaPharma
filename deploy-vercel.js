#!/usr/bin/env node

/**
 * Script de déploiement automatique Vercel
 * Configure les variables d'environnement et redéploie
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Configuration automatique Vercel - PAJO PHARMA\n');

// Variables d'environnement à configurer sur Vercel
const envVars = {
  'DATABASE_URL': 'postgresql://neondb_owner:npg_pnTUlE2r7ecG@ep-polished-glade-aghxcb05-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  'NEXTAUTH_SECRET': 'dtG+7HPdAGYXoAXFnMLAMqZ+cmsXDotr8hILbU60z0c=',
  'NEXTAUTH_URL': 'https://pajo-pharma-e1iqedbmz-nzamba-simons-projects.vercel.app',
  'NODE_ENV': 'production'
};

async function deployToVercel() {
  try {
    console.log('📋 Variables à configurer sur Vercel:');
    Object.entries(envVars).forEach(([key, value]) => {
      const maskedValue = key.includes('SECRET') || key.includes('URL') && key !== 'NEXTAUTH_URL' 
        ? value.substring(0, 20) + '...' 
        : value;
      console.log(`   ${key}=${maskedValue}`);
    });
    
    console.log('\n🔍 Vérification de Vercel CLI...');
    
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      console.log('✅ Vercel CLI disponible');
      
      // Configurer les variables d'environnement
      console.log('\n⚙️ Configuration des variables d\'environnement...');
      
      for (const [key, value] of Object.entries(envVars)) {
        try {
          console.log(`   Ajout de ${key}...`);
          execSync(`vercel env add ${key} production`, {
            input: value,
            stdio: 'pipe'
          });
          console.log(`   ✅ ${key} configuré`);
        } catch (error) {
          console.log(`   ⚠️ ${key} déjà configuré ou erreur`);
        }
      }
      
      console.log('\n🚀 Déploiement sur Vercel...');
      execSync('vercel --prod', { stdio: 'inherit' });
      
      console.log('\n🧪 Test post-déploiement...');
      setTimeout(() => {
        execSync('node check-vercel-status.js', { stdio: 'inherit' });
      }, 30000); // Attendre 30 secondes
      
    } catch (error) {
      console.log('❌ Vercel CLI non installé ou non connecté');
      console.log('\n📋 Configuration manuelle requise:');
      console.log('\n1. Installer Vercel CLI:');
      console.log('   npm i -g vercel');
      console.log('\n2. Se connecter:');
      console.log('   vercel login');
      console.log('\n3. Configurer les variables sur https://vercel.com/dashboard');
      console.log('\n4. Ou utiliser les commandes:');
      Object.entries(envVars).forEach(([key, value]) => {
        console.log(`   vercel env add ${key} production`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n📖 Consultez VERCEL-SETUP-GUIDE.md pour la configuration manuelle');
  }
}

// Créer un fichier .env.production pour référence
const envContent = Object.entries(envVars)
  .map(([key, value]) => `${key}="${value}"`)
  .join('\n');

fs.writeFileSync('.env.production', envContent);
console.log('📝 Fichier .env.production créé pour référence\n');

deployToVercel();