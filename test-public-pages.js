const fetch = require('node-fetch');

const BASE_URL = 'https://pajo-pharma-9arp1pyo0-nzamba-simons-projects.vercel.app';

async function testPublicPages() {
  console.log('🔍 Test des pages publiques...\n');

  try {
    // Test de la page de login
    console.log('Test page de login...');
    const loginResponse = await fetch(`${BASE_URL}/login`);
    console.log('Status page login:', loginResponse.status);
    
    if (loginResponse.ok) {
      console.log('✅ Page de login accessible');
    }

    // Test de la page d'accueil
    console.log('\nTest page d\'accueil...');
    const homeResponse = await fetch(`${BASE_URL}/`);
    console.log('Status page d\'accueil:', homeResponse.status);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testPublicPages();