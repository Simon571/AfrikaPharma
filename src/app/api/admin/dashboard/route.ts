import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/superAdminGuard';

export async function GET(request: NextRequest) {
  const check = await requireSuperAdmin(request);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: 403 });

  // Use raw queries to avoid needing a regenerated Prisma client in this session
  const totalClientsRes: Array<{ count: string }> = await prisma.$queryRaw`
    SELECT COUNT(*)::text as count FROM "Client";
  `;
  const totalClients = Number(totalClientsRes[0]?.count || 0);

  const activeClientsRes: Array<{ count: string }> = await prisma.$queryRaw`
    SELECT COUNT(*)::text as count FROM "Client" WHERE status = 'ACTIVE';
  `;
  const activeClients = Number(activeClientsRes[0]?.count || 0);

  const licenseCountRes: Array<{ count: string }> = await prisma.$queryRaw`
    SELECT COUNT(*)::text as count FROM "License";
  `;
  const licenseCount = Number(licenseCountRes[0]?.count || 0);

  const totalRevenueRes: Array<{ total: string }> = await prisma.$queryRaw`
    SELECT COALESCE(SUM(amount)::text, '0') as total FROM "Payment";
  `;
  const totalRevenue = Number(totalRevenueRes[0]?.total || 0);

  const revenueByMonth: Array<{ month: string; total: string }> = await prisma.$queryRaw`
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month, COALESCE(SUM(amount)::text, '0') as total
    FROM "Payment"
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12;
  `;

  return NextResponse.json({
    totalClients,
    activeClients,
    licenseCount,
    totalRevenue,
    revenueByMonth: revenueByMonth.map(r => ({ month: r.month, total: Number(r.total) })),
  });
}
