'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Receipt,
  BarChart3,
  Calendar,
  Package,
  CreditCard,
  Eye,
  TrendingDown,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PrintButton } from '@/components/ui/print-button';

interface SellerReport {
  sellerId: string;
  sellerName: string;
  totalSales: number;
  salesCount: number;
  totalExpenses: number;
  expensesCount: number;
  netResult: number;
  topMedications: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  salesDetails: Array<{
    id: string;
    date: string;
    totalAmount: number;
    paymentMethod: string;
    client: { name: string };
    itemsCount: number;
  }>;
  expensesDetails: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
  }>;
}

interface GlobalReportData {
  overallStats: {
    totalSales: number;
    totalExpenses: number;
    netResult: number;
    activeSellers: number;
    totalTransactions: number;
  };
  sellerReports: SellerReport[];
  topSellingMedications: Array<{
    name: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  paymentMethodsBreakdown: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
}

export default function GlobalReportPage() {
  const { data: session } = useSession();
  const [reportData, setReportData] = useState<GlobalReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSellers, setExpandedSellers] = useState<Set<string>>(new Set());
  const printRef = React.useRef<HTMLDivElement>(null);

  const toggleSellerExpansion = (sellerId: string) => {
    const newExpanded = new Set(expandedSellers);
    if (newExpanded.has(sellerId)) {
      newExpanded.delete(sellerId);
    } else {
      newExpanded.add(sellerId);
    }
    setExpandedSellers(newExpanded);
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/global-report');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du rapport global');
      }
      
      const data = await response.json();
      setReportData(data);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchReportData();
    }
  }, [session]);

  if (session?.user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Accès refusé</h1>
          <p className="text-gray-600">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Rapport Journalier Global</h1>
        <p className="text-gray-600">Aucune donnée disponible pour aujourd'hui.</p>
      </div>
    );
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'cash': 'Espèces',
      'card': 'Carte',
      'check': 'Chèque',
      'transfer': 'Virement'
    };
    return labels[method] || method;
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Rapport Journalier Global
            </h1>
            <p className="text-gray-600 flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              Vue d'ensemble pour la journée du{' '}
              {new Date().toLocaleDateString('fr-FR', { 
                day: 'numeric',
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
          <Button onClick={fetchReportData} variant="outline" className="cursor-pointer">
            <Activity className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <PrintButton 
            contentRef={printRef} 
            title="Rapport Journalier Global - Admin"
          >
            Imprimer
          </PrintButton>
        </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div ref={printRef}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(reportData.overallStats.totalSales)}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData.overallStats.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses Totales</CardTitle>
            <Receipt className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(reportData.overallStats.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">toutes dépenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Résultat Net</CardTitle>
            {reportData.overallStats.netResult >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${reportData.overallStats.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(reportData.overallStats.netResult)}
            </div>
            <p className="text-xs text-muted-foreground">bénéfice/perte</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendeurs Actifs</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {reportData.overallStats.activeSellers}
            </div>
            <p className="text-xs text-muted-foreground">
              sur {reportData.sellerReports.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(
                reportData.overallStats.totalTransactions > 0 
                  ? reportData.overallStats.totalSales / reportData.overallStats.totalTransactions 
                  : 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">par transaction</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top médicaments vendus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Médicaments (Global)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.topSellingMedications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucun médicament vendu</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Médicament</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-right">Chiffre d'affaires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.topSellingMedications.map((med, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{med.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{med.totalQuantity}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(med.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Méthodes de paiement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Répartition des Paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.paymentMethodsBreakdown.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucun paiement enregistré</p>
            ) : (
              <div className="space-y-4">
                {reportData.paymentMethodsBreakdown.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{getPaymentMethodLabel(payment.method)}</p>
                      <p className="text-sm text-gray-600">{payment.count} transaction(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-600">{payment.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rapports par vendeur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance par Vendeur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.sellerReports.map((seller) => {
              const isExpanded = expandedSellers.has(seller.sellerId);
              return (
                <div key={seller.sellerId} className="border rounded-lg p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-lg"
                    onClick={() => toggleSellerExpansion(seller.sellerId)}
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-lg">{seller.sellerName}</h3>
                        <p className="text-sm text-gray-600">
                          {seller.salesCount} vente(s) • {seller.expensesCount} dépense(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(seller.totalSales)}
                        </p>
                        <p className="text-sm text-gray-500">ventes</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">
                          {formatCurrency(seller.totalExpenses)}
                        </p>
                        <p className="text-sm text-gray-500">dépenses</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${seller.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(seller.netResult)}
                        </p>
                        <p className="text-sm text-gray-500">net</p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Détails des ventes */}
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          Ventes du jour ({seller.salesCount})
                        </h4>
                        {seller.salesDetails.length === 0 ? (
                          <p className="text-gray-500 text-sm">Aucune vente</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {seller.salesDetails.map((sale) => (
                              <div key={sale.id} className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-sm">{sale.client.name}</p>
                                    <p className="text-xs text-gray-600">
                                      {new Date(sale.date).toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })} • {sale.itemsCount} article(s)
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-green-600">{formatCurrency(sale.totalAmount)}</p>
                                    <p className="text-xs text-gray-600">{sale.paymentMethod}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Détails des dépenses */}
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          Dépenses du jour ({seller.expensesCount})
                        </h4>
                        {seller.expensesDetails.length === 0 ? (
                          <p className="text-gray-500 text-sm">Aucune dépense</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {seller.expensesDetails.map((expense) => (
                              <div key={expense.id} className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-sm">{expense.description}</p>
                                    <p className="text-xs text-gray-600">
                                      {new Date(expense.date).toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                  <p className="font-bold text-red-600">{formatCurrency(expense.amount)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Top médicaments du vendeur */}
                    {seller.topMedications.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Top médicaments vendus
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {seller.topMedications.map((med, index) => (
                            <Badge key={index} variant="outline" className="px-3 py-1">
                              {med.name} ({med.quantity})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}