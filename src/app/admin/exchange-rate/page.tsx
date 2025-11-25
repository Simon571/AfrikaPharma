import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getExchangeRate } from '@/lib/exchange-rate';
import { ExchangeRateManager } from './exchange-rate-manager';

export const metadata = {
  title: 'Gestion du taux USD/CDF',
};

export default async function ExchangeRatePage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    redirect('/login-admin');
  }

  const usdToCdf = await getExchangeRate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Taux de change</h1>
        <p className="text-muted-foreground">Ajustez le taux utilisé pour convertir les montants USD ↔ CDF dans toute l’application.</p>
      </div>
      <ExchangeRateManager initialRate={usdToCdf} />
    </div>
  );
}
