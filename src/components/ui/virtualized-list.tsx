// Composant de liste virtualisée pour optimiser l'affichage de gros datasets
import React, { useState, useEffect, useRef, useMemo } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
  overscan?: number; // Nombre d'éléments à rendre en plus hors de la vue
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  className = '',
  overscan = 5
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculer les indices visibles
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    
    const startIdx = Math.max(0, start - overscan);
    const endIdx = Math.min(items.length, start + visibleCount + overscan);
    
    return {
      startIndex: startIdx,
      endIndex: endIdx,
      visibleItems: items.slice(startIdx, endIdx)
    };
  }, [scrollTop, itemHeight, containerHeight, items, overscan]);

  // Hauteur totale virtuelle
  const totalHeight = items.length * itemHeight;

  // Offset pour positionner correctement les éléments visibles
  const offsetY = startIndex * itemHeight;

  // Gestionnaire de scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Auto-scroll quand les items changent (par exemple après une recherche)
  useEffect(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Conteneur virtuel pour maintenir la hauteur de scroll */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Conteneur des éléments visibles */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <div
                key={keyExtractor(item, actualIndex)}
                style={{ height: itemHeight }}
                className="flex items-center"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hook pour utiliser la virtualisation avec recherche
interface UseVirtualizedSearchResult<T> {
  VirtualizedSearchList: React.ComponentType<{
    className?: string;
    itemHeight?: number;
    containerHeight?: number;
  }>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredItems: T[];
  isLoading: boolean;
}

export function useVirtualizedSearch<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean,
  keyExtractor: (item: T, index: number) => string | number,
  renderItem: (item: T, index: number) => React.ReactNode,
  debounceMs: number = 300
): UseVirtualizedSearchResult<T> {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Debounce de la recherche
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsLoading(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  // Filtrer les items
  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return items;
    }
    
    return items.filter(item => searchFn(item, debouncedQuery));
  }, [items, debouncedQuery, searchFn]);

  // Composant de liste virtualisée
  const VirtualizedSearchList = useMemo(() =>
    ({ className, itemHeight = 60, containerHeight = 400 }: { className?: string; itemHeight?: number; containerHeight?: number }) => (
      <VirtualizedList
        items={filteredItems}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        className={className}
      />
    ), [filteredItems, renderItem, keyExtractor]
  );

  return {
    VirtualizedSearchList,
    searchQuery,
    setSearchQuery,
    filteredItems,
    isLoading
  };
}

// Composant spécialisé pour les médicaments
interface MedicationItemProps {
  medication: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    pharmaceuticalForm: string;
  };
  onSelect?: (medication: any) => void;
}

export function MedicationVirtualItem({ medication, onSelect }: MedicationItemProps) {
  return (
    <div 
      className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b"
      onClick={() => onSelect?.(medication)}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{medication.name}</p>
        <p className="text-sm text-gray-500">{medication.pharmaceuticalForm}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">{medication.price.toFixed(2)}€</p>
        <p className="text-sm text-gray-500">Stock: {medication.quantity}</p>
      </div>
    </div>
  );
}