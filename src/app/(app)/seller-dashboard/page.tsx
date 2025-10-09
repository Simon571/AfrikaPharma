
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, BarChart3, DollarSign, Receipt, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import MobileNavigation from '@/components/ui/mobile-navigation';

interface DailySummary {
  totalSales: number;
  transactionCount: number;
}

interface ReportData {
  todaySales: {
    count: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
}

export default function SellerDashboardPage() {
  const { data: session } = useSession();
  const [dailySummary, setDailySummary] = useState<DailySummary>({
    totalSales: 0,
    transactionCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fonction pour récupérer les données
  const fetchDailySummary = async () => {
    setIsLoading(true);
    try {
  const response = await fetch('/api/daily-report', { cache: 'no-store' });
      if (response.ok) {
        const data: ReportData = await response.json();
        setDailySummary({
          totalSales: data.todaySales.totalRevenue || 0,
          transactionCount: data.todaySales.count || 0
        });
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchDailySummary();
    }
  }, [session]);

  // Rafraîchir automatiquement quand la page redevient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session) {
        fetchDailySummary();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session]);

  const sellerName = session?.user?.name || 'seller';
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="relative">
      <MobileNavigation userRole="seller" />
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* En-tête de bienvenue */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Bonjour, {sellerName}!</h1>
          <p className="text-sm sm:text-base text-gray-600">Voici votre résumé pour aujourd'hui, {currentDate}.</p>
        </div>
        <Button
          onClick={fetchDailySummary}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Cartes de résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Ventes du Jour */}
        <Card className="bg-blue-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base sm:text-lg font-medium">Ventes du Jour</CardTitle>
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{formatCurrency(dailySummary.totalSales)}</div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base sm:text-lg font-medium text-gray-700">Transactions</CardTitle>
            <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{dailySummary.transactionCount}</div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              ventes réalisées aujourd'hui
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Rapides */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Actions Rapides</h2>
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {/* Nouvelle Vente */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-300">
            <CardContent className="p-4 sm:p-6">
              <Link href="/ventes" className="block">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-3 sm:p-4 bg-blue-100 rounded-lg flex-shrink-0">
                    <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      Nouvelle Vente
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Accéder au terminal de vente pour enregistrer de nouvelles transactions client.
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Mon Rapport */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-green-300">
            <CardContent className="p-4 sm:p-6">
              <Link href="/daily-report" className="block">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-3 sm:p-4 bg-green-100 rounded-lg flex-shrink-0">
                    <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      Mon Rapport
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Consulter vos ventes et ajouter des dépenses pour le rapport journalier.
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}

