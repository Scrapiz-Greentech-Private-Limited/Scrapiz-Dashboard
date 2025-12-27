import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export interface FilterConfig {
  [key: string]: string | string[] | boolean | number | null;
}

export interface SearchAndFilterConfig<T> {
  data: T[];
  searchFields: (keyof T)[];
  initialFilters?: FilterConfig;
  initialSort?: SortConfig<T>;
}

export interface SearchAndFilterResult<T> {
  filteredData: T[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: FilterConfig;
  setFilter: (key: string, value: string | string[] | boolean | number | null) => void;
  resetFilters: () => void;
  sortConfig: SortConfig<T>;
  setSortConfig: (config: SortConfig<T>) => void;
  toggleSort: (key: keyof T) => void;
  totalCount: number;
  filteredCount: number;
}

/**
 * Custom hook for implementing search, filtering, and sorting functionality
 * Maintains state across pagination and provides a clean API for table components
 */
export function useSearchAndFilter<T extends Record<string, any>>({
  data,
  searchFields,
  initialFilters = {},
  initialSort = { key: null, direction: null },
}: SearchAndFilterConfig<T>): SearchAndFilterResult<T> {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterConfig>(initialFilters);
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(initialSort);

  // Set a specific filter
  const setFilter = useCallback((key: string, value: string | string[] | boolean | number | null) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchQuery('');
  }, [initialFilters]);

  // Toggle sort direction for a column
  const toggleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => {
      if (prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key: null, direction: null };
    });
  }, []);

  // Apply search, filters, and sorting
  const filteredData = useMemo(() => {
    // Handle undefined/null data (before API returns)
    if (!data || !Array.isArray(data)) {
      return [];
    }
    let result = [...data];

    // Apply search
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        return searchFields.some(field => {
          const value = item[field];
          if (value == null) return false;
          
          // Handle nested objects (e.g., user.email)
          if (typeof value === 'object' && !Array.isArray(value)) {
            return Object.values(value).some(v => 
              String(v).toLowerCase().includes(lowercaseQuery)
            );
          }
          
          return String(value).toLowerCase().includes(lowercaseQuery);
        });
      });
    }

    // Apply filters (AND logic)
    Object.entries(filters).forEach(([key, value]) => {
      if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
        return; // Skip empty filters
      }

      result = result.filter(item => {
        const itemValue = item[key];

        // Handle array filters (e.g., multiple categories selected)
        if (Array.isArray(value)) {
          if (Array.isArray(itemValue)) {
            // Check if any of the item's values match any of the filter values
            return value.some(v => itemValue.includes(v));
          }
          // Check if the item's value is in the filter array
          return value.includes(itemValue);
        }

        // Handle boolean filters
        if (typeof value === 'boolean') {
          return itemValue === value;
        }

        // Handle string/number filters
        return itemValue === value;
      });
    });

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

        // Handle nested objects
        const aCompare = typeof aValue === 'object' && !Array.isArray(aValue) 
          ? JSON.stringify(aValue) 
          : aValue;
        const bCompare = typeof bValue === 'object' && !Array.isArray(bValue)
          ? JSON.stringify(bValue)
          : bValue;

        // Compare values
        if (aCompare < bCompare) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aCompare > bCompare) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, searchFields, filters, sortConfig]);

  return {
    filteredData,
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    resetFilters,
    sortConfig,
    setSortConfig,
    toggleSort,
    totalCount: data?.length ?? 0,
    filteredCount: filteredData.length,
  };
}
