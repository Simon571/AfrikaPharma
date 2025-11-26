'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { PrintButton } from '@/components/ui/print-button';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  pharmaceuticalForm: string;
  purchasePrice: number;
  price: number;
  quantity: number;
  expirationDate: string;
  barcode?: string;
  isAvailableForSale: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InventoryStats {
  totalMedications: number;
  totalValue: number;
  lowStockCount: number;
  expiringSoonCount: number;
  outOfStockCount: number;
}

export default function InventoryPage() {
  const { data: session } = useSession();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalMedications: 0,
    totalValue: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
    outOfStockCount: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low-stock' | 'expiring' | 'out-of-stock'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const printRef = React.useRef<HTMLDivElement>(null);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/medications?includeStats=true');
      if (response.ok) {
        const data = await response.json();
        setMedications(data.medications || []);
        calculateStats(data.medications || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'inventaire:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (meds: Medication[]) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const totalValue = meds.reduce((sum, med) => sum + (med.quantity * med.purchasePrice), 0);
    const lowStockCount = meds.filter(med => med.quantity <= 10 && med.quantity > 0).length;
    const expiringSoonCount = meds.filter(med => {
      const expDate = new Date(med.expirationDate);
      return expDate <= thirtyDaysFromNow && expDate >= today;
    }).length;
    const outOfStockCount = meds.filter(med => med.quantity === 0).length;

    setStats({
      totalMedications: meds.length,
      totalValue,
      lowStockCount,
      expiringSoonCount,
      outOfStockCount
    });
  };

  const getStockStatus = (quantity: number, expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (quantity === 0) {
      return { status: 'Rupture de stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    }
    if (expDate <= thirtyDaysFromNow && expDate >= today) {
      return { status: 'Expire bientôt', color: 'bg-yellow-100 text-yellow-800', icon: Calendar };
    }
    if (quantity <= 10) {
      return { status: 'Stock faible', color: 'bg-orange-100 text-orange-800', icon: TrendingDown };
    }
    return { status: 'En stock', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const applyFilters = () => {
    let filtered = medications;

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(med => 
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.pharmaceuticalForm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.barcode?.includes(searchTerm)
      );
    }

    // Filtre par statut
    if (filter !== 'all') {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      filtered = filtered.filter(med => {
        switch (filter) {
          case 'low-stock':
            return med.quantity <= 10 && med.quantity > 0;
          case 'expiring':
            const expDate = new Date(med.expirationDate);
            return expDate <= thirtyDaysFromNow && expDate >= today;
          case 'out-of-stock':
            return med.quantity === 0;
          default:
            return true;
        }
      });
    }

    setFilteredMedications(filtered);
  };

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchInventory();
    }
  }, [session]);

  useEffect(() => {
    applyFilters();
  }, [medications, searchTerm, filter]);

  if (session?.user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Accès refusé</h1>
          <p className="text-gray-600 mt-2">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventaire</h1>
          <p className="text-gray-600 mt-1">Gestion et suivi des stocks de médicaments</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton 
            contentRef={printRef} 
            title="Inventaire des Médicaments"
          >
            Imprimer
          </PrintButton>
          <Button
            onClick={fetchInventory}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div ref={printRef}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Médicaments</p>
                <p className="text-2xl font-bold">{stats.totalMedications}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valeur Totale</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Faible</p>
                <p className="text-2xl font-bold text-orange-600">{stats.lowStockCount}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expire Bientôt</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.expiringSoonCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rupture Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, forme ou code-barres..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
                className="cursor-pointer"
              >
                Tous
              </Button>
              <Button
                variant={filter === 'low-stock' ? 'default' : 'outline'}
                onClick={() => setFilter('low-stock')}
                size="sm"
                className="cursor-pointer"
              >
                Stock Faible
              </Button>
              <Button
                variant={filter === 'expiring' ? 'default' : 'outline'}
                onClick={() => setFilter('expiring')}
                size="sm"
                className="cursor-pointer"
              >
                Expire Bientôt
              </Button>
              <Button
                variant={filter === 'out-of-stock' ? 'default' : 'outline'}
                onClick={() => setFilter('out-of-stock')}
                size="sm"
                className="cursor-pointer"
              >
                Rupture
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des médicaments */}
      <Card>
        <CardHeader>
          <CardTitle>Médicaments ({filteredMedications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Médicament</th>
                  <th className="text-left p-2">Forme</th>
                  <th className="text-right p-2">Quantité</th>
                  <th className="text-right p-2">Prix d'achat</th>
                  <th className="text-right p-2">Prix de vente</th>
                  <th className="text-left p-2">Expiration</th>
                  <th className="text-left p-2">Statut</th>
                  <th className="text-center p-2">Disponible</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedications.map((med) => {
                  const stockInfo = getStockStatus(med.quantity, med.expirationDate);
                  const IconComponent = stockInfo.icon;
                  
                  return (
                    <tr key={med.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{med.name}</p>
                          {med.barcode && (
                            <p className="text-xs text-gray-500">Code: {med.barcode}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-gray-600">{med.pharmaceuticalForm}</td>
                      <td className="p-2 text-right font-mono">
                        <span className={med.quantity <= 10 ? 'text-red-600 font-bold' : ''}>
                          {med.quantity}
                        </span>
                      </td>
                      <td className="p-2 text-right">{formatCurrency(med.purchasePrice)}</td>
                      <td className="p-2 text-right">{formatCurrency(med.price)}</td>
                      <td className="p-2">
                        {new Date(med.expirationDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="p-2">
                        <Badge className={stockInfo.color}>
                          <IconComponent className="h-3 w-3 mr-1" />
                          {stockInfo.status}
                        </Badge>
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant={med.isAvailableForSale ? 'default' : 'secondary'}>
                          {med.isAvailableForSale ? 'Oui' : 'Non'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredMedications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun médicament trouvé avec les critères sélectionnés.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}