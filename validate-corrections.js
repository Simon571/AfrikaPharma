#!/usr/bin/env node

/**
 * Script de validation des corrections locales
 * Vérifie que toutes les corrections sont prêtes pour Vercel
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validation des corrections pour Vercel\n');

const checks = [
  {
    name: 'Schema Prisma PostgreSQL',
    check: () => {
      const schema = fs.readFileSync('./prisma/schema.prisma', 'utf8');
      return schema.includes('provider = "postgresql"') && schema.includes('env("DATABASE_URL")');
    }
  },
  {
    name: 'Middleware corrigé',
    check: () => {
      const middleware = fs.readFileSync('./middleware.ts', 'utf8');
      return middleware.includes("path.startsWith('/api/')");
    }
  },
  {
    name: 'Variables d\'environnement locales',
    check: () => {
      return fs.existsSync('./.env.local');
    }
  },
  {
    name: 'Guide de déploiement créé',
    check: () => {
      return fs.existsSync('./VERCEL-SETUP-GUIDE.md');
    }
  },
  {
    name: 'Package.json build script',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      return pkg.scripts.build.includes('prisma generate');
    }
  },
  {
    name: 'Script de vérification Vercel',
    check: () => {
      return fs.existsSync('./check-vercel-status.js');
    }
  }
];

let allPassed = true;

checks.forEach(({ name, check }) => {
  try {
    const passed = check();
    console.log(passed ? `✅ ${name}` : `❌ ${name}`);
    if (!passed) allPassed = false;
  } catch (error) {
    console.log(`❌ ${name} - Erreur: ${error.message}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 Toutes les corrections sont appliquées !');
  console.log('');
  console.log('📋 Étapes suivantes pour Vercel:');
  console.log('');
  console.log('1. 🗃️  Créer une base PostgreSQL gratuite:');
  console.log('   • Neon.tech ou Supabase.com');
  console.log('   • Copier l\'URL de connexion');
  console.log('');
  console.log('2. ⚙️  Configurer les variables sur Vercel:');
  console.log('   • DATABASE_URL=postgresql://...');
  console.log('   • NEXTAUTH_SECRET=secret-32-chars-minimum');
  console.log('   • NEXTAUTH_URL=https://votre-domaine.vercel.app');
  console.log('   • NODE_ENV=production');
  console.log('');
  console.log('3. 🚀 Redéployer l\'application sur Vercel');
  console.log('');
  console.log('4. 🧪 Tester avec: node check-vercel-status.js');
  console.log('');
  console.log('📖 Guide complet: ./VERCEL-SETUP-GUIDE.md');
  
} else {
  console.log('❌ Certaines corrections sont manquantes');
  console.log('Veuillez corriger les problèmes ci-dessus avant de déployer');
}

console.log('\n' + '='.repeat(50));