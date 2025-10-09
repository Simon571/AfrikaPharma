import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Supprimer tous les utilisateurs
    await prisma.user.deleteMany();
    
    // Créer les utilisateurs
    const adminPassword = await bcrypt.hash('admin123', 12);
    const vendeurPassword = await bcrypt.hash('vendeur123', 12);

    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: adminPassword,
        role: 'admin'
      }
    });

    const vendeur = await prisma.user.create({
      data: {
        username: 'vendeur',
        passwordHash: vendeurPassword,
        role: 'seller'
      }
    });

    // Vérifier les utilisateurs créés
    const users = await prisma.user.findMany();

    return NextResponse.json({ 
      success: true, 
      message: 'Utilisateurs créés',
      users: users.map(u => ({ id: u.id, username: u.username, role: u.role }))
    });

  } catch (error) {
    console.error('Erreur création utilisateurs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, role } = await request.json();

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 401 });
    }

    if (user.role !== role) {
      return NextResponse.json({ error: 'Rôle incorrect' }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      } 
    });

  } catch (error) {
    console.error('Erreur test login:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}