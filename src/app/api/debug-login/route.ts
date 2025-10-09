import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG LOGIN API ===');
    
    const body = await request.json();
    const { username, password, role } = body;

    console.log('Request body:', { username, role, passwordLength: password?.length });

    // Vérifier la connexion à la base
    try {
      await prisma.$connect();
      console.log('✅ Prisma connected');
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: String(dbError)
      }, { status: 500 });
    }

    // Chercher l'utilisateur
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { username }
      });
      console.log('User query result:', user ? 'Found' : 'Not found');
      if (user) {
        console.log('User details:', { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          hasPassword: !!user.passwordHash
        });
      }
    } catch (userError) {
      console.error('❌ User query error:', userError);
      return NextResponse.json({ 
        error: 'User query failed',
        details: String(userError)
      }, { status: 500 });
    }

    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 401 });
    }

    // Vérifier le rôle
    if (user.role !== role) {
      console.log('❌ Role mismatch:', { expected: role, actual: user.role });
      return NextResponse.json({ error: 'Rôle incorrect' }, { status: 401 });
    }

    // Vérifier le mot de passe
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.passwordHash);
      console.log('Password check result:', isValidPassword);
    } catch (bcryptError) {
      console.error('❌ Bcrypt error:', bcryptError);
      return NextResponse.json({ 
        error: 'Password verification failed',
        details: String(bcryptError)
      }, { status: 500 });
    }
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }

    console.log('✅ Authentication successful');
    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      redirectUrl: role === 'admin' ? '/admin-dashboard' : '/seller-dashboard'
    });

  } catch (error) {
    console.error('❌ General error:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur générale',
      details: String(error),
      stack: error instanceof Error ? error.stack : 'No stack'
    }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('❌ Disconnect error:', disconnectError);
    }
  }
}