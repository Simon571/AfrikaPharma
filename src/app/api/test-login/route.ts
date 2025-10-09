import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, role } = body || {};

    console.log('Test login payload:', body);

    // Validation basique des champs pour éviter des erreurs serveur
    if (!username || !password || !role) {
      console.warn('Champs manquants pour test-login', { username, password, role });
      return NextResponse.json({ error: 'Champs manquants: username, password, role' }, { status: 400 });
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      console.log('Utilisateur non trouvé');
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 401 });
    }

    console.log('Utilisateur trouvé:', { id: user.id, username: user.username, role: user.role });

    // Vérifier le rôle
    if (user.role !== role) {
      console.log('Rôle incorrect:', { expected: role, actual: user.role });
      return NextResponse.json({ error: 'Rôle incorrect' }, { status: 401 });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      console.log('Mot de passe incorrect');
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }

    console.log('Authentification réussie');
    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      } 
    });

  } catch (error) {
    console.error('Erreur API test-login:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}