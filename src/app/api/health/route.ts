import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Test de connexion à la base de données
    await prisma.$queryRaw`SELECT 1`;
    
    // Vérifications de base
    const [userCount, medicationCount] = await Promise.all([
      prisma.user.count(),
      prisma.medication.count(),
    ]);
    
    const responseTime = Date.now() - startTime;
    
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: {
        connected: true,
        users: userCount,
        medications: medicationCount,
      },
      performance: {
        responseTime: `${responseTime}ms`,
        uptime: process.uptime(),
      },
      version: process.env.npm_package_version || '1.0.0',
    };
    
    return NextResponse.json(healthCheck);
    
  } catch (error) {
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`,
    };
    
    return NextResponse.json(errorResponse, { status: 503 });
  }
}