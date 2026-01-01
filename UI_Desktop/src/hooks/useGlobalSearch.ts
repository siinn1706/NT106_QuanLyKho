/** useGlobalSearch.ts - Global search hook with server-side search, debounce & caching */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiGlobalSearch, GlobalSearchResponse } from '../app/api_client';

export interface SearchResult {
  type: 'item' | 'supplier' | 'warehouse' | 'stock_in' | 'stock_out';
  id: string | number;
  title: string;
  subtitle?: string;
  route: string;
}

// Cache configuration
const CACHE_TTL = 60000; // 1 minute cache
const DEBOUNCE_DELAY = 300; // 300ms debounce

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry>();

// Helper to map API response to SearchResult
function mapToSearchResults(response: GlobalSearchResponse): SearchResult[] {
  const results: SearchResult[] = [];
  
  // Map items
  response.items?.forEach(item => {
    results.push({
      type: 'item',
      id: item.id,
      title: item.name,
      subtitle: `SKU: ${item.sku} | ${item.quantity} ${item.unit}`,
      route: '/items',
    });
  });
  
  // Map suppliers
  response.suppliers?.forEach(supplier => {
    results.push({
      type: 'supplier',
      id: supplier.id,
      title: supplier.name,
      subtitle: supplier.phone || supplier.tax_id,
      route: '/suppliers',
    });
  });
  
  // Map warehouses
  response.warehouses?.forEach(warehouse => {
    results.push({
      type: 'warehouse',
      id: warehouse.id,
      title: `${warehouse.code} - ${warehouse.name}`,
      subtitle: warehouse.address,
      route: '/warehouses',
    });
  });
  
  // Map stock_in records
  response.stock_in?.forEach(record => {
    results.push({
      type: 'stock_in',
      id: record.id,
      title: `Phiếu nhập: ${record.id}`,
      subtitle: `${record.supplier} | ${record.total_quantity} sản phẩm`,
      route: '/stock/in',
    });
  });
  
  // Map stock_out records
  response.stock_out?.forEach(record => {
    results.push({
      type: 'stock_out',
      id: record.id,
      title: `Phiếu xuất: ${record.id}`,
      subtitle: `${record.recipient} | ${record.purpose}`,
      route: '/stock/out',
    });
  });
  
  return results;
}

export function useGlobalSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const debounceTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const search = useCallback(async (query: string) => {
    const trimmedQuery = query.trim().toLowerCase();
    
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (!trimmedQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    // Check cache first
    const cached = searchCache.get(trimmedQuery);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setResults(cached.results);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Debounced search
    debounceTimerRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();
      
      try {
        const response = await apiGlobalSearch(trimmedQuery, 20);
        const mappedResults = mapToSearchResults(response);
        
        // Update cache
        searchCache.set(trimmedQuery, {
          results: mappedResults,
          timestamp: Date.now(),
        });
        
        // Clean old cache entries
        const now = Date.now();
        searchCache.forEach((entry, key) => {
          if (now - entry.timestamp > CACHE_TTL) {
            searchCache.delete(key);
          }
        });
        
        setResults(mappedResults);
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Global search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_DELAY);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return { search, results, isSearching, clearResults };
}

