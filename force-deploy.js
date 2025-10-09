const { execSync } = require('child_process');

console.log('🚀 Déploiement forcé vers Vercel...\n');

try {
  console.log('📝 Création d'un commit pour forcer le redéploiement...');
  
  // Créer un petit changement pour forcer le redéploiement
  const timestamp = new Date().toISOString();
  execSync(`echo "/* Deploy timestamp: ${timestamp} */" >> public/deploy.log`, { stdio: 'inherit' });
  
  console.log('📤 Ajout et commit des changements...');
  execSync('git add .', { stdio: 'inherit' });
  execSync(`git commit -m "Force redeploy: ${timestamp}"`, { stdio: 'inherit' });
  
  console.log('🚀 Push vers main pour déclencher le déploiement...');
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('\n✅ Déploiement lancé !');
  console.log('🕐 Attendez 2-3 minutes pour que Vercel redéploie automatiquement');
  console.log('🌐 Votre site sera disponible sur: https://pajo-pharma.vercel.app/ventes');
  console.log('📱 N\'oubliez pas de vider le cache du navigateur (Ctrl+F5) si nécessaire');
  
} catch (error) {
  console.error('❌ Erreur lors du déploiement:', error.message);
}