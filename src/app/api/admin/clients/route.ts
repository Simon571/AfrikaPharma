import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/superAdminGuard';

export async function GET(request: NextRequest) {
  const check = await requireSuperAdmin(request);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: 403 });

  // Include related license so the admin console can determine which clients
  // are using the web application (activated license / usage logs).
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: { license: true },
  });

  return NextResponse.json({ clients });
}

export async function POST(request: NextRequest) {
  const check = await requireSuperAdmin(request);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: 403 });

  const body = await request.json();
  const { name, contactName, contactEmail, contactPhone, address } = body;

  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });

  const client = await prisma.client.create({
    data: {
      name,
      contactName,
      contactEmail,
      contactPhone,
      address,
    } as any
  });

  // Audit
  try {
    await prisma.auditLog.create({
      data: {
        action: 'create',
        model: 'Client',
        recordId: client.id,
        userId: (check.session?.user?.id as string) || 'system',
        oldValue: null,
        newValue: JSON.stringify(client),
      }
    });
  } catch (e) {
    // ignore audit failures
  }

  return NextResponse.json({ client });
}

// PATCH for suspend/unsuspend
export async function PATCH(request: NextRequest) {
  const check = await requireSuperAdmin(request);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: 403 });

  const body = await request.json();
  const { clientId, action } = body; // action: 'suspend' | 'activate'

  if (!clientId || !action) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

  const status = action === 'suspend' ? 'SUSPENDED' : 'ACTIVE';

  const client = await prisma.client.update({
    where: { id: clientId },
    data: { status } as any
  });

  try {
    await prisma.auditLog.create({
      data: {
        action: 'update',
        model: 'Client',
        recordId: client.id,
        userId: (check.session?.user?.id as string) || 'system',
        oldValue: null,
        newValue: JSON.stringify({ status }),
      }
    });
  } catch (e) {}

  return NextResponse.json({ client });
}

export async function DELETE(request: NextRequest) {
  const check = await requireSuperAdmin(request);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: 403 });

  const url = new URL(request.url);
  const clientId = url.searchParams.get('clientId');
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });

  await prisma.client.delete({ where: { id: clientId } });

  try {
    await prisma.auditLog.create({
      data: {
        action: 'delete',
        model: 'Client',
        recordId: clientId,
        userId: (check.session?.user?.id as string) || 'system',
        oldValue: null,
        newValue: null,
      }
    });
  } catch (e) {}

  return NextResponse.json({ ok: true });
}
