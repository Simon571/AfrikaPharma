'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { PlusCircle, MinusCircle, Trash2, Printer, Scan, Loader2, ShoppingCart } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { fetchMedications } from '@/lib/api-utils';
import { useReactToPrint } from 'react-to-print';
import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BarcodeScanner from '@/components/scanner/barcode-scanner';
import { Label } from '@/components/ui/label';
import PrintableContent from '@/components/invoice/PrintableContent';
import MobileNavigation from '@/components/ui/mobile-navigation';

interface Medication {
  id: string;
  name: string;
  price: number; // Assuming price is in CDF
  quantity: number; // stock quantity
  barcode: string;
}

interface CartItem {
  medication: Medication;
  quantity: number; // quantity in cart
}

export default function SellPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const printRef = React.useRef(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showConfirmSale, setShowConfirmSale] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  // Debounce du terme de recherche pour éviter trop d'appels API
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Effet pour détecter la saisie en cours
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    const fetchMedicationsData = async () => {
      try {
        setIsLoading(true);
        
        const params = {
          inStock: true,
          ...(debouncedSearchTerm.length > 0 && { search: debouncedSearchTerm })
        };
        
        const data = await fetchMedications(params);
        setMedications(data);
        
      } catch (error) {
        console.error('Failed to fetch medications:', error);
        setMedications([]); // S'assurer que medications reste un array
        toast.error('Erreur lors de la recherche des médicaments.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedicationsData();
  }, [debouncedSearchTerm]);

  const addToCart = useCallback((medication: Medication) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.medication.id === medication.id);
      if (existingItem) {
        if (existingItem.quantity < medication.quantity) {
          return prevCart.map((item) =>
            item.medication.id === medication.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          toast.warning(`Stock insuffisant pour ${medication.name}.`);
          return prevCart;
        }
      } else {
        if (medication.quantity > 0) {
          return [...prevCart, { medication, quantity: 1 }];
        } else {
          toast.warning(`${medication.name} est en rupture de stock.`);
          return prevCart;
        }
      }
    });
    // Ne pas vider la recherche ni la liste; garder visible pour ajouter plusieurs produits
  }, [setCart, setSearchTerm, setMedications]);

  const updateCartQuantity = (medicationId: string, delta: number) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) => {
        if (item.medication.id === medicationId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity > 0 && newQuantity <= item.medication.quantity) {
            return { ...item, quantity: newQuantity };
          } else if (newQuantity <= 0) {
            return null; // Mark for removal
          } else {
            toast.warning(`Stock insuffisant pour ${item.medication.name}.`);
          }
        }        return item;
      }).filter(Boolean) as CartItem[]; // Filter out nulls
      return updatedCart;
    });
  };

  const removeFromCart = (medicationId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.medication.id !== medicationId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.medication.price * item.quantity, 0);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Facture_${Date.now()}`,
    onAfterPrint: () => {
      // Afficher la boîte de confirmation après l'impression
      setShowInvoicePreview(false);
      setShowConfirmSale(true);
    },
  });

  const showInvoicePreviewHandler = () => {
    if (cart.length === 0) {
      toast.error('Le panier est vide. Impossible de générer une facture.');
      return;
    }
    setShowInvoicePreview(true);
  };

  const saveSale = async () => {
    if (cart.length === 0) {
      toast.error('Le panier est vide. Impossible d\'enregistrer la vente.');
      return;
    }

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: clientName || 'Client Anonyme',
          totalAmount,
          amountPaid: totalAmount,
          changeDue: 0,
          paymentMethod: 'Espèces',
          items: cart.map((item) => ({
            medicationId: item.medication.id,
            quantity: item.quantity,
            priceAtSale: item.medication.price,
          })),
        }),
      });

      if (res.ok) {
        toast.success('Vente enregistrée avec succès!');
        setCart([]);
        setClientName('');
        setShowConfirmSale(false);
        try {
          await Promise.allSettled([
            fetch('/api/daily-report', { cache: 'no-store' }),
            fetch('/api/sales?today=true', { cache: 'no-store' })
          ]);
        } catch (_) {}
      } else {
        let msg = `HTTP ${res.status}`;
        try {
          const data = await res.json();
          msg = data.message || data.error || msg;
        } catch {}
        toast.error(`Erreur lors de l'enregistrement de la vente: ${msg}`);
      }
    } catch (error) {
      console.error('Failed to save sale:', error);
      toast.error('Erreur réseau lors de l\'enregistrement de la vente.');
    }
  };

  const onScanSuccess = useCallback(async (decodedText: string) => {
    setIsScannerOpen(false); // Close scanner after successful scan
    try {
      const res = await fetch(`/api/medications?search=${decodedText}`);
      const data = await res.json();
      if (data && data.length > 0) {
        addToCart(data[0]); // Add the first found medication to cart
        toast.success(`Médicament ${data[0].name} ajouté au panier.`);
      } else {
        toast.error('Médicament non trouvé avec ce code-barres.');
      }
    } catch (error) {
      console.error('Error fetching medication by barcode:', error);
      toast.error('Erreur lors de la recherche du médicament par code-barres.');
    }
  }, [addToCart]);

  const onScanError = useCallback(() => {
    // console.warn(`Code Scan Error = ${_errorMessage}`);
  }, []);

  

  return (
    <div className="relative">
      <MobileNavigation userRole="admin" />
      <div className="p-2 sm:p-4 lg:p-8 lg:pl-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8">Vente Rapide</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:col-span-3">
          <Card className="mb-4 sm:mb-6 lg:mb-8">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-lg sm:text-xl">
                  Médicaments en Stock
                  {Array.isArray(medications) && medications.filter(med => showOutOfStock || med.quantity > 0).length > 0 && (
                    <span className="text-sm font-normal ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {medications.filter(med => showOutOfStock || med.quantity > 0).length} disponible{medications.filter(med => showOutOfStock || med.quantity > 0).length > 1 ? 's' : ''}
                    </span>
                  )}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Barre de recherche et filtres */}
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <div className="relative flex-grow">
                    <Input
                      placeholder="Rechercher un médicament (nom ou code-barres)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-grow pr-10 h-12 text-base"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                        if (e.key === 'Escape') setSearchTerm('');
                      }}
                    />
                    {(isLoading || isTyping) && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setSearchTerm('')} 
                      variant="outline"
                      title="Effacer la recherche"
                      className="h-12 px-4 cursor-pointer"
                    >
                      Effacer
                    </Button>
                    <Button 
                      onClick={() => setIsScannerOpen(true)} 
                      variant="outline" 
                      size="icon"
                      className="h-12 w-12 cursor-pointer"
                    >
                      <Scan className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Résultats de recherche */}
                {searchTerm && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    {isTyping ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Recherche en cours...
                      </span>
                    ) : isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Chargement des résultats...
                      </span>
                    ) : (
                      <span>
                        {medications.length} résultat{medications.length !== 1 ? 's' : ''} trouvé{medications.length !== 1 ? 's' : ''} 
                        pour "{searchTerm}"
                      </span>
                    )}
                  </div>
                )}
                
                {/* Options de tri et filtrage - Version mobile/desktop */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-start sm:items-center">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="sort-select" className="text-sm">Trier par:</Label>
                    <select 
                      id="sort-select"
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'stock')}
                      className="px-3 py-2 border rounded-md text-sm bg-white"
                    >
                      <option value="name">Nom</option>
                      <option value="price">Prix</option>
                      <option value="stock">Stock</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="show-out-of-stock"
                      checked={showOutOfStock}
                      onChange={(e) => setShowOutOfStock(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="show-out-of-stock" className="text-sm">Afficher ruptures de stock</Label>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="text-sm h-9"
                  >
                    Recharger
                  </Button>
                </div>
              </div>

              {/* Liste des médicaments - Tableau uniforme responsive comme dans /ventes */}
              {medications.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  {/* Indicateur de défilement en haut */}
                  {medications.filter(med => showOutOfStock || med.quantity > 0).length > 5 && (
                    <div className="text-xs text-gray-500 text-center py-1 bg-blue-50 border-b">
                      📜 Faites défiler pour voir tous les médicaments
                    </div>
                  )}
                  <div className="overflow-x-auto max-h-[50vh] sm:max-h-[55vh] lg:max-h-[60vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                        <TableRow>
                          <TableHead className="text-sm">Nom</TableHead>
                          <TableHead className="text-sm">Prix</TableHead>
                          <TableHead className="text-sm">Stock</TableHead>
                          <TableHead className="text-sm">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(medications) ? medications
                          .filter(med => showOutOfStock || med.quantity > 0)
                          .sort((a, b) => {
                            if (sortBy === 'name') return a.name.localeCompare(b.name);
                            if (sortBy === 'price') return a.price - b.price;
                            if (sortBy === 'stock') return b.quantity - a.quantity;
                            return 0;
                          })
                          .map((med) => (
                          <TableRow key={med.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-sm">{med.name}</TableCell>
                            <TableCell className="text-green-600 font-semibold text-sm">
                              {formatCurrency(med.price)}
                            </TableCell>
                            <TableCell className="text-sm">
                              <span className={med.quantity <= 0 ? 'text-red-600' : 'text-green-600'}>
                                {med.quantity}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => addToCart(med)}
                                disabled={med.quantity <= 0}
                                size="sm"
                                className="text-xs px-2 py-1 cursor-pointer disabled:cursor-not-allowed"
                              >
                                <PlusCircle className="h-3 w-3 mr-1" />
                                +
                              </Button>
                            </TableCell>
                          </TableRow>
                        )) : []}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? (
                    <div>
                      <p>Aucun médicament trouvé pour "{searchTerm}"</p>
                      <p className="text-sm">Essayez avec un autre terme de recherche</p>
                    </div>
                  ) : (
                    <div>
                      <p>Aucun médicament en stock trouvé</p>
                      <p className="text-sm">Vérifiez les stocks dans la section "Stock"</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-4 lg:mb-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                Panier
                {cart.length > 0 && (
                  <span className="text-sm font-normal bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {cart.length} article{cart.length > 1 ? 's' : ''}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Le panier est vide</p>
                  <p className="text-sm">Ajoutez des médicaments pour commencer une vente</p>
                </div>
              ) : (
                <>
                  {/* Panier - Tableau uniforme responsive */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-sm">Médicament</TableHead>
                          <TableHead className="text-sm">Prix Unit.</TableHead>
                          <TableHead className="text-sm">Quantité</TableHead>
                          <TableHead className="text-sm text-right">Sous-total</TableHead>
                          <TableHead className="text-sm text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.medication.id}>
                            <TableCell className="text-sm">{item.medication.name}</TableCell>
                            <TableCell className="text-sm">
                              {formatCurrency(item.medication.price)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0 cursor-pointer"
                                  onClick={() => updateCartQuantity(item.medication.id, -1)}
                                >
                                  <MinusCircle className="h-3 w-3" />
                                </Button>
                                <span className="mx-1 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0 cursor-pointer"
                                  onClick={() => updateCartQuantity(item.medication.id, 1)}
                                >
                                  <PlusCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold text-green-600">
                              {formatCurrency(item.medication.price * item.quantity)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-6 w-6 p-0 cursor-pointer"
                                onClick={() => removeFromCart(item.medication.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-end items-center text-xl font-bold mb-4">
                      Total: {formatCurrency(totalAmount)}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Finaliser la Vente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Résumé de la vente */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-gray-900">Résumé</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Articles:</span>
                    <span className="font-medium">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Informations client */}
              <div>
                <Label htmlFor="client-name" className="text-sm font-medium">Nom du client (facultatif)</Label>
                <Input
                  id="client-name"
                  placeholder="Nom du client"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1 h-12 text-base"
                />
              </div>

              {/* Boutons d'action */}
              <div className="space-y-3 pt-4">
                <Button 
                  onClick={showInvoicePreviewHandler} 
                  className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  disabled={cart.length === 0}
                  size="lg"
                >
                  <Printer className="mr-2 h-5 w-5" /> 
                  Aperçu Facture & Vente
                </Button>
                <Button 
                  onClick={saveSale} 
                  className="w-full h-12 text-base cursor-pointer" 
                  variant="outline"
                  disabled={cart.length === 0}
                  size="lg"
                >
                  Vente Rapide
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques rapides */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Médicaments disponibles:</span>
                  <span className="font-semibold text-green-600">
                    {Array.isArray(medications) ? medications.filter(m => m.quantity > 0).length : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Stock faible:</span>
                  <span className="font-semibold text-orange-600">
                    {Array.isArray(medications) ? medications.filter(m => m.quantity > 0 && m.quantity <= 10).length : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ruptures de stock:</span>
                  <span className="font-semibold text-red-600">
                    {Array.isArray(medications) ? medications.filter(m => m.quantity === 0).length : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Barcode Scanner Dialog */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scanner un Code-barres</DialogTitle>
          </DialogHeader>
          <BarcodeScanner onScanSuccess={onScanSuccess} onScanError={onScanError} />
        </DialogContent>
      </Dialog>

      {/* Printable Invoice Component (hidden by default) */}
      <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu de la facture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Affichage de la facture */}
            <div className="border rounded-lg p-4 bg-white">
              <PrintableContent ref={printRef} cart={cart} totalAmount={totalAmount} clientName={clientName} />
            </div>
            
            {/* Boutons d'action */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowInvoicePreview(false)}
                className="cursor-pointer"
              >
                Annuler
              </Button>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={() => {
                    // Déclencher l'impression directe (sans enregistrement)
                    const printWindow = window.open('', '_blank');
                    if (printWindow && printRef.current) {
                      const printContent = (printRef.current as HTMLElement).innerHTML || '';
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Facture PAJO PHARMA</title>
                            <style>
                              body { font-family: Arial, sans-serif; margin: 20px; }
                              .print-header { text-align: center; margin-bottom: 20px; }
                              table { width: 100%; border-collapse: collapse; }
                              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                              th { background-color: #f2f2f2; }
                              .total { font-weight: bold; font-size: 18px; }
                              @media print { 
                                body { margin: 0; }
                                .no-print { display: none; }
                              }
                            </style>
                          </head>
                          <body>
                            ${printContent}
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                      printWindow.close();
                      setShowInvoicePreview(false);
                      setShowConfirmSale(true);
                    }
                  }}
                  variant="outline"
                  className="cursor-pointer"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimer directement
                </Button>
                
                <Button 
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Enregistrer PDF
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmSale} onOpenChange={setShowConfirmSale}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la vente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              La facture a été imprimée/enregistrée. Voulez-vous maintenant enregistrer cette vente dans le système ?
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmSale(false)}
                className="cursor-pointer"
              >
                Annuler
              </Button>
              <Button 
                onClick={saveSale}
                className="bg-green-600 hover:bg-green-700 cursor-pointer"
              >
                Confirmer la vente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div style={{ display: 'none' }}>
        <PrintableContent ref={printRef} cart={cart} totalAmount={totalAmount} clientName={clientName} />
      </div>
      </div>
    </div>
  );
}