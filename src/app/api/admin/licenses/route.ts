import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/superAdminGuard';
import crypto from 'crypto';

function generateLicenseKey() {
  return crypto.randomBytes(16).toString('hex');
}

export async function POST(request: NextRequest) {
  const check = await requireSuperAdmin(request);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: 403 });

  const body = await request.json();
  const { clientId, expiresInDays } = body;
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });

  const key = generateLicenseKey();
  const issuedAt = new Date();
  const expiresAt = expiresInDays ? new Date(issuedAt.getTime() + expiresInDays * 24 * 3600 * 1000) : null;

  // Use raw SQL to insert license to avoid Prisma typing until client is regenerated
  const created = await prisma.$executeRaw`
    INSERT INTO "License" ("id", "clientId", "key", "status", "issuedAt", "expiresAt", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, ${clientId}, ${key}, 'ACTIVE', ${issuedAt}, ${expiresAt}, ${issuedAt}, ${issuedAt});
  `;

  try {
    await prisma.auditLog.create({
      data: {
        action: 'create',
        model: 'License',
        recordId: key,
        userId: (check.session?.user?.id as string) || 'system',
        oldValue: null,
        newValue: JSON.stringify({ clientId, key, issuedAt, expiresAt }),
      }
    });
  } catch (e) {}

  return NextResponse.json({ ok: true, key });
}

export async function PATCH(request: NextRequest) {
  const check = await requireSuperAdmin(request);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: 403 });

  const body = await request.json();
  const { licenseKey, action } = body; // action: 'deactivate' | 'activate' | 'suspend'
  if (!licenseKey || !action) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const newStatus = action === 'deactivate' ? 'REVOKED' : action === 'suspend' ? 'SUSPENDED' : 'ACTIVE';

  await prisma.$executeRaw`
    UPDATE "License" SET "status" = ${newStatus}, "updatedAt" = ${new Date()} WHERE "key" = ${licenseKey};
  `;

  try {
    await prisma.auditLog.create({
      data: {
        action: 'update',
        model: 'License',
        recordId: licenseKey,
        userId: (check.session?.user?.id as string) || 'system',
        oldValue: null,
        newValue: JSON.stringify({ status: newStatus }),
      }
    });
  } catch (e) {}

  return NextResponse.json({ ok: true });
}
