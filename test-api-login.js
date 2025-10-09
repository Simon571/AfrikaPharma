async function testLogin() {
  try {
    const response = await fetch('https://pajo-pharma-dh6actuvm-nzamba-simons-projects.vercel.app/api/test-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      })
    });

    const data = await response.json();
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✅ Connexion réussie !');
    } else {
      console.log('❌ Échec de connexion:', data.error);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testLogin();