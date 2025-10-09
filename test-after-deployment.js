#!/usr/bin/env node

/**
 * Test complet après déploiement Vercel
 * Vérifie que l'authentification fonctionne
 */

const fetch = require('node-fetch');

async function testAfterDeployment() {
  // Configuration
const VERCEL_URL = 'https://pajo-pharma-k1e46allx-nzamba-simons-projects.vercel.app';
  
  console.log('🚀 Test complet après déploiement Vercel\n');
  console.log(`📡 URL: ${VERCEL_URL}\n`);

  const tests = [
    {
      name: '1. Health Check API',
      url: `${VERCEL_URL}/api/health`,
      expectJson: true,
      description: 'Doit retourner JSON avec status "healthy"'
    },
    {
      name: '2. Setup Users API',
      url: `${VERCEL_URL}/api/setup-users`,
      expectJson: true,
      description: 'Doit créer/vérifier les utilisateurs'
    },
    {
      name: '3. Test Login API',
      url: `${VERCEL_URL}/api/test-login`,
      method: 'POST',
      body: { username: 'admin', password: 'admin123', role: 'admin' },
      expectJson: true,
      description: 'Doit valider les identifiants admin'
    },
    {
      name: '4. Page Login Admin',
      url: `${VERCEL_URL}/login-admin`,
      expectJson: false,
      description: 'Doit afficher la page de connexion admin'
    }
  ];

  let successCount = 0;
  
  for (const test of tests) {
    console.log(`🧪 ${test.name}`);
    console.log(`   ${test.description}`);
    
    try {
      const options = {
        method: test.method || 'GET',
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }
      
      const response = await fetch(test.url, options);
      const contentType = response.headers.get('content-type');
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${contentType}`);
      
      if (test.expectJson) {
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`   ✅ JSON reçu:`, JSON.stringify(data, null, 2));
          successCount++;
        } else {
          const text = await response.text();
          console.log(`   ❌ HTML reçu au lieu de JSON: ${text.substring(0, 100)}...`);
        }
      } else {
        if (response.status === 200) {
          console.log(`   ✅ Page chargée correctement`);
          successCount++;
        } else {
          console.log(`   ❌ Erreur ${response.status}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('📊 Résultats:');
  console.log(`   ${successCount}/${tests.length} tests réussis`);
  
  if (successCount === tests.length) {
    console.log('🎉 L\'application fonctionne parfaitement !');
    console.log('');
    console.log('🔑 Identifiants de connexion:');
    console.log('   Admin: admin / admin123');
    console.log('   Vendeur: vendeur / vendeur123');
  } else {
    console.log('⚠️  Certains tests ont échoué.');
    console.log('💡 Vérifiez que DATABASE_URL est bien configurée sur Vercel');
  }
}

testAfterDeployment().catch(console.error);