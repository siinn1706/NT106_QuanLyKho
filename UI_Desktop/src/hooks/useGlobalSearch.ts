/** useGlobalSearch.ts - Global search hook */

import { useState, useCallback } from 'react';
import { 
  apiGetItems, 
  apiGetSuppliers, 
  apiGetWarehouses,
  apiGetStockInRecords,
  apiGetStockOutRecords,
  Item,
  Supplier,
  Warehouse,
  StockInRecord,
  StockOutRecord,
} from '../app/api_client';

export interface SearchResult {
  type: 'item' | 'supplier' | 'warehouse' | 'stock_in' | 'stock_out';
  id: string | number;
  title: string;
  subtitle?: string;
  route: string;
}

export function useGlobalSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchTerm = query.toLowerCase().trim();
      const allResults: SearchResult[] = [];

      // Search items
      try {
        const items = await apiGetItems();
        items.forEach((item: Item) => {
          const matches = 
            item.name.toLowerCase().includes(searchTerm) ||
            item.sku.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm);
          
          if (matches) {
            allResults.push({
              type: 'item',
              id: item.id,
              title: item.name,
              subtitle: `SKU: ${item.sku} | ${item.quantity} ${item.unit}`,
              route: `/items`,
            });
          }
        });
      } catch (e) {
        console.error('Search items error:', e);
      }

      // Search suppliers
      try {
        const suppliers = await apiGetSuppliers();
        suppliers.forEach((supplier: Supplier) => {
          const matches = 
            supplier.name.toLowerCase().includes(searchTerm) ||
            supplier.tax_id.toLowerCase().includes(searchTerm) ||
            supplier.phone.toLowerCase().includes(searchTerm);
          
          if (matches) {
            allResults.push({
              type: 'supplier',
              id: supplier.id,
              title: supplier.name,
              subtitle: supplier.phone || supplier.tax_id,
              route: `/suppliers`,
            });
          }
        });
      } catch (e) {
        console.error('Search suppliers error:', e);
      }

      // Search warehouses
      try {
        const warehouses = await apiGetWarehouses();
        warehouses.forEach((warehouse: Warehouse) => {
          const matches = 
            warehouse.name.toLowerCase().includes(searchTerm) ||
            warehouse.code.toLowerCase().includes(searchTerm) ||
            warehouse.address.toLowerCase().includes(searchTerm);
          
          if (matches) {
            allResults.push({
              type: 'warehouse',
              id: warehouse.id,
              title: `${warehouse.code} - ${warehouse.name}`,
              subtitle: warehouse.address,
              route: `/warehouses`,
            });
          }
        });
      } catch (e) {
        console.error('Search warehouses error:', e);
      }

      // Search stock in records
      try {
        const stockInRecords = await apiGetStockInRecords();
        stockInRecords.forEach((record: StockInRecord) => {
          const matches = 
            record.id.toLowerCase().includes(searchTerm) ||
            record.supplier.toLowerCase().includes(searchTerm);
          
          if (matches) {
            allResults.push({
              type: 'stock_in',
              id: record.id,
              title: `Phiếu nhập: ${record.id}`,
              subtitle: `${record.supplier} | ${record.total_quantity} sản phẩm`,
              route: `/stock/in`,
            });
          }
        });
      } catch (e) {
        console.error('Search stock in error:', e);
      }

      // Search stock out records
      try {
        const stockOutRecords = await apiGetStockOutRecords();
        stockOutRecords.forEach((record: StockOutRecord) => {
          const matches = 
            record.id.toLowerCase().includes(searchTerm) ||
            record.recipient.toLowerCase().includes(searchTerm) ||
            record.purpose.toLowerCase().includes(searchTerm);
          
          if (matches) {
            allResults.push({
              type: 'stock_out',
              id: record.id,
              title: `Phiếu xuất: ${record.id}`,
              subtitle: `${record.recipient} | ${record.purpose}`,
              route: `/stock/out`,
            });
          }
        });
      } catch (e) {
        console.error('Search stock out error:', e);
      }

      setResults(allResults.slice(0, 20)); // Limit to 20 results
    } catch (error) {
      console.error('Global search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { search, results, isSearching };
}

