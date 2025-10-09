// Test complet du système de période d'essai
const userId = 'cmfutd3y10000wecw90yhlc38'; // ID de l'utilisateur de test

async function testTrialSystem() {
  console.log('🧪 Test complet du système de période d\'essai\n');

  // Test 1: Vérification du statut d'essai
  console.log('1️⃣ Test du statut d\'essai...');
  try {
    const statusResponse = await fetch(`http://localhost:3000/api/trial/status/${userId}`);
    const statusData = await statusResponse.json();
    console.log('✅ Statut:', JSON.stringify(statusData, null, 2));
  } catch (error) {
    console.error('❌ Erreur statut:', error.message);
  }

  // Test 2: Vérification d'accès à une fonctionnalité
  console.log('\n2️⃣ Test de vérification d\'accès...');
  try {
    const accessResponse = await fetch('http://localhost:3000/api/trial/check-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        feature: 'inventory-management',
        userId: userId
      })
    });
    const accessData = await accessResponse.json();
    console.log('✅ Accès:', JSON.stringify(accessData, null, 2));
  } catch (error) {
    console.error('❌ Erreur accès:', error.message);
  }

  // Test 3: Extension de période d'essai
  console.log('\n3️⃣ Test d\'extension d\'essai...');
  try {
    const extendResponse = await fetch('http://localhost:3000/api/trial/extend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        extensionDays: 7,
        reason: 'Test d\'extension automatique'
      })
    });
    const extendData = await extendResponse.json();
    console.log('✅ Extension:', JSON.stringify(extendData, null, 2));
  } catch (error) {
    console.error('❌ Erreur extension:', error.message);
  }

  // Test 4: Vérification du statut après extension
  console.log('\n4️⃣ Vérification après extension...');
  try {
    const statusResponse2 = await fetch(`http://localhost:3000/api/trial/status/${userId}`);
    const statusData2 = await statusResponse2.json();
    console.log('✅ Nouveau statut:', JSON.stringify(statusData2, null, 2));
  } catch (error) {
    console.error('❌ Erreur nouveau statut:', error.message);
  }

  console.log('\n🎉 Test complet terminé!');
}

// Lancer les tests
testTrialSystem();

console.log('🚀 Tests en cours d\'exécution...');