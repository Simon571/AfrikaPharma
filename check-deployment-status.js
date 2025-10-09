const https = require('https');

console.log('🔍 Vérification du statut de déploiement...\n');

// Fonction pour faire une requête HTTP
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          data: data
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function checkDeployment() {
  try {
    console.log('📡 Test de connexion au site en production...');
    
    // URLs à tester
    const urls = [
      'https://pajo-pharma.vercel.app',
      'https://pajo-pharma.vercel.app/ventes',
      'https://pajo-pharma.vercel.app/api/health'
    ];
    
    for (const url of urls) {
      try {
        console.log(`\n🌐 Test: ${url}`);
        const response = await makeRequest(url);
        
        console.log(`✅ Status: ${response.statusCode}`);
        if (response.headers['x-vercel-id']) {
          console.log(`🔧 Vercel ID: ${response.headers['x-vercel-id']}`);
        }
        if (response.headers['x-vercel-cache']) {
          console.log(`💾 Cache: ${response.headers['x-vercel-cache']}`);
        }
        
        // Vérifier si c'est la page ventes
        if (url.includes('/ventes')) {
          if (response.data.includes('Interface de Vente')) {
            console.log('✅ Page ventes chargée correctement');
          }
          if (response.data.includes('TableHeader')) {
            console.log('✅ Format tableau détecté');
          } else {
            console.log('⚠️ Format tableau non détecté - possiblement encore en format cartes');
          }
        }
        
      } catch (error) {
        console.log(`❌ Erreur: ${error.message}`);
      }
    }
    
    console.log('\n🕐 Attendre quelques minutes pour que le déploiement se propage...');
    console.log('📱 Si le problème persiste, vider le cache du navigateur (Ctrl+F5)');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkDeployment();