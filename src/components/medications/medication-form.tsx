
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Medication } from '@prisma/client';

const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  pharmaceuticalForm: z.string().min(1, 'La forme pharmaceutique est requise'),
  purchasePrice: z.number().min(0, 'Le prix d\'achat doit être positif'),
  price: z.number().min(0, 'Le prix doit être positif'),
  quantity: z.number().int().min(0, 'La quantité doit être un entier positif'),
  expirationDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Date invalide' }),
  barcode: z.string().min(1, 'Le code-barres est requis'),
  isAvailableForSale: z.boolean().default(true),
  stockStatus: z.enum(['en stock', 'en rupture']).default('en stock'),
});

interface MedicationFormProps {
  onSubmit: (data: z.input<typeof formSchema>) => void;
  medication: Medication | null;
}

export function MedicationForm({ onSubmit, medication }: MedicationFormProps) {
  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: medication?.name || '',
      pharmaceuticalForm: medication?.pharmaceuticalForm || '',
      purchasePrice: medication?.purchasePrice || 0,
      price: medication?.price || 0,
      quantity: medication?.quantity || 0,
      expirationDate: medication?.expirationDate
        ? new Date(medication.expirationDate).toISOString().split('T')[0]
        : '',
      barcode: medication?.barcode || '',
      isAvailableForSale: medication?.isAvailableForSale ?? true,
      stockStatus: (medication?.stockStatus as 'en stock' | 'en rupture') || 'en stock',
    },
  });

  const handleSubmit = (values: z.input<typeof formSchema>) => {
    onSubmit({ 
      ...values, 
      expirationDate: values.expirationDate ? new Date(values.expirationDate).toISOString() : '',
      purchasePrice: Number(values.purchasePrice), // Explicitly cast to number
      price: Number(values.price), // Explicitly cast to number
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4"
>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Nom du médicament" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pharmaceuticalForm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forme pharmaceutique</FormLabel>
              <FormControl>
                <Input placeholder="Comprimé, Sirop, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="purchasePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prix d&apos;achat</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Prix d&apos;achat" {...field} value={field.value as number | ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prix</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Prix" {...field} value={field.value as number | ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantité</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Quantité" {...field} value={field.value as number | ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expirationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date d&apos;expiration</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="barcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code-barres</FormLabel>
              <FormControl>
                <Input placeholder="Code-barres" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isAvailableForSale"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="mt-2"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Disponible à la vente
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stockStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut du Stock</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => field.onChange('en stock')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                      field.value === 'en stock'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ✅ En stock
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange('en rupture')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                      field.value === 'en rupture'
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    🔴 Rupture
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Enregistrer</Button>
      </form>
    </Form>
  );
}
