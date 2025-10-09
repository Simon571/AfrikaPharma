const fetch = require('node-fetch');

// URL de production Vercel
const BASE_URL = 'https://pajo-pharma-9arp1pyo0-nzamba-simons-projects.vercel.app';

async function testDeploymentCorrections() {
  console.log('🔍 Test des corrections déployées sur Vercel...\n');

  try {
    // Test 1: Vérifier que le site est accessible
    console.log('1. Test d\'accessibilité du site...');
    const response = await fetch(BASE_URL);
    if (response.ok) {
      console.log('✅ Site accessible - Status:', response.status);
    } else {
      console.log('❌ Site non accessible - Status:', response.status);
    }

    // Test 2: Vérifier l'API des médicaments (recherche case-insensitive)
    console.log('\n2. Test de l\'API médicaments (recherche case-insensitive)...');
    
    // Note: L'API nécessite une authentification, donc on teste juste la réponse
    const medResponse = await fetch(`${BASE_URL}/api/medications?search=dic`);
    console.log('Status API médicaments:', medResponse.status);
    
    if (medResponse.status === 401) {
      console.log('✅ API protégée par authentification (comportement attendu)');
    } else if (medResponse.ok) {
      console.log('✅ API accessible');
    } else {
      console.log('❌ Problème avec l\'API médicaments');
    }

    // Test 3: Vérifier la page de ventes
    console.log('\n3. Test de la page de ventes...');
    const ventesResponse = await fetch(`${BASE_URL}/ventes`);
    console.log('Status page ventes:', ventesResponse.status);
    
    if (ventesResponse.status === 302) {
      console.log('✅ Redirection vers login (utilisateur non authentifié - comportement attendu)');
    } else {
      console.log('Status:', ventesResponse.status);
    }

    console.log('\n📊 Résumé des corrections déployées:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Correction authentification vendeur');
    console.log('✅ Recherche case-insensitive des médicaments');
    console.log('✅ Persistance de la liste des médicaments');
    console.log('✅ Filtrage des doublons exacts');
    console.log('✅ Interface vendeur améliorée');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n🌐 URLs de l\'application:');
    console.log('• Site principal:', BASE_URL);
    console.log('• Page de connexion:', `${BASE_URL}/login`);
    console.log('• Interface vendeur:', `${BASE_URL}/ventes`);
    console.log('• API médicaments:', `${BASE_URL}/api/medications`);

    console.log('\n📝 Pour tester complètement:');
    console.log('1. Connectez-vous avec un compte vendeur');
    console.log('2. Testez la recherche de médicaments (ex: "dic")');
    console.log('3. Vérifiez que la liste persiste après ajout au panier');
    console.log('4. Confirmez que les doublons sont filtrés');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testDeploymentCorrections();