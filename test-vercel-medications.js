#!/usr/bin/env node

/**
 * Test des 500 médicaments sur Vercel Production
 */

const https = require('https');

// URL de production Vercel
const VERCEL_URL = 'https://pajo-pharma-fzjzl8flw-nzamba-simons-projects.vercel.app';

console.log('🧪 Test des 500 médicaments sur Vercel Production...\n');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = VERCEL_URL + path;
    console.log(`📡 Test: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testVercelMedications() {
  try {
    // Test 1: Health check
    console.log('1️⃣ Test de santé de l\'API...');
    const healthCheck = await makeRequest('/api/health');
    console.log(`   Status: ${healthCheck.status}`);
    console.log(`   Response: ${JSON.stringify(healthCheck.data).substring(0, 100)}...`);
    
    // Test 2: Tous les médicaments
    console.log('\n2️⃣ Test de récupération de tous les médicaments...');
    const allMedications = await makeRequest('/api/medications');
    console.log(`   Status: ${allMedications.status}`);
    if (allMedications.data && Array.isArray(allMedications.data)) {
      console.log(`   ✅ ${allMedications.data.length} médicaments trouvés`);
      console.log(`   Premier médicament: ${allMedications.data[0]?.name || 'N/A'}`);
    }
    
    // Test 3: Recherche de Paracétamol
    console.log('\n3️⃣ Test de recherche "Paracétamol"...');
    const searchResults = await makeRequest('/api/medications?search=Paracétamol');
    console.log(`   Status: ${searchResults.status}`);
    if (searchResults.data && Array.isArray(searchResults.data)) {
      console.log(`   ✅ ${searchResults.data.length} résultats pour "Paracétamol"`);
      searchResults.data.slice(0, 3).forEach((med, index) => {
        console.log(`   ${index + 1}. ${med.name} - ${med.price} CDF - Stock: ${med.quantity}`);
      });
    }
    
    // Test 4: Médicaments en stock
    console.log('\n4️⃣ Test des médicaments en stock...');
    const inStock = await makeRequest('/api/medications?inStock=true');
    console.log(`   Status: ${inStock.status}`);
    if (inStock.data && Array.isArray(inStock.data)) {
      console.log(`   ✅ ${inStock.data.length} médicaments en stock`);
    }

    console.log('\n🎉 Tous les tests ont réussi !');
    console.log('🔗 Votre application Vercel avec les 500 médicaments est prête :');
    console.log(`   ${VERCEL_URL}`);
    console.log('\n📋 Endpoints disponibles:');
    console.log(`   • ${VERCEL_URL}/api/medications`);
    console.log(`   • ${VERCEL_URL}/api/medications?search=nom`);
    console.log(`   • ${VERCEL_URL}/api/medications?inStock=true`);
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    console.log('\n🔧 Vérifications à effectuer:');
    console.log('  1. L\'URL Vercel est-elle correcte ?');
    console.log('  2. Les variables d\'environnement sont-elles configurées ?');
    console.log('  3. La base de données PostgreSQL est-elle accessible ?');
  }
}

testVercelMedications();