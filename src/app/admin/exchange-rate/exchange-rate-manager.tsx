'use client';

import { FormEvent, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DEFAULT_USD_TO_CDF_RATE } from '@/lib/utils';

type ExchangeRateManagerProps = {
  initialRate: number;
};

export function ExchangeRateManager({ initialRate }: ExchangeRateManagerProps) {
  const [currentRate, setCurrentRate] = useState(initialRate);
  const [formValue, setFormValue] = useState(initialRate.toString());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);

    const parsedValue = Number(formValue);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      setMessage("Le taux doit être un nombre positif.");
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/exchange-rate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usdToCdf: parsedValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de mettre à jour le taux.");
      }

      setCurrentRate(data.usdToCdf);
      setFormValue(data.usdToCdf.toString());
      setMessage('Taux mis à jour avec succès.');
      setMessageType('success');
    } catch (error) {
      const err = error as Error;
      setMessage(err.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormValue(DEFAULT_USD_TO_CDF_RATE.toString());
    setMessage('Valeur par défaut restaurée (non encore enregistrée).');
    setMessageType('success');
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Taux USD → CDF</CardTitle>
        <CardDescription>
          Actuellement, 1 USD = <span className="font-semibold">{currentRate.toLocaleString()} CDF</span>.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="usdToCdf">Nouveau taux (CDF pour 1 USD)</Label>
            <Input
              id="usdToCdf"
              type="number"
              min="1"
              step="1"
              value={formValue}
              onChange={(event) => setFormValue(event.target.value)}
              disabled={loading}
              required
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Ce taux sera utilisé pour toutes les conversions automatiques des prix d’achat et de vente.
          </p>
          {message && (
            <div
              className={`rounded-md px-3 py-2 text-sm ${
                messageType === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {message}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button type="button" variant="secondary" onClick={handleReset} disabled={loading}>
            Valeur par défaut
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Enregistrer le taux'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
