// Test de la dernière version déployée
const https = require('https');

const BASE_URL = 'https://pajo-pharma-p3ro6wom3-nzamba-simons-projects.vercel.app';

async function testDeployment() {
  console.log('🚀 Test de la dernière version déployée');
  console.log(`📡 URL: ${BASE_URL}`);
  console.log('');

  // 1. Test de la page d'accueil
  console.log('🧪 1. Test de la page d\'accueil');
  try {
    const response = await fetch(`${BASE_URL}/`);
    console.log(`   Status: ${response.status}`);
    if (response.status === 200) {
      console.log('   ✅ Page d\'accueil accessible');
    } else {
      console.log('   ❌ Problème d\'accès à la page d\'accueil');
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
  }

  // 2. Test de la page de connexion admin
  console.log('🧪 2. Test de la page de connexion admin');
  try {
    const response = await fetch(`${BASE_URL}/admin/login`);
    console.log(`   Status: ${response.status}`);
    if (response.status === 200) {
      console.log('   ✅ Page de connexion admin accessible');
    } else {
      console.log('   ❌ Problème d\'accès à la page de connexion admin');
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
  }

  // 3. Test de l'API health check
  console.log('🧪 3. Test de l\'API health check');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    console.log(`   Status: ${response.status}`);
    if (response.status === 200) {
      const data = await response.json();
      console.log('   ✅ API health check OK');
      console.log(`   Data: ${JSON.stringify(data)}`);
    } else {
      console.log('   ❌ Problème avec l\'API health check');
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
  }

  console.log('');
  console.log('📊 Test terminé');
}

testDeployment().catch(console.error);