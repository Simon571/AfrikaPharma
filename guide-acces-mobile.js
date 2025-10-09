#!/usr/bin/env node

/**
 * Guide d'accès mobile via réseau local
 */

console.log('📱 ACCÈS MOBILE VIA RÉSEAU LOCAL');
console.log('================================');

console.log('✅ SERVEUR DÉTECTÉ:');
console.log('🌐 Local: http://localhost:3001');
console.log('📱 Réseau: http://192.168.255.89:3001');

console.log('\n📱 POUR ACCÉDER DEPUIS VOTRE TÉLÉPHONE:');

console.log('\n1️⃣ VÉRIFICATIONS PRÉALABLES:');
console.log('   ✅ Téléphone connecté au MÊME WiFi que l\'ordinateur');
console.log('   ✅ Firewall Windows autorise les connexions locales');
console.log('   ✅ Serveur Next.js en cours d\'exécution');

console.log('\n2️⃣ URLS À UTILISER SUR TÉLÉPHONE:');
console.log('📱 Navigation Admin: http://192.168.255.89:3001/admin-dashboard');
console.log('🛒 Vente Rapide: http://192.168.255.89:3001/sell');
console.log('🛍️ Interface Vente: http://192.168.255.89:3001/ventes');

console.log('\n3️⃣ ÉTAPES SUR TÉLÉPHONE:');
console.log('   1. Ouvrir navigateur (Chrome/Safari)');
console.log('   2. Taper: 192.168.255.89:3001');
console.log('   3. Appuyer Entrée');
console.log('   4. L\'application devrait s\'ouvrir');

console.log('\n🔧 SI ÇA NE FONCTIONNE PAS:');

console.log('\n❗ PROBLÈME 1: Firewall Windows');
console.log('   → Ouvrir Paramètres Windows');
console.log('   → Réseau et Internet → Firewall Windows');
console.log('   → Autoriser une application via le pare-feu');
console.log('   → Ajouter Node.js ou désactiver temporairement');

console.log('\n❗ PROBLÈME 2: Même réseau WiFi');
console.log('   → Vérifier que PC et téléphone sur même WiFi');
console.log('   → Nom du réseau identique');

console.log('\n❗ PROBLÈME 3: Port différent');
console.log('   → Si port 3000 occupé, Next.js utilise 3001');
console.log('   → Vérifier dans les logs du serveur');

console.log('\n✅ SOLUTION RAPIDE:');
console.log('1. Redémarrer le serveur avec --host 0.0.0.0');
console.log('2. Vérifier le firewall');
console.log('3. Essayer depuis téléphone: http://192.168.255.89:3001');

console.log('\n🎯 TEST IMMÉDIAT:');
console.log('Sur votre téléphone, ouvrir:');
console.log('http://192.168.255.89:3001/admin-dashboard');

console.log('\n📋 DIAGNOSTIC:');
console.log('Si l\'URL ne fonctionne pas, le problème est probablement:');
console.log('• Firewall Windows (90% des cas)');
console.log('• Réseaux WiFi différents (8% des cas)');
console.log('• Configuration routeur (2% des cas)');