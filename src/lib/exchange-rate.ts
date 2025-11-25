import { prisma } from '@/lib/prisma';
import { DEFAULT_USD_TO_CDF_RATE } from '@/lib/utils';

const RATE_ROW_ID = 'usd_to_cdf';

export async function getExchangeRate(): Promise<number> {
  const record = await prisma.exchangeRateSetting.findUnique({ where: { id: RATE_ROW_ID } });
  return record?.usdToCdf ?? DEFAULT_USD_TO_CDF_RATE;
}

export async function upsertExchangeRate(params: { usdToCdf: number; updatedBy?: string | null }) {
  const { usdToCdf, updatedBy } = params;
  const record = await prisma.exchangeRateSetting.upsert({
    where: { id: RATE_ROW_ID },
    update: { usdToCdf, updatedBy },
    create: { id: RATE_ROW_ID, usdToCdf, updatedBy },
  });
  return record;
}
