const { execSync } = require('child_process');

console.log('Deploiement force vers Vercel...\n');

try {
  console.log('Creation d\'un commit pour forcer le redeploiement...');
  
  // Créer un petit changement pour forcer le redéploiement
  const timestamp = new Date().toISOString();
  execSync(`echo "Deploy timestamp: ${timestamp}" >> public/deploy.log`, { stdio: 'inherit' });
  
  console.log('Ajout et commit des changements...');
  execSync('git add .', { stdio: 'inherit' });
  execSync(`git commit -m "Force redeploy: ${timestamp}"`, { stdio: 'inherit' });
  
  console.log('Push vers main pour declencher le deploiement...');
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('\nDeploiement lance !');
  console.log('Attendez 2-3 minutes pour que Vercel redeploie automatiquement');
  console.log('Votre site sera disponible sur: https://pajo-pharma.vercel.app/ventes');
  console.log('N\'oubliez pas de vider le cache du navigateur si necessaire');
  
} catch (error) {
  console.error('Erreur lors du deploiement:', error.message);
}