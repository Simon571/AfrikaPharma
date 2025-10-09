async function testProductionAuth() {
  const baseUrl = 'https://pajo-pharma-e1iqedbmz-nzamba-simons-projects.vercel.app';
  
  console.log('🔍 Test de l\'authentification en production...\n');

  // Test 1: Vérifier si les utilisateurs existent
  console.log('1. Test de setup des utilisateurs...');
  try {
    const setupResponse = await fetch(`${baseUrl}/api/setup-users`);
    const setupData = await setupResponse.json();
    console.log('✅ Setup response:', setupData);
  } catch (error) {
    console.log('❌ Erreur setup:', error.message);
  }

  // Test 2: Test direct de l'API de connexion
  console.log('\n2. Test API de connexion...');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/setup-users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      })
    });
    const loginData = await loginResponse.json();
    console.log('✅ Login response:', loginData);
  } catch (error) {
    console.log('❌ Erreur login:', error.message);
  }

  // Test 3: Test NextAuth
  console.log('\n3. Test NextAuth signin...');
  try {
    const authResponse = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      })
    });
    console.log('Status NextAuth:', authResponse.status);
    const authText = await authResponse.text();
    console.log('NextAuth response:', authText.substring(0, 200));
  } catch (error) {
    console.log('❌ Erreur NextAuth:', error.message);
  }

  // Test 4: Vérifier la configuration NextAuth
  console.log('\n4. Test configuration NextAuth...');
  try {
    const configResponse = await fetch(`${baseUrl}/api/auth/providers`);
    const configData = await configResponse.json();
    console.log('✅ Providers:', configData);
  } catch (error) {
    console.log('❌ Erreur config:', error.message);
  }
}

testProductionAuth();