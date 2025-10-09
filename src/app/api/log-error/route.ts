import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security';

export async function POST(request: NextRequest) {
  const { error, session } = await requireAuth();
  
  if (error) return error;

  try {
    const { message, stack, componentStack, timestamp } = await request.json();
    
    // Log l'erreur dans la console du serveur
    console.error('=== ERREUR CLIENT ===');
    console.error('Timestamp:', timestamp);
    console.error('Utilisateur:', session?.user?.id || 'Anonyme');
    console.error('Message:', message);
    console.error('Stack:', stack);
    console.error('Component Stack:', componentStack);
    console.error('====================');
    
    // En production, vous pourriez sauvegarder en base de données
    if (process.env.NODE_ENV === 'production') {
      // Exemple: sauvegarder dans une table d'erreurs
      // await prisma.errorLog.create({
      //   data: {
      //     message,
      //     stack,
      //     componentStack,
      //     userId: session.user.id,
      //     timestamp: new Date(timestamp),
      //   },
      // });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Erreur lors du logging de l\'erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors du logging' },
      { status: 500 }
    );
  }
}