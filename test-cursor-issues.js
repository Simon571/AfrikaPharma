// Test pour vérifier les problèmes de curseur sur la page ventes

console.log('🔍 Test des problèmes de curseur sur la page ventes...\n');

// Test local d'abord
const localUrl = 'http://localhost:3002/ventes';

console.log('🖱️ Vérification des styles de curseur...');
console.log('👆 Les problèmes de curseur peuvent être dus à :');
console.log('   1. CSS cursor manquant sur les boutons');
console.log('   2. Disabled state qui change le curseur');
console.log('   3. Overlay invisible qui bloque les clics');
console.log('   4. Z-index conflicts');

console.log('\n🔧 Solutions recommandées :');
console.log('   - Ajouter cursor-pointer aux boutons');
console.log('   - Vérifier les states disabled');
console.log('   - Vérifier les overlays invisibles');
console.log('   - Tester sur mobile et desktop');

console.log('\n📱 Test local disponible sur:', localUrl);
console.log('🌐 Une fois déployé, tester sur: https://pajo-pharma.vercel.app/ventes');

// Recommandations spécifiques pour la page ventes
console.log('\n🎯 Points à vérifier spécifiquement :');
console.log('   ✓ Boutons "+" dans le tableau');
console.log('   ✓ Boutons de quantité dans le panier');
console.log('   ✓ Boutons de navigation mobile');
console.log('   ✓ Champs de recherche');
console.log('   ✓ Scanner de code-barres');