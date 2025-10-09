import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

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

interface PrintableContentProps {
  cart: CartItem[];
  totalAmount: number;
  clientName: string;
}

const PrintableContent = React.forwardRef<HTMLDivElement, PrintableContentProps>(
  ({ cart, totalAmount, clientName }, ref) => {
    const [invoiceNumber, setInvoiceNumber] = useState('FCT-...'); // Valeur par défaut pour l'hydratation
    const [invoiceDate, setInvoiceDate] = useState('--/--/----');
    const [saleTime, setSaleTime] = useState('--:--:--');

    // Générer les valeurs côté client uniquement pour éviter l'erreur d'hydratation
    useEffect(() => {
      const date = new Date();
      const year = date.getFullYear();
      const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 0).getTime()) / 1000 / 60 / 60 / 24);
      const randomNum = Math.floor(Math.random() * 10000);
      const generatedInvoiceNumber = `FCT-${year}-${String(dayOfYear).padStart(3, '0')}${String(randomNum).padStart(4, '0')}`;
      
      setInvoiceNumber(generatedInvoiceNumber);
      setInvoiceDate(date.toLocaleDateString("fr-FR"));
      setSaleTime(date.toLocaleTimeString("fr-FR"));
    }, []);

    return (
      <div ref={ref} className="max-w-4xl mx-auto bg-white p-6 print:p-8 print:max-w-none print:mx-0">
        {/* En-tête de la facture */}
        <div className="border-b-2 border-gray-300 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-blue-800 mb-2">FACTURE</h1>
              <div className="text-sm">
                <p className="text-xl font-bold text-blue-600 mb-1">PAJO PHARMA</p>
                <p className="text-gray-700">1365 Avenue Kabambar, Barumbu, Kinshasa</p>
                <p className="text-gray-700">Tél: +243823030774</p>
                <p className="text-gray-700">Email: contact@pajopharma.cd</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print:bg-gray-50 print:border-gray-300">
                <p className="text-sm font-medium text-gray-600">Numéro de Facture</p>
                <p className="text-xl font-bold text-blue-800">{invoiceNumber}</p>
                <p className="text-sm font-medium text-gray-600 mt-2">Date d'émission</p>
                <p className="text-lg font-semibold text-gray-800">{invoiceDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informations client et vendeur */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4 print:bg-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-2">FACTURÉ À</h3>
            <p className="text-lg font-semibold text-gray-900">{clientName || 'Client Anonyme'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 print:bg-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-2">INFORMATIONS</h3>
            <p><span className="font-semibold">Vendeur:</span> Admin</p>
            <p><span className="font-semibold">Heure d'émission:</span> {saleTime}</p>
          </div>
        </div>

        {/* Détails des produits */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-200 pb-2">DÉTAILS DES PRODUITS</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="border border-blue-700 px-4 py-3 text-left font-semibold">N°</th>
                  <th className="border border-blue-700 px-4 py-3 text-left font-semibold">Médicament</th>
                  <th className="border border-blue-700 px-4 py-3 text-center font-semibold">Quantité</th>
                  <th className="border border-blue-700 px-4 py-3 text-right font-semibold">Prix Unitaire</th>
                  <th className="border border-blue-700 px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={item.medication.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="border border-gray-300 px-4 py-3 text-center font-medium">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">{item.medication.name}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">{formatCurrency(item.medication.price)}</td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-semibold">{formatCurrency(item.medication.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section Total */}
        <div className="border-t-2 border-gray-300 pt-6 mb-8">
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white rounded-lg p-6 min-w-64">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">TOTAL À PAYER:</span>
                <span className="text-2xl font-bold">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Remarques */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 print:bg-gray-50 print:border-gray-400">
          <h4 className="font-bold text-gray-800 mb-2">Remarques:</h4>
          <p className="text-gray-700">Merci d'avoir choisi PAJO PHARMA pour vos soins de santé.</p>
        </div>

        {/* Pied de page */}
        <div className="border-t border-gray-300 pt-6 text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 print:text-black">
            <div>
              <p className="font-semibold mb-2">Conditions générales:</p>
              <p>• Cette facture est générée par un système agréé.</p>
              <p>• Elle fait foi de preuve d'achat.</p>
              <p>• Certains médicaments nécessitent une prescription médicale.</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Informations importantes:</p>
              <p>• Conservez cette facture pour votre dossier médical.</p>
              <p>• En cas de question, contactez-nous au +243 970 000 000.</p>
              <p>• Merci de votre confiance en PAJO PHARMA.</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 print:text-black">
              Document généré automatiquement le {invoiceDate} à {saleTime} - PAJO PHARMA © 2025
            </p>
          </div>
        </div>
      </div>
    );
  }
);

PrintableContent.displayName = 'PrintableContent';

export default PrintableContent;
