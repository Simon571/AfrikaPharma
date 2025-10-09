// Service de cache avancé pour les APIs
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live en ms
  maxSize?: number; // Nombre maximum d'entrées
  staleWhileRevalidate?: number; // Temps en ms pour servir du contenu périmé pendant la revalidation
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly maxSize = 100;
  private revalidationPromises: Map<string, Promise<any>> = new Map();

  // Générer une clé de cache
  private generateKey(url: string, params?: Record<string, any>): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${url}:${paramStr}`;
  }

  // Nettoyer les entrées expirées et les moins récemment utilisées
  private cleanup(): void {
    const now = Date.now();
    
    // Supprimer les entrées expirées
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }

    // Si on dépasse encore la taille max, supprimer les moins récemment utilisées
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      const toDelete = entries.slice(0, this.cache.size - this.maxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Obtenir une entrée du cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Marquer comme accédé récemment
    entry.lastAccessed = now;
    
    // Vérifier si l'entrée est encore valide
    if (entry.expiresAt > now) {
      return entry.data;
    }

    // Entrée expirée, la supprimer
    this.cache.delete(key);
    return null;
  }

  // Définir une entrée dans le cache
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const now = Date.now();
    const ttl = options.ttl || this.defaultTTL;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    
    // Nettoyer si nécessaire
    if (this.cache.size > (options.maxSize || this.maxSize)) {
      this.cleanup();
    }
  }

  // Vérifier si une entrée existe et n'est pas expirée
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.expiresAt > Date.now()) {
      return true;
    }
    
    this.cache.delete(key);
    return false;
  }

  // Supprimer une entrée
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Vider tout le cache
  clear(): void {
    this.cache.clear();
    this.revalidationPromises.clear();
  }

  // Obtenir des statistiques sur le cache
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const entry of this.cache.values()) {
      if (entry.expiresAt > now) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      revalidationInProgress: this.revalidationPromises.size
    };
  }

  // Méthode pour fetch avec cache automatique
  async fetchWithCache<T>(
    url: string, 
    fetchFn: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    const key = this.generateKey(url);
    
    // Vérifier le cache d'abord
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Vérifier si une revalidation est déjà en cours
    const existingPromise = this.revalidationPromises.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    // Exécuter la requête
    const promise = fetchFn().then(data => {
      this.set(key, data, options);
      this.revalidationPromises.delete(key);
      return data;
    }).catch(error => {
      this.revalidationPromises.delete(key);
      throw error;
    });

    this.revalidationPromises.set(key, promise);
    return promise;
  }

  // Invalider les entrées qui correspondent à un pattern
  invalidatePattern(pattern: RegExp): number {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }
}

// Instance globale du cache
export const apiCache = new APICache();

// Fonctions utilitaires pour les APIs les plus utilisées
export async function getCachedMedications(params?: { search?: string; inStock?: boolean }) {
  const cacheKey = `medications:${JSON.stringify(params || {})}`;
  
  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append('search', params.search);
      if (params?.inStock) searchParams.append('inStock', 'true');
      
      const url = `/api/medications${searchParams.toString() ? '?' + searchParams : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response.json();
    },
    { ttl: 2 * 60 * 1000 } // 2 minutes pour les médicaments
  );
}

export async function getCachedSales(dateRange?: { startDate?: string; endDate?: string }) {
  const cacheKey = `sales:${JSON.stringify(dateRange || {})}`;
  
  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      const searchParams = new URLSearchParams();
      if (dateRange?.startDate) searchParams.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) searchParams.append('endDate', dateRange.endDate);
      
      const url = `/api/sales${searchParams.toString() ? '?' + searchParams : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response.json();
    },
    { ttl: 1 * 60 * 1000 } // 1 minute pour les ventes
  );
}

// Invalider le cache lors de modifications
export function invalidateMedicationsCache() {
  apiCache.invalidatePattern(/^medications:/);
}

export function invalidateSalesCache() {
  apiCache.invalidatePattern(/^sales:/);
}