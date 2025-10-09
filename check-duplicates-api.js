// Test via l'API pour vérifier les doublons
console.log('🔍 Vérification des doublons via l\'API...');

async function checkDuplicatesViaAPI() {
  try {
    // Simuler un appel API comme dans Node.js avec node-fetch
    const { default: fetch } = await import('node-fetch');
    
    console.log('📡 Récupération de tous les médicaments...');
    const response = await fetch('http://localhost:3002/api/medications?inStock=true');
    
    if (!response.ok) {
      console.log(`❌ Erreur HTTP: ${response.status}`);
      return;
    }
    
    const medications = await response.json();
    console.log(`📊 Total récupéré: ${medications.length} médicaments`);

    // Analyser les doublons par nom
    const nameCount = {};
    medications.forEach(med => {
      const name = med.name.trim();
      if (nameCount[name]) {
        nameCount[name].push(med);
      } else {
        nameCount[name] = [med];
      }
    });

    const duplicates = Object.entries(nameCount).filter(([_, meds]) => meds.length > 1);
    
    console.log(`\n🔍 Médicaments dupliqués trouvés: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('\n📋 Liste des doublons:');
      duplicates.slice(0, 15).forEach(([name, meds], index) => {
        console.log(`\n${index + 1}. "${name}" (${meds.length} fois):`);
        meds.forEach((med, i) => {
          console.log(`   ${i + 1}. ID: ...${med.id.slice(-8)} | Prix: ${med.price}€ | Stock: ${med.quantity}`);
        });
      });

      // Statistiques
      const totalDuplicates = duplicates.reduce((sum, [_, meds]) => sum + meds.length, 0);
      console.log(`\n📊 Statistiques:`);
      console.log(`   - Noms uniques avec doublons: ${duplicates.length}`);
      console.log(`   - Total d'entrées dupliquées: ${totalDuplicates}`);
      console.log(`   - Entrées à supprimer: ${totalDuplicates - duplicates.length}`);
    }

    // Échantillon de la liste
    console.log('\n📋 Échantillon des 20 premiers médicaments:');
    medications.slice(0, 20).forEach((med, index) => {
      console.log(`   ${index + 1}. ${med.name} | ${med.price}€ | Stock: ${med.quantity}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n⚠️ Si node-fetch n\'est pas installé, installez-le avec:');
    console.log('npm install node-fetch');
  }
}

checkDuplicatesViaAPI();