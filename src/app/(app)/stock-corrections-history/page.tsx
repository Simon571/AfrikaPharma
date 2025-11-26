'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, ArrowLeft, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { PrintButton } from '@/components/ui/print-button';

interface StockCorrection {
  id: string;
  medicationId: string;
  medicationName: string;
  type: string;
  quantity: number;
  reason: string;
  previousStock: number;
  newStock: number;
  createdAt: string;
  userId: string;
  userName: string;
}

interface MonthlyCorrections {
  month: string;
  year: number;
  corrections: StockCorrection[];
  count: number;
}

export default function StockCorrectionsHistoryPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyCorrections[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());
  const router = useRouter();
  const printRef = React.useRef<HTMLDivElement>(null);

  const fetchCorrections = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stock-movements?type=CORRECTION&grouped=true');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setMonthlyData(data);
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors du chargement des corrections');
    } finally {
      setLoading(false);
    }
  };

  // Grouper les données par année - seulement si on a des données
  const dataByYear = monthlyData.length > 0 ? monthlyData.reduce((acc: any, monthData: any) => {
    const year = monthData.year;
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(monthData);
    return acc;
  }, {}) : {};

  // Trier les années par ordre décroissant
  const sortedYears = Object.keys(dataByYear).sort((a, b) => parseInt(b) - parseInt(a));

  useEffect(() => {
    fetchCorrections();
  }, []);

  const toggleMonth = (monthKey: string) => {
    const newOpenMonths = new Set(openMonths);
    if (newOpenMonths.has(monthKey)) {
      newOpenMonths.delete(monthKey);
    } else {
      newOpenMonths.add(monthKey);
    }
    setOpenMonths(newOpenMonths);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CORRECTION':
        return 'Correction';
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'CORRECTION':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Historique des Corrections de Stock</h1>
            <p className="text-muted-foreground">Consultez toutes les sorties de stock (péremption, casse, erreur, etc.).</p>
          </div>
        </div>
        <div className="text-center py-8">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">Historique des Corrections de Stock</h1>
            <p className="text-muted-foreground">Consultez toutes les sorties de stock (péremption, casse, erreur, etc.).</p>
          </div>
        </div>
      </div>
      <PrintButton 
        contentRef={printRef} 
        title="Historique des Corrections de Stock"
      >
        Imprimer
      </PrintButton>
      </div>

      {monthlyData.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Aucune correction de stock trouvée.</p>
          </CardContent>
        </Card>
      ) : (
        <div ref={printRef} className="space-y-6">
          {sortedYears.map((year) => (
            <div key={year} className="space-y-4">
              <h2 className="text-xl font-semibold">{year}</h2>
              
              {dataByYear[year].map((monthData: any) => {
                const monthKey = `${monthData.year}-${monthData.month}`;
                const isOpen = openMonths.has(monthKey);
                
                return (
                  <Card key={monthKey} className="overflow-hidden">
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleMonth(monthKey)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <CardTitle className="text-lg">{monthData.month} {monthData.year}</CardTitle>
                        </div>
                        <Badge variant="outline">
                          {monthData.count} correction{monthData.count > 1 ? 's' : ''}(s) de stock ce mois-ci.
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    {isOpen && (
                      <CardContent className="pt-0">
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Médicament</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Quantité</TableHead>
                                <TableHead>Stock précédent</TableHead>
                                <TableHead>Nouveau stock</TableHead>
                                <TableHead>Raison</TableHead>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {monthData.corrections.map((correction: any) => (
                                <TableRow key={correction.id}>
                                  <TableCell className="font-medium">
                                    {correction.medicationName}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={getTypeBadgeVariant(correction.type)}>
                                      {getTypeLabel(correction.type)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <span className={correction.type === 'CORRECTION' && correction.newStock < correction.previousStock ? 'text-red-600' : 'text-green-600'}>
                                      {correction.type === 'CORRECTION' && correction.newStock < correction.previousStock ? '-' : '+'}{correction.quantity}
                                    </span>
                                  </TableCell>
                                  <TableCell>{correction.previousStock}</TableCell>
                                  <TableCell>{correction.newStock}</TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground">
                                      {correction.reason}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm">
                                      {correction.userName}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground">
                                      {formatDate(correction.createdAt)}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}