"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createSale } from "@/lib/actions/sales";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function FactureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items: cartItems, clearCart, updateItemQuantity } = useCartStore();
  const { data: session } = useSession();

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [sellerName, setSellerName] = useState("Nom du Vendeur");
  const [clientName, setClientName] = useState("");
  const [saleTime, setSaleTime] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    const initialClientName = searchParams.get("clientName");
    if (initialClientName) setClientName(initialClientName);

    if (session?.user?.name) {
      setSellerName(session.user.name);
    }

    const date = new Date();
    const year = date.getFullYear();
    const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const randomNum = Math.floor(Math.random() * 10000);
    setInvoiceNumber(`FCT-${year}-${String(dayOfYear).padStart(3, '0')}${String(randomNum).padStart(4, '0')}`);

    setInvoiceDate(date.toLocaleDateString("fr-FR"));
    setSaleTime(date.toLocaleTimeString("fr-FR"));
  }, [searchParams, session]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantityInCart, 0);

  const handleFinalizeSale = async () => {
    if (!session) {
      toast.error("Vous devez être connecté pour finaliser la vente.");
      return;
    }

    try {
      await createSale(
        clientName,
        0, // additionalFees
        0, // discount
        remarks,
        cartItems.map(item => ({ 
          medicationId: item.id, 
          quantity: item.quantityInCart, 
          priceAtSale: item.price 
        })),
        subtotal, // totalAmount
        subtotal, // amountPaid
        0, // changeDue
        "Espèces" // paymentMethod
      );

      toast.success("Vente enregistrée avec succès et facture générée!");
      clearCart();
      window.print();
      try {
        await Promise.allSettled([
          fetch('/api/daily-report', { cache: 'no-store' }),
          fetch('/api/sales?today=true', { cache: 'no-store' })
        ]);
      } catch (_) {}
      setTimeout(() => {
        router.push("/seller-dashboard");
      }, 500);

    } catch (error) {
      console.error("Error finalizing sale:", error);
      toast.error("Erreur lors de la finalisation de la vente.");
    }
  };

  return (
    <div className="container mx-auto p-4 print:p-0">
      <Card className="print:border-none print:shadow-none">
        <CardHeader className="text-center print:text-left">
          <CardTitle className="text-2xl font-bold">FACTURE</CardTitle>
          <div className="text-sm mt-2">
            <p><strong>PAJO PHARMA</strong></p>
            <p>12e Rue Industrielle, Limete, Kinshasa</p>
            <p>+243 970 000 000</p>
            <p>✉️ contact@pajopharma.cd</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p><strong>Numéro de Facture:</strong> {invoiceNumber}</p>
              <p><strong>Date:</strong> {invoiceDate}</p>
              <p><strong>Vendeur:</strong> {sellerName}</p>
            </div>
            <div>
              <Label htmlFor="clientName">Nom du client</Label>
              <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm font-medium text-gray-700">Heure de sortie de la facture:</p>
                <p className="text-lg font-bold text-blue-600">{saleTime}</p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold mb-3">Détails des Produits</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Médicament</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead className="text-right">Prix Unitaire (CDF)</TableHead>
                <TableHead className="text-right">Total (CDF)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantityInCart}
                      onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-20"
                      min="1"
                    />
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price * item.quantityInCart)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 text-right">
            <p className="text-xl font-bold">Total: {formatCurrency(subtotal)}</p>
          </div>

          <div className="mt-6">
            <Label htmlFor="remarks">Remarques</Label>
            <Textarea 
              id="remarks" 
              value={remarks} 
              onChange={(e) => setRemarks(e.target.value)} 
              placeholder="Merci d'avoir choisi PAJO PHARMA." 
            />
          </div>

          <div className="mt-6 text-sm text-gray-600 print:text-black">
            <p>Cette facture est générée par un système agréé. Elle fait foi de preuve d'achat.</p>
            <p>Certains médicaments peuvent nécessiter une prescription. Conservez cette facture pour votre dossier médical.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 mt-6 print:hidden">
        <Button onClick={handleFinalizeSale}>Finaliser la Vente & Imprimer</Button>
      </div>
    </div>
  );
}