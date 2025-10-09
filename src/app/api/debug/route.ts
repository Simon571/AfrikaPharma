import { NextResponse } from 'next/server';

// Léger et rapide pour les probes
// For mobile static export we must avoid force-dynamic APIs.
export const dynamic = 'force-static';

export function GET() {
  return new NextResponse(null, { status: 204 }); // No Content
}
