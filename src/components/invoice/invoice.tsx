
import { forwardRef } from 'react';
import { Sale, SaleItem, Medication } from '@prisma/client';

interface InvoiceProps {
  sale: Sale & { items: (SaleItem & { medication: Medication })[]; client: { name: string } };
}

export const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(({ sale }, ref) => {
  return (
    <div ref={ref} className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">PAJO PHARMA</h1>
          <p>Merci pour votre visite!</p>
        </div>
        <div>
          <p>Facture #{sale.id.slice(0, 8)}</p>
          <p>Date: {new Date(sale.date).toLocaleString()}</p>
        </div>
      </div>
      <div>
        <p className="font-bold">Client: {sale.client.name}</p>
      </div>
      <table className="w-full mt-4">
        <thead>
          <tr>
            <th className="text-left">Médicament</th>
            <th className="text-right">Quantité</th>
            <th className="text-right">Prix unitaire</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item) => (
            <tr key={item.id}>
              <td>{item.medication.name}</td>
              <td className="text-right">{item.quantity}</td>
              <td className="text-right">{item.priceAtSale} CDF</td>
              <td className="text-right">{(item.quantity * item.priceAtSale)} CDF</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-8 text-right">
        <p className="text-2xl font-bold">Total: {sale.totalAmount} CDF</p>
      </div>
    </div>
  );
});

Invoice.displayName = 'Invoice';
