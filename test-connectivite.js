console.log('🔍 TEST DE CONNECTIVITÉ SERVEUR');
console.log('================================');

const http = require('http');

const testUrl = (url, callback) => {
  console.log(`🌐 Test de ${url}...`);
  
  const req = http.get(url, (res) => {
    console.log(`✅ Statut: ${res.statusCode}`);
    console.log(`📋 Headers: ${JSON.stringify(res.headers, null, 2)}`);
    callback(null, res.statusCode);
  });

  req.on('error', (err) => {
    console.log(`❌ Erreur: ${err.message}`);
    callback(err);
  });

  req.setTimeout(5000, () => {
    console.log('⏰ Timeout - le serveur ne répond pas');
    req.destroy();
    callback(new Error('Timeout'));
  });
};

// Test de l'accès au serveur
testUrl('http://localhost:3002', (err, status) => {
  if (err) {
    console.log('\n🚨 PROBLÈME DÉTECTÉ:');
    console.log('- Le serveur Next.js ne répond pas sur localhost:3002');
    console.log('- Vérifiez que le serveur est bien démarré');
    console.log('- Essayez de redémarrer avec: npm run dev');
  } else {
    console.log('\n🎉 SERVEUR ACCESSIBLE !');
    console.log('- Vous pouvez maintenant accéder à:');
    console.log('  📱 http://localhost:3002/ventes');
    
    // Test spécifique de la page ventes
    testUrl('http://localhost:3002/ventes', (err2, status2) => {
      if (!err2) {
        console.log('\n✅ PAGE VENTES MOBILE ACCESSIBLE !');
        console.log('🎯 Testez maintenant l\'interface mobile optimisée');
      }
    });
  }
});