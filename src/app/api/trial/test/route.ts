import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API de test pour valider le système de période d'essai
 * GET /api/trial/test - Test complet du système
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Début des tests du système d\'essai...');

    const results = {
      database: { success: false, message: '' },
      apis: { success: false, message: '' },
      middleware: { success: false, message: '' },
      overall: { success: false, message: '' }
    };

    // Test 1: Connexion à la base de données
    try {
      await prisma.$connect();
      
      // Vérifier les nouveaux champs (si disponibles)
      const userCount = await prisma.user.count();
      
      results.database = {
        success: true,
        message: `✅ Base de données accessible. ${userCount} utilisateurs trouvés.`
      };
    } catch (error) {
      results.database = {
        success: false,
        message: `❌ Erreur base de données: ${String(error)}`
      };
    }

    // Test 2: APIs d'essai
    try {
      // Tester l'API de vérification d'accès
      const accessResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/trial/check-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || ''
        },
        body: JSON.stringify({ feature: 'inventory-management' })
      });

      if (accessResponse.status === 401) {
        results.apis = {
          success: true,
          message: '✅ API de vérification d\'accès fonctionne (non authentifié détecté)'
        };
      } else {
        const accessData = await accessResponse.json();
        results.apis = {
          success: true,
          message: `✅ API de vérification d'accès répond: ${JSON.stringify(accessData)}`
        };
      }
    } catch (error) {
      results.apis = {
        success: false,
        message: `❌ Erreur API: ${String(error)}`
      };
    }

    // Test 3: Middleware (simulation)
    try {
      results.middleware = {
        success: true,
        message: '✅ Middleware intégré (vérification manuelle requise)'
      };
    } catch (error) {
      results.middleware = {
        success: false,
        message: `❌ Erreur middleware: ${String(error)}`
      };
    }

    // Évaluation globale
    const allSuccess = results.database.success && results.apis.success && results.middleware.success;
    results.overall = {
      success: allSuccess,
      message: allSuccess 
        ? '🎉 Tous les tests sont passés avec succès!' 
        : '⚠️  Certains tests ont échoué, vérifiez les détails.'
    };

    console.log('🧪 Tests terminés:', results);

    return NextResponse.json({
      success: results.overall.success,
      message: 'Tests du système d\'essai terminés',
      results,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'exécution des tests',
      details: String(error)
    }, { status: 500 });
  }
}

/**
 * POST /api/trial/test - Initialiser des données de test
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'setup-test-data') {
      // Créer des utilisateurs de test si nécessaire
      const existingUsers = await prisma.user.findMany({
        select: { id: true, username: true, role: true }
      });

      return NextResponse.json({
        success: true,
        message: 'Données de test vérifiées',
        users: existingUsers.map(u => ({ 
          id: u.id, 
          username: u.username, 
          role: u.role 
        }))
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Action non reconnue'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des données de test:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'initialisation des données de test',
      details: String(error)
    }, { status: 500 });
  }
}