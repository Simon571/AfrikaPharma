'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { 
  ShoppingCart, 
  Receipt,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface DailyReportData {
  todaySales: {
    count: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
}

interface ExpenseData {
  expenses: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
  totalExpenses: number;
  count: number;
}

interface Sale {
  id: string;
  date: string;
  totalAmount: number;
  amountPaid: number;
  paymentMethod: string;
  client: {
    name: string;
  };
  items: Array<{
    quantity: number;
    priceAtSale: number;
    medication: {
      name: string;
    };
  }>;
}

export default function DailyReportPage() {
  const { data: session } = useSession();
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [expenseData, setExpenseData] = useState<ExpenseData | null>(null);
  const [todaySalesDetails, setTodaySalesDetails] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Formulaire dépense
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données de ventes
      console.log('🔍 Fetching daily report data...');
      const salesResponse = await fetch('/api/daily-report', { cache: 'no-store' });
      console.log('📊 Daily report response status:', salesResponse.status);
      
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        console.log('✅ Daily report data:', salesData);
        console.log('📊 Sales count:', salesData?.todaySales?.count);
        console.log('💰 Sales revenue:', salesData?.todaySales?.totalRevenue);
        setReportData(salesData);
      } else {
        console.error('❌ Daily report error:', salesResponse.status, await salesResponse.text());
        toast.error(`Erreur lors du chargement des rapports (${salesResponse.status})`);
      }
      
      // Récupérer les détails des ventes d'aujourd'hui
      console.log('🔍 Fetching sales details...');
      const salesDetailsResponse = await fetch('/api/sales?today=true', { cache: 'no-store' });
      console.log('📋 Sales details response status:', salesDetailsResponse.status);
      
      if (salesDetailsResponse.ok) {
        const salesDetailsData = await salesDetailsResponse.json();
        console.log('✅ Sales details data:', salesDetailsData);
        console.log('📋 Sales array length:', salesDetailsData?.sales?.length);
        console.log('📋 Sales array:', salesDetailsData?.sales);
        setTodaySalesDetails(salesDetailsData.sales || []);
      } else {
        console.error('❌ Sales details error:', salesDetailsResponse.status, await salesDetailsResponse.text());
      }

      // Récupérer les dépenses
      console.log('🔍 Fetching expenses...');
      const expensesResponse = await fetch('/api/seller-expenses', { cache: 'no-store' });
      console.log('💰 Expenses response status:', expensesResponse.status);
      
      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();
        console.log('✅ Expenses data:', expensesData);
        setExpenseData(expensesData);
      } else {
        console.error('❌ Expenses error:', expensesResponse.status, await expensesResponse.text());
      }
      
    } catch (error: any) {
      console.error('❌ Fetch error:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expenseDescription.trim() || !expenseAmount || parseFloat(expenseAmount) <= 0) {
      toast.error('Veuillez remplir tous les champs correctement');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch('/api/seller-expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: expenseDescription,
          amount: parseFloat(expenseAmount),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'enregistrement');
      }

      toast.success('Dépense enregistrée avec succès');
      setExpenseDescription('');
      setExpenseAmount('');
      
      // Recharger les données
      fetchReportData();
      
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'seller') {
      fetchReportData();
    }
  }, [session]);

  if (session?.user?.role !== 'seller') {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Accès refusé</h1>
          <p className="text-gray-600">Cette page est réservée aux vendeurs.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalSales = reportData?.todaySales?.totalRevenue || 0;
  const totalExpenses = expenseData?.totalExpenses || 0;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Rapport du Jour</h1>
        <p className="text-gray-600">
          Consultez vos ventes et enregistrez vos dépenses pour la journée du{' '}
          {new Date().toLocaleDateString('fr-FR', { 
            day: 'numeric',
            month: 'long', 
            year: 'numeric' 
          })}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Résumé de la journée */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé de la journée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <div className="bg-blue-500 p-3 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Ventes totales</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalSales)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg">
              <div className="bg-orange-500 p-3 rounded-lg">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Dépenses totales</p>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enregistrer une nouvelle dépense */}
        <Card>
          <CardHeader>
            <CardTitle>Enregistrer une nouvelle dépense</CardTitle>
            <p className="text-sm text-gray-600">Ajoutez une dépense effectuée aujourd'hui.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <Label htmlFor="expense-description">Libellé de la dépense</Label>
                <Input
                  id="expense-description"
                  type="text"
                  placeholder="ex: Achat d'eau"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="expense-amount">Montant (CDF)</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={submitting}
              >
                <Plus className="h-4 w-4 mr-2" />
                {submitting ? 'Enregistrement...' : 'Ajouter la dépense'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Détail de mes ventes du jour */}
        <Card>
          <CardHeader>
            <CardTitle>Détail de mes ventes du jour</CardTitle>
          </CardHeader>
          <CardContent>
            {todaySalesDetails.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune vente enregistrée aujourd'hui</p>
            ) : (
              <div className="space-y-3">
                {todaySalesDetails.map((sale) => (
                  <div key={sale.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Client: {sale.client.name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(sale.date).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(sale.totalAmount)}</p>
                        <p className="text-sm text-gray-600">{sale.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {sale.items.map((item, index) => (
                        <p key={index} className="text-sm text-gray-700">
                          {item.quantity}x {item.medication.name} - {formatCurrency(item.priceAtSale * item.quantity)}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Détail de mes dépenses du jour */}
        <Card>
          <CardHeader>
            <CardTitle>Détail de mes dépenses du jour</CardTitle>
          </CardHeader>
          <CardContent>
            {!expenseData || expenseData.expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune dépense enregistrée aujourd'hui</p>
            ) : (
              <div className="space-y-3">
                {expenseData.expenses.map((expense) => (
                  <div key={expense.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-gray-600">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}