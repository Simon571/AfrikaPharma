'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, PlusIcon, Filter, RotateCcw, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  registeredBy: string;
  user?: {
    username: string;
  };
}

export default function ExpensesPage() {
  const { data: session, status } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allCount, setAllCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Formulaire
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Filtres
  // Utilise 'all' comme valeur sentinelle (au lieu de '' qui provoque une erreur avec <SelectItem />)
  const router = useRouter();
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Initialize filters from the URL on client-side only to avoid using
  // next/navigation hooks during prerender which can cause build-time errors.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    setFilterCategory(sp.get('category') || 'all');
    setFilterStartDate(sp.get('startDate') || '');
    setFilterEndDate(sp.get('endDate') || '');
  }, []);

  // Sync URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filterCategory !== 'all') params.set('category', filterCategory);
    if (filterStartDate) params.set('startDate', filterStartDate);
    if (filterEndDate) params.set('endDate', filterEndDate);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : '?');
  }, [filterCategory, filterStartDate, filterEndDate, router]);

  const categories = ['Général', 'Utilitaires', 'Location', 'Matériel', 'Maintenance', 'Transport', 'Marketing', 'Personnel'];

  const fetchExpensesImmediate = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
  // N'ajouter le filtre catégorie que si ce n'est pas la valeur sentinelle 'all'
  if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);

      const response = await fetch(`/api/expenses?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setExpenses(Array.isArray(data) ? data : []);
      // Fetch total count (unfiltered) once if not already
      if (allCount === null) {
        try {
          const totalRes = await fetch('/api/expenses'); // server will ignore filters without params
          if (totalRes.ok) {
            const totalData = await totalRes.json();
            if (Array.isArray(totalData)) setAllCount(totalData.length);
          }
        } catch {}
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des dépenses:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la récupération des dépenses');
    } finally {
      setLoading(false);
    }
  };

  // Debounce fetch to avoid rapid refetch when user changes multiple filters
  const fetchExpenses = useCallback(() => {
    let handle: any;
    if (handle) clearTimeout(handle);
    handle = setTimeout(() => {
      fetchExpensesImmediate();
    }, 300);
    return () => clearTimeout(handle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchExpenses();
    }
  }, [status, fetchExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || !amount || !category) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
          amount: parseFloat(amount),
          category,
          date: new Date(date).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      toast.success('Dépense ajoutée avec succès');

      // Reset form
      setDescription('');
      setAmount('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);

      // Refresh expenses
      await fetchExpensesImmediate();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la dépense:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la dépense');
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const categorySummary = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    expenses.forEach(e => {
      const key = e.category || 'Autre';
      const entry = map.get(key) || { total: 0, count: 0 };
      entry.total += e.amount;
      entry.count += 1;
      map.set(key, entry);
    });
    return Array.from(map.entries()).sort((a,b) => b[1].total - a[1].total);
  }, [expenses]);

  const resetFilters = () => {
    setFilterCategory('all');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const exporting = React.useRef(false);
  const exportCsv = () => {
    if (exporting.current) return;
    try {
      const headers = ['Date','Description','Catégorie','Montant (CDF)','Enregistré par'];
      const rows = expenses.map(e => [
        new Date(e.date).toISOString().split('T')[0],
        e.description.replace(/"/g,'""'),
        e.category,
          e.amount.toString(),
        e.registeredBy
      ]);
      const csv = [headers, ...rows].map(r => r.map(f => `"${f}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `depenses-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Export CSV généré');
    } catch (err) {
      toast.error('Échec de l\'export CSV');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6">
            <p className="text-center text-red-600">Accès non autorisé</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Dépenses</h1>
          <p className="text-gray-600">Gérez et suivez toutes les dépenses de la pharmacie</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Nouvelle Dépense
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total des Dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nombre de Dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{expenses.length}{allCount !== null && filterCategory !== 'all' || filterStartDate || filterEndDate ? ` / ${allCount}` : ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Moyenne par Dépense</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {expenses.length > 0 ? formatCurrency(Math.round(totalExpenses / expenses.length)) : formatCurrency(0)}
            </p>
          </CardContent>
        </Card>
      </div>
      {categorySummary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {categorySummary.slice(0,8).map(([cat, info]) => (
            <div key={cat} className="flex items-center justify-between text-sm bg-muted/40 rounded px-3 py-2">
              <span className="font-medium truncate" title={cat}>{cat}</span>
              <span className="text-xs text-gray-600">{info.count} • {formatCurrency(info.total, 'CDF', false)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Ajouter une Nouvelle Dépense</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description de la dépense"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Montant (CDF) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Ajouter la Dépense</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="filter-category">Catégorie</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-start">Date de début</Label>
              <Input
                id="filter-start"
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filter-end">Date de fin</Label>
              <Input
                id="filter-end"
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetFilters} className="w-full" title="Réinitialiser les filtres">
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
              <Button type="button" variant="secondary" onClick={exportCsv} className="w-full" title="Exporter en CSV">
                <Download className="h-4 w-4 mr-2" /> CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des dépenses */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Dépenses</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-center text-gray-500 p-6">Aucune dépense trouvée</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Enregistré par</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {new Date(expense.date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {expense.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>{expense.registeredBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}