// Hook optimisé pour les recherches avec mise en cache et debounce
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './use-debounce';

interface SearchCache {
  [key: string]: {
    data: any[];
    timestamp: number;
    expiresAt: number;
  }
}

interface UseOptimizedSearchOptions {
  debounceMs?: number;
  cacheExpiryMs?: number;
  minSearchLength?: number;
}

export function useOptimizedSearch<T = any>(
  searchFn: (query: string) => Promise<T[]>,
  options: UseOptimizedSearchOptions = {}
) {
  const {
    debounceMs = 300,
    cacheExpiryMs = 5 * 60 * 1000, // 5 minutes
    minSearchLength = 1
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedQuery = useDebounce(query, debounceMs);
  const cacheRef = useRef<SearchCache>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fonction pour nettoyer le cache expiré
  const cleanExpiredCache = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;
    
    Object.keys(cache).forEach(key => {
      if (cache[key].expiresAt < now) {
        delete cache[key];
      }
    });
  }, []);

  // Fonction pour obtenir les résultats du cache
  const getCachedResults = useCallback((searchQuery: string): T[] | null => {
    const cache = cacheRef.current;
    const cacheKey = searchQuery.toLowerCase();
    const cached = cache[cacheKey];
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    
    return null;
  }, []);

  // Fonction pour mettre en cache les résultats
  const setCachedResults = useCallback((searchQuery: string, data: T[]) => {
    const cache = cacheRef.current;
    const cacheKey = searchQuery.toLowerCase();
    
    cache[cacheKey] = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + cacheExpiryMs
    };
    
    // Nettoyer le cache si il devient trop grand
    if (Object.keys(cache).length > 50) {
      cleanExpiredCache();
    }
  }, [cacheExpiryMs, cleanExpiredCache]);

  // Effet principal pour la recherche
  useEffect(() => {
    if (debouncedQuery.length < minSearchLength) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Vérifier le cache d'abord
    const cachedResults = getCachedResults(debouncedQuery);
    if (cachedResults) {
      setResults(cachedResults);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau contrôleur d'annulation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const performSearch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const searchResults = await searchFn(debouncedQuery);
        
        // Vérifier si la requête n'a pas été annulée
        if (!abortController.signal.aborted) {
          setResults(searchResults);
          setCachedResults(debouncedQuery, searchResults);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          const errorMessage = err instanceof Error ? err.message : 'Erreur de recherche';
          setError(errorMessage);
          setResults([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    performSearch();

    // Cleanup lors du démontage ou du changement de query
    return () => {
      abortController.abort();
    };
  }, [debouncedQuery, minSearchLength, searchFn, getCachedResults, setCachedResults]);

  // Fonction pour vider le cache
  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  // Fonction pour rafraîchir les résultats (ignorer le cache)
  const refresh = useCallback(async () => {
    if (debouncedQuery.length >= minSearchLength) {
      const cacheKey = debouncedQuery.toLowerCase();
      delete cacheRef.current[cacheKey];
      
      try {
        setIsLoading(true);
        setError(null);
        const searchResults = await searchFn(debouncedQuery);
        setResults(searchResults);
        setCachedResults(debouncedQuery, searchResults);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de recherche';
        setError(errorMessage);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [debouncedQuery, minSearchLength, searchFn, setCachedResults]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearCache,
    refresh,
    cacheSize: Object.keys(cacheRef.current).length
  };
}