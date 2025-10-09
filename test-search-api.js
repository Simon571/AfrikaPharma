// Test simple pour identifier le problème de recherche
console.log('🔍 Test de l\'API de recherche...');

async function testSearchAPI() {
  try {
    // Test 1: Récupérer tous les médicaments disponibles
    console.log('\n1. Test: Tous les médicaments disponibles');
    const allResponse = await fetch('http://localhost:3002/api/medications?inStock=true');
    
    if (!allResponse.ok) {
      console.log(`❌ Erreur HTTP: ${allResponse.status}`);
      return;
    }
    
    const allMeds = await allResponse.json();
    console.log(`✅ Total des médicaments en stock: ${allMeds.length}`);
    
    // Chercher manuellement ceux qui contiennent "dic"
    const dicMeds = allMeds.filter(med => 
      med.name.toLowerCase().includes('dic')
    );
    console.log(`📊 Médicaments contenant "dic" (côté client): ${dicMeds.length}`);
    dicMeds.slice(0, 10).forEach(med => {
      console.log(`   - ${med.name} (stock: ${med.quantity})`);
    });

    // Test 2: Recherche via API avec "Dic"
    console.log('\n2. Test: Recherche API avec "Dic"');
    const searchResponse = await fetch('http://localhost:3002/api/medications?inStock=true&search=Dic');
    
    if (!searchResponse.ok) {
      console.log(`❌ Erreur HTTP: ${searchResponse.status}`);
      return;
    }
    
    const searchResults = await searchResponse.json();
    console.log(`📊 Résultats de recherche API "Dic": ${searchResults.length}`);
    searchResults.slice(0, 10).forEach(med => {
      console.log(`   - ${med.name} (stock: ${med.quantity})`);
    });

    // Test 3: Recherche avec "dic" en minuscules
    console.log('\n3. Test: Recherche API avec "dic"');
    const searchResponse2 = await fetch('http://localhost:3002/api/medications?inStock=true&search=dic');
    
    if (!searchResponse2.ok) {
      console.log(`❌ Erreur HTTP: ${searchResponse2.status}`);
      return;
    }
    
    const searchResults2 = await searchResponse2.json();
    console.log(`📊 Résultats de recherche API "dic": ${searchResults2.length}`);
    searchResults2.slice(0, 10).forEach(med => {
      console.log(`   - ${med.name} (stock: ${med.quantity})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testSearchAPI();