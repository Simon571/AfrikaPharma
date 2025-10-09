// Test simple d'une API route
const fetch = require('node-fetch');

const VERCEL_URL = 'https://pajo-pharma-k1e46allx-nzamba-simons-projects.vercel.app';

async function testSimpleAPI() {
  console.log('🧪 Test simple API\n');
  
  try {
    console.log('Test: /api/health');
    const response = await fetch(`${VERCEL_URL}/api/health`);
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, response.headers.raw());
    
    const text = await response.text();
    console.log('Response (first 200 chars):', text.substring(0, 200));
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testSimpleAPI();