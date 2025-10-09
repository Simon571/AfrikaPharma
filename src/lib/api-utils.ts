// Utilitaire pour les appels API avec gestion d'authentification
import { toast } from 'sonner';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  needsAuth?: boolean;
}

export async function fetchWithAuth<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    
    // Vérifier le statut HTTP d'abord
    if (!res.ok) {
      if (res.status === 401) {
        return {
          success: false,
          error: 'Session expirée. Veuillez vous reconnecter.',
          needsAuth: true
        };
      }
      throw new Error(`Erreur HTTP ${res.status}`);
    }
    
    const data = await res.json();
    
    // Vérifier si c'est une erreur d'authentification
    if (data.message === 'Unauthorized') {
      return {
        success: false,
        error: 'Session expirée. Veuillez vous reconnecter.',
        needsAuth: true
      };
    }
    
    return {
      success: true,
      data
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      error: errorMessage
    };
  }
}

export function handleAuthError(redirectPath: string = '/login-admin') {
  toast.error('Session expirée. Redirection vers la connexion...');
  setTimeout(() => {
    window.location.href = redirectPath;
  }, 2000);
}

export async function fetchMedications(params?: { search?: string; inStock?: boolean }) {
  const searchParams = new URLSearchParams();
  
  if (params?.search) {
    searchParams.append('search', params.search);
  }
  
  if (params?.inStock) {
    searchParams.append('inStock', 'true');
  }
  
  const url = `/api/medications${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  
  const response = await fetchWithAuth<any[]>(url);
  
  if (!response.success) {
    if (response.needsAuth) {
      handleAuthError();
      return [];
    }
    toast.error(response.error || 'Erreur lors de la récupération des médicaments');
    return [];
  }
  
  // Vérifier que les données sont un array
  if (!Array.isArray(response.data)) {
    console.error('API response is not an array:', response.data);
    toast.error('Format de données invalide');
    return [];
  }
  
  return response.data;
}