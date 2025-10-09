const https = require('https');

console.log('🔍 Test avec domaines Vercel alternatives...\n');

const domains = [
  'https://pajo-pharma.vercel.app',
  'https://pajo-pharma-simon571s-projects.vercel.app',
  'https://pajo-pharma-git-main-simon571s-projects.vercel.app'
];

function testDomain(url) {
  return new Promise((resolve) => {
    const request = https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve({
          url: url,
          statusCode: response.statusCode,
          success: response.statusCode === 200,
          hasVentesPage: data.includes('Interface de Vente'),
          hasTable: data.includes('TableHeader') || data.includes('table'),
          size: data.length
        });
      });
    });
    
    request.on('error', () => {
      resolve({
        url: url,
        statusCode: 'ERROR',
        success: false,
        error: true
      });
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      resolve({
        url: url,
        statusCode: 'TIMEOUT',
        success: false,
        timeout: true
      });
    });
  });
}

async function testAllDomains() {
  console.log('🌐 Test de tous les domaines Vercel possibles...\n');
  
  for (const domain of domains) {
    console.log(`📍 Test: ${domain}`);
    
    // Test page d'accueil
    const homeResult = await testDomain(domain);
    console.log(`   Home: ${homeResult.statusCode} ${homeResult.success ? '✅' : '❌'}`);
    
    // Test page ventes
    const ventesResult = await testDomain(domain + '/ventes');
    console.log(`   Ventes: ${ventesResult.statusCode} ${ventesResult.success ? '✅' : '❌'}`);
    
    if (ventesResult.success) {
      console.log(`   📄 Taille: ${ventesResult.size} bytes`);
      console.log(`   🏷️ Interface de Vente: ${ventesResult.hasVentesPage ? '✅' : '❌'}`);
      console.log(`   📊 Format tableau: ${ventesResult.hasTable ? '✅' : '❌'}`);
    }
    
    console.log('');
  }
  
  console.log('💡 Si aucun domaine ne fonctionne, le problème peut être :');
  console.log('   - Déploiement en cours');
  console.log('   - Problème de build');
  console.log('   - Configuration Vercel incorrecte');
  console.log('   - Domaine personnalisé nécessaire');
}

testAllDomains();