
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getMedications, createMedication, updateMedication, deleteMedication } from '@/lib/actions/medications';
import { Medication } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/store/cart';
import { formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MedicationForm } from './medication-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, ShoppingCart } from 'lucide-react';

export function MedicationsList() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { addItem } = useCartStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  
  // Check if user is admin
  const isAdmin = session?.user?.role === 'admin';

  // Fonction pour charger les médicaments avec recherche
  const fetchMedications = async (search?: string) => {
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (search && search.trim()) {
        searchParams.append('search', search.trim());
      }
      
      // Utiliser /api/medications/admin pour les admins (voir TOUS les médicaments)
      const url = `/api/medications/admin${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        // Vérifier si la réponse est un array ou un objet avec medications
        const medicationsData = Array.isArray(data) ? data : (data.medications || []);
        setMedications(medicationsData);
      } else {
        console.error('Erreur lors du chargement des médicaments');
        setMedications([]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMedications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications(searchTerm);
  }, [searchTerm]);

  // Debounce pour éviter trop de requêtes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchMedications(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Pas besoin de filtrage côté client maintenant
  const filteredMedications = medications.sort((a, b) => a.name.localeCompare(b.name));

  const handleAddToCart = (medication: Medication) => {
    if (medication.quantity <= 0) {
      toast.error(`${medication.name} est en rupture de stock`);
      return;
    }
    addItem(medication, 1);
    toast.success(`${medication.name} ajouté au panier!`, {
      description: `Allez à la page vente pour finaliser`
    });
    // Rediriger vers la page vente après une courte pause
    setTimeout(() => {
      router.push('/sell');
    }, 500);
  };

  const handleFormSubmit = async (data: any) => {
    const medicationData = {
      ...data,
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
      purchasePrice: Number(data.purchasePrice),
      price: Number(data.price),
      isAvailableForSale: false, // Default to false when adding/editing from this form
      stockStatus: data.stockStatus ?? (Number(data.quantity) > 0 ? 'en stock' : 'en rupture'),
    };

    if (selectedMedication) {
      await updateMedication(selectedMedication.id, medicationData);
      toast.success('Médicament mis à jour avec succès!');
    } else {
      await createMedication(medicationData);
      toast.success('Médicament ajouté avec succès!');
    }
    
    // Recharger les médicaments
    await fetchMedications(searchTerm);
    setIsDialogOpen(false);
    setSelectedMedication(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce médicament ?')) {
      await deleteMedication(id);
      toast.success('Médicament supprimé avec succès!');
      // Recharger les médicaments
      await fetchMedications(searchTerm);
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      toast.error('Veuillez saisir une liste de médicaments');
      return;
    }

    try {
      const lines = importText.split('\n').filter(line => line.trim());
      let successCount = 0;
      let errorCount = 0;

      for (const line of lines) {
        try {
          // Format attendu: "Nom | Forme | Prix d'achat | Prix de vente | Quantité | Date d'expiration"
          const parts = line.split('|').map(part => part.trim());
          
          if (parts.length >= 6) {
            const [name, pharmaceuticalForm, purchasePrice, price, quantity, expirationDate] = parts;
            
            // Validation basique
            if (name && pharmaceuticalForm && !isNaN(Number(purchasePrice)) && 
                !isNaN(Number(price)) && !isNaN(Number(quantity))) {
              
              const medicationData = {
                name,
                pharmaceuticalForm,
                purchasePrice: Number(purchasePrice),
                price: Number(price),
                quantity: Number(quantity),
                expirationDate: expirationDate ? new Date(expirationDate) : null,
                barcode: '', // Optionnel
                isAvailableForSale: false,
                stockStatus: Number(quantity) > 0 ? 'en stock' : 'en rupture',
              };

              await createMedication(medicationData);
              successCount++;
            } else {
              errorCount++;
              console.warn(`Ligne ignorée (données invalides): ${line}`);
            }
          } else {
            errorCount++;
            console.warn(`Ligne ignorée (format incorrect): ${line}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Erreur lors de l'ajout du médicament: ${line}`, error);
        }
      }

      // Recharger les médicaments
      await fetchMedications(searchTerm);
      setIsImportDialogOpen(false);
      setImportText('');
      
      if (successCount > 0) {
        toast.success(`${successCount} médicament(s) importé(s) avec succès!`);
      }
      if (errorCount > 0) {
        toast.warning(`${errorCount} ligne(s) ignorée(s) (format incorrect ou données invalides)`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast.error('Erreur lors de l\'import des médicaments');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Rechercher un médicament par nom ou code-barres..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        {isAdmin && (
          <div className="flex items-center space-x-2">
            {/* Bouton d'import */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>Importer</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Importer une liste de médicaments</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Format requis : <code>Nom | Forme | Prix d'achat | Prix de vente | Quantité | Date d'expiration</code>
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Exemple : <code>Paracétamol | Comprimé | 100 | 150 | 50 | 2025-12-31</code>
                    </p>
                  </div>
                  <Textarea
                    placeholder="Collez votre liste de médicaments ici..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} className="cursor-pointer">
                      Annuler
                    </Button>
                    <Button onClick={handleImport} className="cursor-pointer">
                      Importer les médicaments
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Bouton d'ajout simple */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedMedication(null)} className="cursor-pointer">
                  Ajouter un médicament
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedMedication ? 'Modifier le médicament' : 'Ajouter un médicament'}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                  <MedicationForm onSubmit={handleFormSubmit} medication={selectedMedication} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Prix d&apos;achat</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Date d&apos;expiration</TableHead>
            <TableHead>Statut Stock</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMedications.map((medication) => (
            <TableRow key={medication.id} className={medication.quantity === 0 || medication.price === 0 ? 'bg-yellow-50' : ''}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{medication.name}</span>
                  {medication.price === 0 && <span className="text-xs text-orange-600">⚠️ Pas de prix</span>}
                </div>
              </TableCell>
              <TableCell>{formatCurrency(medication.purchasePrice)}</TableCell>
              <TableCell>
                <span className={medication.price === 0 ? 'text-orange-600 font-semibold' : ''}>
                  {formatCurrency(medication.price)}
                  {medication.price === 0 && ' ❌'}
                </span>
              </TableCell>
              <TableCell>
                {medication.stockStatus === 'en rupture' ? (
                  <span className="text-red-600 font-semibold">00</span>
                ) : (
                  <span className={medication.quantity === 0 ? 'text-red-600 font-semibold' : ''}>
                    {medication.quantity}
                    {medication.quantity === 0 && ' ❌'}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {medication.expirationDate ? new Date(medication.expirationDate).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  medication.stockStatus === 'en rupture' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {medication.stockStatus === 'en rupture' ? '🔴 Rupture' : '✅ En stock'}
                </span>
              </TableCell>
              <TableCell>
              <Button 
                onClick={() => handleAddToCart(medication)} 
                className="cursor-pointer flex items-center gap-2"
                size="sm"
                disabled={medication.quantity === 0 || medication.price === 0}
                variant={medication.quantity === 0 || medication.price === 0 ? 'outline' : 'default'}
              >
                <ShoppingCart className="h-4 w-4" />
                Ajouter au panier
              </Button>
              {isAdmin && (
                <>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedMedication(medication); setIsDialogOpen(true); }} className="ml-2 cursor-pointer">Modifier</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(medication.id)} className="ml-2 cursor-pointer">Supprimer</Button>
                </>
              )}
            </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
