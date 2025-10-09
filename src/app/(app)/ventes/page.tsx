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
  price: number;
  quantity: number;
  barcode: string;
}

interface CartItem {
  medication: Medication;
  quantity: number;
}

export default function VentesPage() {
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
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  const loadMedications = useCallback(async (searchQuery: string = '') => {
    setIsLoading(true);
    try {
      const data = await fetchMedications({ search: searchQuery.trim() });
      if (Array.isArray(data)) {
        setMedications(data);
      } else {
        console.error('Invalid data format received:', data);
        setMedications([]);
      }
    } catch (error) {
      console.error('Error loading medications:', error);
      toast.error('Erreur lors du chargement des médicaments');
      setMedications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedications(debouncedSearchTerm);
  }, [debouncedSearchTerm, loadMedications]);

  const addToCart = useCallback((medication: Medication) => {
    if (medication.quantity <= 0) {
      toast.error('Ce médicament est en rupture de stock');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.medication.id === medication.id);
      if (existingItem) {
        if (existingItem.quantity >= medication.quantity) {
          toast.error('Stock insuffisant');
          return prevCart;
        }
        const updatedCart = prevCart.map(item =>
          item.medication.id === medication.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        toast.success(`${medication.name} ajouté au panier`);
        return updatedCart;
      } else {
        toast.success(`${medication.name} ajouté au panier`);
        return [...prevCart, { medication, quantity: 1 }];
      }
    });
  }, []);

  const updateCartQuantity = useCallback((medicationId: string, newQuantity: number) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.medication.id !== medicationId);
      }
      
      return prevCart.map(item => {
        if (item.medication.id === medicationId) {
          if (newQuantity > item.medication.quantity) {
            toast.error('Stock insuffisant');
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  }, []);

  const removeFromCart = useCallback((medicationId: string) => {
    setCart(prevCart => prevCart.filter(item => item.medication.id !== medicationId));
    toast.success('Article retiré du panier');
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    toast.success('Panier vidé');
  }, []);

  const totalAmount = cart.reduce((total, item) => total + (item.medication.price * item.quantity), 0);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Facture-${new Date().toISOString().split('T')[0]}`,
    onAfterPrint: () => {
      setShowInvoicePreview(false);
      toast.success('Facture imprimée/enregistrée avec succès!');
    },
  });

  const showInvoicePreviewHandler = () => {
    if (cart.length === 0) {
      toast.error('Le panier est vide. Impossible de générer une facture.');
      return;
    }
    setShowInvoicePreview(true);
  };

  const completeSale = useCallback(async () => {
    if (cart.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    try {
      const saleData = {
        clientName: clientName || 'Client',
        items: cart.map(item => ({
          medicationId: item.medication.id,
          quantity: item.quantity,
          unitPrice: item.medication.price
        })),
        totalAmount
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la vente');
      }

      toast.success('Vente effectuée avec succès !');
      setCart([]);
      setClientName('');
      
      // Recharger les médicaments pour mettre à jour les stocks
      await loadMedications(debouncedSearchTerm);
      
      // Imprimer automatiquement
      setTimeout(() => {
        handlePrint();
      }, 500);
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.error('Erreur lors de la vente');
    }
  }, [cart, clientName, totalAmount, loadMedications, debouncedSearchTerm, handlePrint]);

  const openScanner = useCallback(() => {
    setIsScannerOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsScannerOpen(false);
  }, []);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    try {
      const response = await fetch(`/api/medications/barcode/${decodedText}`);
      if (response.ok) {
        const medication = await response.json();
        if (medication) {
          addToCart(medication);
          closeScanner();
          toast.success(`Médicament trouvé: ${medication.name}`);
        } else {
          toast.error('Aucun médicament trouvé avec ce code-barres');
        }
      } else {
        toast.error('Erreur lors de la recherche du médicament');
      }
    } catch (error) {
      console.error('Error fetching medication by barcode:', error);
      toast.error('Erreur lors de la recherche du médicament par code-barres.');
    }
  }, [addToCart, closeScanner]);

  const onScanError = useCallback(() => {
    // console.warn(`Code Scan Error = ${_errorMessage}`);
  }, []);

  const filteredAndSortedMedications = medications
    .filter(m => {
      // Filtrage par stock si nécessaire
      if (!showOutOfStock && m.quantity <= 0) return false;
      
      // Filtrage côté client par terme de recherche (backup)
      if (searchTerm && searchTerm.length > 0) {
        const searchLower = searchTerm.toLowerCase();
        return m.name.toLowerCase().includes(searchLower) || 
               (m.barcode && m.barcode.toLowerCase().includes(searchLower));
      }
      
      return true;
    })
    // Déduplication des vrais doublons (même nom + même prix + même stock)
    .filter((medication, index, array) => {
      const duplicateIndex = array.findIndex(m => 
        m.name === medication.name && 
        m.price === medication.price && 
        m.quantity === medication.quantity
      );
      return duplicateIndex === index; // Garder seulement la première occurrence
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price - b.price;
        case 'stock':
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });

  return (
    <div className="relative">
      <MobileNavigation userRole="seller" />
      <div className="container mx-auto p-2 sm:p-4 lg:p-6 lg:pl-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Interface de Vente</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Recherchez et vendez des médicaments</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
        {/* Section de recherche et liste des médicaments */}
        <div className="lg:col-span-2 space-y-3 lg:space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-lg">
                  Recherche de Médicaments 
                  {filteredAndSortedMedications.length > 0 && (
                    <span className="text-sm font-normal ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {filteredAndSortedMedications.length} disponible{filteredAndSortedMedications.length > 1 ? 's' : ''}
                    </span>
                  )}
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={openScanner} size="sm" variant="outline" className="h-8 sm:h-9 cursor-pointer">
                    <Scan className="h-4 w-4 mr-1" />
                    Scanner
                  </Button>
                  <Button
                    onClick={() => setShowOutOfStock(!showOutOfStock)}
                    size="sm"
                    variant={showOutOfStock ? "default" : "outline"}
                    className="h-8 sm:h-9 cursor-pointer"
                  >
                    {showOutOfStock ? 'Masquer' : 'Afficher'} ruptures
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Rechercher par nom ou code-barres..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-sm sm:text-base"
                  />
                  {(isLoading || isTyping) && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'stock')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base min-w-[120px]"
                >
                  <option value="name">Nom</option>
                  <option value="price">Prix</option>
                  <option value="stock">Stock</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Table Responsive pour tous les écrans avec hauteur fixe et défilement */}
          <Card>
            <CardContent className="p-0 relative">
              {/* Message de confirmation des modifications */}
              <div className="text-xs text-white text-center py-1 bg-green-600 border-b">
                ✅ MODIFICATIONS APPLIQUÉES - Interface tableau optimisée
              </div>
              {/* Indicateur de défilement en haut */}
              {filteredAndSortedMedications.length > 5 && (
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
                    {filteredAndSortedMedications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          {isLoading ? 'Chargement...' : 'Aucun médicament trouvé'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedMedications.map((medication) => (
                        <TableRow key={medication.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-sm">{medication.name}</TableCell>
                          <TableCell className="text-green-600 font-semibold text-sm">
                            {formatCurrency(medication.price)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className={medication.quantity <= 0 ? 'text-red-600' : 'text-green-600'}>
                              {medication.quantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => addToCart(medication)}
                              disabled={medication.quantity <= 0}
                              size="sm"
                              className="text-xs px-2 py-1 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <PlusCircle className="h-3 w-3 mr-1" />
                              +
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Panier */}
        <div className="space-y-3 lg:space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Panier ({cart.length})
                </span>
                {cart.length > 0 && (
                  <Button onClick={clearCart} variant="outline" size="sm" className="h-8 text-xs cursor-pointer">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Vider
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">Le panier est vide</p>
              ) : (
                <>
                  <div className="space-y-2 max-h-[35vh] sm:max-h-[40vh] lg:max-h-[45vh] overflow-y-auto border rounded-md p-2 bg-gray-50">
                    {cart.map((item) => (
                      <div key={item.medication.id} className="border rounded-lg p-2 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-xs sm:text-sm leading-tight truncate">
                              {item.medication.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(item.medication.price)} x {item.quantity}
                            </p>
                          </div>
                          <Button
                            onClick={() => removeFromCart(item.medication.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-1 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Button
                              onClick={() => updateCartQuantity(item.medication.id, item.quantity - 1)}
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0 cursor-pointer"
                            >
                              <MinusCircle className="h-3 w-3" />
                            </Button>
                            <span className="font-medium text-sm min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              onClick={() => updateCartQuantity(item.medication.id, item.quantity + 1)}
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0 cursor-pointer disabled:cursor-not-allowed"
                              disabled={item.quantity >= item.medication.quantity}
                            >
                              <PlusCircle className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-semibold text-green-600 text-sm">
                            {formatCurrency(item.medication.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 space-y-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(totalAmount)}</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientName" className="text-sm">Nom du client (optionnel)</Label>
                      <Input
                        id="clientName"
                        type="text"
                        placeholder="Nom du client..."
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Button onClick={completeSale} className="w-full text-sm cursor-pointer">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Finaliser la vente
                      </Button>
                      <Button onClick={showInvoicePreviewHandler} variant="outline" className="w-full text-sm cursor-pointer">
                        <Printer className="h-4 w-4 mr-2" />
                        Aperçu & Impression
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
                      toast.success('Facture imprimée avec succès!');
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

      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scanner un code-barres</DialogTitle>
          </DialogHeader>
          <BarcodeScanner onScanSuccess={onScanSuccess} onScanError={onScanError} />
        </DialogContent>
      </Dialog>

      <div style={{ display: 'none' }}>
        <PrintableContent ref={printRef} cart={cart} totalAmount={totalAmount} clientName={clientName} />
      </div>
      </div>
    </div>
  );
}