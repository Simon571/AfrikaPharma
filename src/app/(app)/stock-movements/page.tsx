'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Minus, PackageOpen, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PrintButton } from '@/components/ui/print-button';

interface Medication {
  id: string;
  name: string;
  quantity: number;
}

interface PendingEntryItem {
  medicationId: string;
  name: string;
  quantity: number;
}

export default function StockMovementsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEntries, setPendingEntries] = useState<PendingEntryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'movement' | 'entries' | 'corrections'>('movement');
  const [submitting, setSubmitting] = useState(false);
  const printRef = React.useRef<HTMLDivElement>(null);

  // Fetch medications
  const fetchMedications = async () => {
    try {
      setLoading(true);
      // Pour la gestion de stock, on veut TOUS les médicaments, pas seulement ceux disponibles pour la vente
      const res = await fetch(`/api/medications/all?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Erreur chargement médicaments');
      const data = await res.json();
      setMedications(data);
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchMedications, 300);
    return () => clearTimeout(t);
  }, [search]);

  const addEntry = (med: Medication) => {
    setPendingEntries(prev => {
      const existing = prev.find(p => p.medicationId === med.id);
      if (existing) {
        return prev.map(p => p.medicationId === med.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { medicationId: med.id, name: med.name, quantity: 1 }];
    });
  };

  const decreaseEntry = (med: Medication) => {
    setPendingEntries(prev => prev.map(p => p.medicationId === med.id ? { ...p, quantity: Math.max(1, p.quantity - 1) } : p));
  };

  const removeEntry = (med: Medication) => {
    setPendingEntries(prev => prev.filter(p => p.medicationId !== med.id));
  };

  const confirmEntries = async () => {
    if (pendingEntries.length === 0) {
      toast.error('Aucune entrée à confirmer');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ENTRY', items: pendingEntries.map(p => ({ medicationId: p.medicationId, quantity: p.quantity })) })
      });
      if (!res.ok) throw new Error('Erreur enregistrement entrées');
      toast.success('Entrées enregistrées');
      setPendingEntries([]);
      fetchMedications();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la confirmation');
    } finally {
      setSubmitting(false);
    }
  };

  const registerExit = async (med: Medication) => {
    if (med.quantity <= 0) {
      toast.error('Stock déjà à 0');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'EXIT', medicationId: med.id, quantity: 1 })
      });
      if (!res.ok) throw new Error('Erreur enregistrement sortie');
      toast.success('Sortie enregistrée');
      fetchMedications();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la sortie');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingMap = useMemo(() => Object.fromEntries(pendingEntries.map(p => [p.medicationId, p.quantity])), [pendingEntries]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Mouvements de Stock</h1>
          <p className="text-gray-600">Ajoutez des arrivages, corrigez les erreurs et suivez l'historique des mouvements.</p>
        </div>
        <div className="flex space-x-4">
          <PrintButton 
            contentRef={printRef} 
            title="Mouvements de Stock"
          >
            Imprimer
          </PrintButton>
          <button 
            onClick={() => setActiveTab('movement')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'movement' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Mouvement
          </button>
          <button 
            onClick={() => window.location.href = '/stock-entries-history'}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Hist. Entrées
          </button>
          <button 
            onClick={() => window.location.href = '/stock-corrections-history'}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Hist. Corrections
          </button>
        </div>
      </div>

      {activeTab === 'movement' && (
        <div ref={printRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des Produits */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Liste des Produits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="border rounded-md overflow-hidden max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Stock Actuel</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={3}>Chargement...</TableCell></TableRow>
                    ) : medications.length === 0 ? (
                      <TableRow><TableCell colSpan={3}>Aucun produit</TableCell></TableRow>
                    ) : (
                      medications.map(med => {
                        const pendingQty = pendingMap[med.id];
                        return (
                          <TableRow key={med.id}>
                            <TableCell>{med.name}</TableCell>
                            <TableCell>{med.quantity}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 w-28">
                                <div className="flex items-center gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    disabled={submitting} 
                                    onClick={() => addEntry(med)} 
                                    className="w-full justify-center"
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Entrée{pendingQty ? ` (+${pendingQty})` : ''}
                                  </Button>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  disabled={submitting || med.quantity <= 0} 
                                  onClick={() => registerExit(med)} 
                                  className="w-full justify-center"
                                >
                                  <Minus className="h-3 w-3 mr-1" /> Sortie
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau nouvelle entrée - Position fixe */}
        <div className="lg:col-span-1">
          <Card className="flex flex-col sticky top-6 max-h-[calc(100vh-8rem)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PackageOpen className="h-5 w-5" /> Nouvelle Entrée de Stock</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {pendingEntries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500 text-center p-6">
                Aucune entrée de stock en attente.<br />Utilisez le bouton "Entrée" pour préparer un nouvel arrivage.
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="w-32">Quantité</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingEntries.map(item => (
                      <TableRow key={item.medicationId}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              disabled={item.quantity <= 1 || submitting} 
                              onClick={() => decreaseEntry({ id: item.medicationId, name: item.name, quantity: item.quantity })}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              className="h-8 w-20"
                              value={item.quantity}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                setPendingEntries(prev => prev.map(p => p.medicationId === item.medicationId ? { ...p, quantity: isNaN(v) || v < 1 ? 1 : v } : p));
                              }}
                            />
                            <Button 
                              size="sm" 
                              variant="outline" 
                              disabled={submitting} 
                              onClick={() => addEntry({ id: item.medicationId, name: item.name, quantity: item.quantity })}
                            >
                              +
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            disabled={submitting} 
                            onClick={() => removeEntry({ id: item.medicationId, name: item.name, quantity: item.quantity })}
                          >
                            Retirer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <div className="border-t p-4">
            <Button 
              disabled={pendingEntries.length === 0 || submitting} 
              onClick={confirmEntries} 
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              size="lg"
            >
              {submitting ? 'Enregistrement...' : 'Confirmer l\'Entrée en Stock'}
            </Button>
          </div>
          </Card>
        </div>
        </div>
      )}
      
      {activeTab === 'entries' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Historique des Entrées</h3>
          <p className="text-gray-600">Fonctionnalité à venir - Affichage de l'historique des entrées de stock</p>
        </div>
      )}
      
      {activeTab === 'corrections' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Historique des Corrections</h3>
          <p className="text-gray-600">Fonctionnalité à venir - Affichage de l'historique des corrections de stock</p>
        </div>
      )}
    </div>
  );
}