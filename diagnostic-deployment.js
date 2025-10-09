// Test de diagnostic complet du déploiement
const https = require('https');

const BASE_URL = 'https://pajo-pharma-d2rpa5ffs-nzamba-simons-projects.vercel.app';

async function diagnosticTest() {
  console.log('🔍 Diagnostic complet du déploiement');
  console.log(`📡 URL: ${BASE_URL}`);
  console.log('');

  // 1. Test de la page d'accueil avec headers détaillés
  console.log('🧪 1. Test détaillé de la page d\'accueil');
  try {
    const response = await fetch(`${BASE_URL}/`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.status === 401) {
      const text = await response.text();
      console.log(`   Body preview: ${text.substring(0, 200)}...`);
    } else if (response.status === 200) {
      console.log('   ✅ Page d\'accueil accessible');
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
  }

  // 2. Test direct de l'API health sans auth
  console.log('🧪 2. Test API health check');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.status === 200) {
      try {
        const data = await response.json();
        console.log('   ✅ API health check OK');
        console.log(`   Data: ${JSON.stringify(data)}`);
      } catch (e) {
        const text = await response.text();
        console.log(`   Response text: ${text.substring(0, 200)}`);
      }
    } else {
      const text = await response.text();
      console.log(`   Body preview: ${text.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
  }

  // 3. Test de l'API setup-users
  console.log('🧪 3. Test API setup-users');
  try {
    const response = await fetch(`${BASE_URL}/api/setup-users`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.status === 200) {
      try {
        const data = await response.json();
        console.log('   ✅ API setup-users OK');
        console.log(`   Data: ${JSON.stringify(data)}`);
      } catch (e) {
        const text = await response.text();
        console.log(`   Response text: ${text.substring(0, 200)}`);
      }
    } else {
      const text = await response.text();
      console.log(`   Body preview: ${text.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
  }

  // 4. Test de page de login
  console.log('🧪 4. Test page login admin');
  try {
    const response = await fetch(`${BASE_URL}/login-admin`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.status === 200) {
      console.log('   ✅ Page login admin accessible');
    } else {
      const text = await response.text();
      console.log(`   Body preview: ${text.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
  }

  console.log('');
  console.log('📊 Diagnostic terminé');
}

diagnosticTest().catch(console.error);