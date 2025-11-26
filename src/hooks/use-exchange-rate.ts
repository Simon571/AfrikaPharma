'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_USD_TO_CDF_RATE } from '@/lib/utils';

type ExchangeRateState = {
  rate: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useExchangeRate(): ExchangeRateState {
  const [rate, setRate] = useState(DEFAULT_USD_TO_CDF_RATE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/exchange-rate');
      if (!response.ok) {
        throw new Error('Impossible de récupérer le taux en base.');
      }
      const data = await response.json();
      if (typeof data?.usdToCdf === 'number') {
        setRate(data.usdToCdf);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inattendue.';
      setError(message);
      setRate(DEFAULT_USD_TO_CDF_RATE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  return { rate, isLoading, error, refresh: fetchRate };
}
