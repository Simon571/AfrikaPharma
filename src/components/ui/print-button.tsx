'use client';

import React, { useRef, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  children?: ReactNode;
  contentRef?: React.RefObject<HTMLElement | null>;
  title?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function PrintButton({ 
  children, 
  contentRef, 
  title = 'Rapport AfrikaPharma',
  className = '',
  variant = 'outline',
  size = 'default'
}: PrintButtonProps) {
  
  const handlePrint = () => {
    // Si une référence de contenu est fournie, imprimer ce contenu spécifique
    if (contentRef?.current) {
      const printContent = contentRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${title}</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  padding: 20px;
                  color: #333;
                  line-height: 1.6;
                }
                .print-header {
                  text-align: center;
                  margin-bottom: 30px;
                  padding-bottom: 15px;
                  border-bottom: 2px solid #2563eb;
                }
                .print-header h1 {
                  color: #2563eb;
                  font-size: 24px;
                  margin-bottom: 5px;
                }
                .print-header p {
                  color: #666;
                  font-size: 12px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 15px 0;
                }
                th, td {
                  border: 1px solid #ddd;
                  padding: 10px 8px;
                  text-align: left;
                  font-size: 12px;
                }
                th {
                  background-color: #2563eb;
                  color: white;
                  font-weight: 600;
                }
                tr:nth-child(even) {
                  background-color: #f9fafb;
                }
                tr:hover {
                  background-color: #f3f4f6;
                }
                .card {
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  padding: 15px;
                  margin-bottom: 15px;
                  background: white;
                }
                .card-title {
                  font-size: 16px;
                  font-weight: 600;
                  color: #1f2937;
                  margin-bottom: 10px;
                  padding-bottom: 8px;
                  border-bottom: 1px solid #e5e7eb;
                }
                .stat-card {
                  display: inline-block;
                  padding: 15px;
                  margin: 5px;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  min-width: 150px;
                  text-align: center;
                }
                .stat-value {
                  font-size: 24px;
                  font-weight: bold;
                  color: #2563eb;
                }
                .stat-label {
                  font-size: 12px;
                  color: #666;
                }
                .text-green {
                  color: #16a34a;
                }
                .text-red {
                  color: #dc2626;
                }
                .text-blue {
                  color: #2563eb;
                }
                .text-orange {
                  color: #ea580c;
                }
                .badge {
                  display: inline-block;
                  padding: 2px 8px;
                  border-radius: 9999px;
                  font-size: 11px;
                  font-weight: 500;
                }
                .badge-green {
                  background-color: #dcfce7;
                  color: #166534;
                }
                .badge-red {
                  background-color: #fee2e2;
                  color: #991b1b;
                }
                .print-footer {
                  margin-top: 30px;
                  padding-top: 15px;
                  border-top: 1px solid #e5e7eb;
                  text-align: center;
                  font-size: 11px;
                  color: #666;
                }
                /* Masquer les boutons et éléments interactifs */
                button, .no-print, [data-no-print] {
                  display: none !important;
                }
                @media print {
                  body {
                    padding: 10px;
                  }
                  .page-break {
                    page-break-before: always;
                  }
                }
              </style>
            </head>
            <body>
              <div class="print-header">
                <h1>🏥 AfrikaPharma</h1>
                <p>1365 Avenue Kabambar, Barumbu, Kinshasa | Tél: +243823030774</p>
                <p style="margin-top: 10px; font-size: 14px; font-weight: 600;">${title}</p>
                <p>Généré le ${new Date().toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              ${printContent}
              <div class="print-footer">
                <p>Document généré automatiquement par AfrikaPharma © ${new Date().getFullYear()}</p>
                <p>Ce document est confidentiel et destiné à un usage interne uniquement.</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    } else {
      // Sinon, imprimer la page entière
      window.print();
    }
  };

  return (
    <Button 
      onClick={handlePrint} 
      variant={variant}
      size={size}
      className={`cursor-pointer ${className}`}
    >
      <Printer className="h-4 w-4 mr-2" />
      {children || 'Imprimer'}
    </Button>
  );
}

export default PrintButton;
