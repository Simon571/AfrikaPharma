import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { username, password, role } = await request.json();

    console.log('Tentative de connexion:', { username, role });

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      console.log('Utilisateur non trouvé:', username);
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
    }

    // Vérifier le rôle
    if (user.role !== role) {
      console.log('Rôle incorrect:', { expected: role, actual: user.role });
      return NextResponse.json({ error: 'Rôle incorrect' }, { status: 401 });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      console.log('Mot de passe incorrect pour:', username);
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
    }

    // Créer un JWT simple
    const token = sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '1d' }
    );

    console.log('Connexion réussie pour:', username);

    // Créer une réponse avec le cookie
    const response = NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      redirectUrl: role === 'admin' ? '/admin-dashboard' : '/seller-dashboard'
    });

    // Définir le cookie d'authentification
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 86400 // 1 jour
    });

    return response;

  } catch (error) {
    console.error('Erreur login:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}