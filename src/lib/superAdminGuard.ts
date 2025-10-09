import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import { NextRequest, NextResponse } from 'next/server';

export async function requireSuperAdmin(request: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;

  // Allow if session role is 'super-admin' or matches OWNER_ID env
  const ownerId = process.env.OWNER_ID;
  if (session?.user?.role === 'super-admin' || session?.user?.id === ownerId) {
    return { ok: true, session };
  }

  return { ok: false, status: 403, message: 'Forbidden: super-admin only' };
}

export function requireSuperAdminMiddleware() {
  return async (request: NextRequest) => {
    const res = await requireSuperAdmin(request);
    if (!res.ok) return NextResponse.json({ error: res.message }, { status: res.status });
    return null;
  };
}
