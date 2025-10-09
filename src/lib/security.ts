import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return {
      error: NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      ),
      session: null
    };
  }
  
  return { error: null, session };
}

export async function requireAdmin() {
  const { error, session } = await requireAuth();
  
  if (error) return { error, session };
  
  if (session?.user?.role !== 'admin') {
    return {
      error: NextResponse.json(
        { error: 'Accès non autorisé - Admin requis' },
        { status: 403 }
      ),
      session: null
    };
  }
  
  return { error: null, session };
}

export async function requireSeller() {
  const { error, session } = await requireAuth();
  
  if (error) return { error, session };
  
  if (session?.user?.role !== 'seller' && session?.user?.role !== 'admin') {
    return {
      error: NextResponse.json(
        { error: 'Accès non autorisé - Vendeur requis' },
        { status: 403 }
      ),
      session: null
    };
  }
  
  return { error: null, session };
}

// Validation des entrées API
export function validateApiInput(data: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!data[field] && data[field] !== 0) {
      return `Le champ '${field}' est requis`;
    }
  }
  return null;
}

// Sanitisation des entrées
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 255); // Limite à 255 caractères
}

// Validation des IDs
export function validateId(id: string): boolean {
  return /^[a-zA-Z0-9-_]+$/.test(id) && id.length > 0 && id.length <= 50;
}