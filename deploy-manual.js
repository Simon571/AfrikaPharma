const { execSync } = require('child_process');

console.log('🚀 Script de déploiement manuel Vercel...\n');

function runCommand(command, description) {
  console.log(`📋 ${description}`);
  console.log(`💻 Commande: ${command}\n`);
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${description} - Réussi\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} - Échec`);
    console.error('Erreur:', error.message);
    console.log('');
    return false;
  }
}

async function deploy() {
  console.log('🔧 Démarrage du processus de déploiement...\n');
  
  // Étape 1: Vérifier que tout est commité
  console.log('📝 Vérification de l\'état Git...');
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.log('⚠️ Il y a des changements non commités');
      if (!runCommand('git add . && git commit -m "Deploy: final fixes" && git push origin main', 'Commit et push des derniers changements')) {
        return;
      }
    } else {
      console.log('✅ Tous les changements sont commités\n');
    }
  } catch (error) {
    console.log('❌ Erreur lors de la vérification Git\n');
  }
  
  // Étape 2: Build local pour vérifier
  if (!runCommand('npm run build', 'Build local de vérification')) {
    console.log('❌ Le build local a échoué. Corrigez les erreurs avant de déployer.');
    return;
  }
  
  // Étape 3: Déploiement Vercel
  console.log('🌐 Options de déploiement :\n');
  console.log('1. npx vercel deploy --prod');
  console.log('2. npx vercel link (si pas encore lié)');
  console.log('3. Vérifier les logs Vercel\n');
  
  // Tentative de déploiement
  console.log('🚀 Tentative de déploiement...');
  const deploySuccess = runCommand('npx vercel deploy --prod', 'Déploiement Vercel en production');
  
  if (deploySuccess) {
    console.log('🎉 Déploiement réussi !');
    console.log('🌐 Votre site devrait être disponible dans quelques minutes');
    console.log('📱 Testez sur : https://pajo-pharma.vercel.app/ventes');
  } else {
    console.log('❌ Déploiement échoué');
    console.log('💡 Solutions alternatives :');
    console.log('   1. Vérifier la configuration Vercel');
    console.log('   2. Utiliser le dashboard Vercel web');
    console.log('   3. Essayer une autre plateforme (Netlify, Render)');
  }
}

deploy();