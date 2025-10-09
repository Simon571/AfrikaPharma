export interface SaleItemData {
  medicationId: string;
  medicationName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CreateSaleData {
  clientName: string;
  additionalFees: number;
  discount: number;
  remarks: string;
  items: SaleItemData[];
}

export interface StockMovement {
  id: string;
  medicationId: string;
  type: 'entry' | 'exit';
  quantity: number;
  unitCost?: number | null;
  notes?: string | null;
  createdAt: Date;
  medication: {
    name: string;
    barcode?: string | null;
  };
}

export interface MedicationWithStats {
  id: string;
  name: string;
  barcode?: string | null;
  salePrice: number;
  currentStock: number;
  minStock: number;
  category?: string | null;
  description?: string | null;
  totalSold: number;
  revenue: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterParams {
  search?: string;
  category?: string;
  type?: 'entry' | 'exit';
  grouped?: boolean;
  page?: number;
  limit?: number;
}