'use client';

import { FormEvent, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DEFAULT_USD_TO_CDF_RATE } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

type ExchangeRateManagerProps = {
  initialRate: number;
};

export function ExchangeRateManager({ initialRate }: ExchangeRateManagerProps) {
  const [currentRate, setCurrentRate] = useState(initialRate);
  const [formValue, setFormValue] = useState(initialRate.toString());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [medicationsUpdated, setMedicationsUpdated] = useState<number | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);
    setMedicationsUpdated(null);

    const parsedValue = Number(formValue);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      setMessage("Le taux doit être un nombre positif.");
      setMessageType('error');
      return;
    }

    // Si le taux change, demander confirmation
    if (parsedValue !== currentRate && !showConfirm) {
      setShowConfirm(true);
      setMessage(`⚠️ Attention : Changer le taux de ${currentRate.toLocaleString()} à ${parsedValue.toLocaleString()} CDF va recalculer TOUS les prix des médicaments. Cliquez à nouveau pour confirmer.`);
      setMessageType('warning');
      return;
    }

    try {
      setLoading(true);
      setShowConfirm(false);
      
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
      
      if (data.medicationsUpdated !== undefined) {
        setMedicationsUpdated(data.medicationsUpdated);
        setMessage(`✅ Taux mis à jour ! ${data.medicationsUpdated} médicaments ont été recalculés.`);
      } else {
        setMessage('✅ Taux mis à jour avec succès.');
      }
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
    setShowConfirm(false);
    setMessage('Valeur par défaut restaurée (non encore enregistrée).');
    setMessageType('warning');
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setFormValue(currentRate.toString());
    setMessage(null);
  };

  // Calculer l'aperçu du changement
  const parsedValue = Number(formValue);
  const willChange = parsedValue !== currentRate && parsedValue > 0;
  const changePercent = willChange ? (((parsedValue - currentRate) / currentRate) * 100).toFixed(1) : null;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💱 Taux USD → CDF
        </CardTitle>
        <CardDescription>
          Actuellement, <span className="font-bold text-lg">1 USD = {currentRate.toLocaleString()} CDF</span>
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
              onChange={(event) => {
                setFormValue(event.target.value);
                setShowConfirm(false);
                setMessage(null);
              }}
              disabled={loading}
              required
              className="text-lg font-semibold"
            />
          </div>

          {/* Aperçu du changement */}
          {willChange && !showConfirm && (
            <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3">
              <p className="text-sm text-blue-800">
                <strong>Aperçu du changement :</strong>
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {currentRate.toLocaleString()} CDF → {parsedValue.toLocaleString()} CDF 
                <span className={`ml-2 font-semibold ${Number(changePercent) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({Number(changePercent) > 0 ? '+' : ''}{changePercent}%)
                </span>
              </p>
              <p className="text-xs text-blue-600 mt-2">
                💡 Tous les prix des médicaments seront recalculés proportionnellement.
              </p>
            </div>
          )}

          {/* Avertissement important */}
          <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Impact sur les prix
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Quand vous modifiez le taux, tous les prix d&apos;achat et de vente des médicaments 
                  sont automatiquement recalculés dans la base de données.
                </p>
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`rounded-md px-4 py-3 text-sm flex items-start gap-2 ${
                messageType === 'success'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : messageType === 'warning'
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}
            >
              {messageType === 'success' && <CheckCircle2 className="h-5 w-5 mt-0.5" />}
              {messageType === 'warning' && <AlertTriangle className="h-5 w-5 mt-0.5" />}
              <span>{message}</span>
            </div>
          )}

          {medicationsUpdated !== null && (
            <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3">
              <p className="text-sm text-green-800">
                <RefreshCw className="h-4 w-4 inline mr-2" />
                <strong>{medicationsUpdated}</strong> médicaments ont été mis à jour avec le nouveau taux.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
            Valeur par défaut
          </Button>
          {showConfirm && (
            <Button type="button" variant="ghost" onClick={handleCancel} disabled={loading}>
              Annuler
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading}
            variant={showConfirm ? "destructive" : "default"}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Mise à jour en cours...
              </>
            ) : showConfirm ? (
              '⚠️ Confirmer le changement'
            ) : (
              'Enregistrer le taux'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
