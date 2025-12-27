'use client'

import * as React from "react"
import { X, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FilterConfig } from "@/hooks/useSearchAndFilter"

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  type?: 'checkbox' | 'radio';
}

interface AdvancedFiltersProps {
  filterGroups: FilterGroup[];
  filters: FilterConfig;
  onFilterChange: (key: string, value: string | string[] | boolean | number | null) => void;
  onResetFilters: () => void;
}

export function AdvancedFilters({
  filterGroups,
  filters,
  onFilterChange,
  onResetFilters,
}: AdvancedFiltersProps) {
  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([_, value]) => {
    if (value == null || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }).length;

  // Get active filter labels for display
  const getActiveFilterLabels = () => {
    const labels: { key: string; label: string; value: string }[] = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
        return;
      }

      const group = filterGroups.find(g => g.key === key);
      if (!group) return;

      if (Array.isArray(value)) {
        value.forEach(v => {
          const option = group.options.find(o => o.value === v);
          if (option) {
            labels.push({
              key,
              label: group.label,
              value: option.label,
            });
          }
        });
      } else {
        const option = group.options.find(o => o.value === value);
        if (option) {
          labels.push({
            key,
            label: group.label,
            value: option.label,
          });
        }
      }
    });

    return labels;
  };

  const activeLabels = getActiveFilterLabels();

  const handleCheckboxChange = (key: string, value: string, checked: boolean) => {
    const currentValue = filters[key];
    const currentArray = Array.isArray(currentValue) ? currentValue : [];

    if (checked) {
      onFilterChange(key, [...currentArray, value]);
    } else {
      onFilterChange(key, currentArray.filter(v => v !== value));
    }
  };

  const removeFilter = (key: string, value: string) => {
    const currentValue = filters[key];
    if (Array.isArray(currentValue)) {
      const newValue = currentValue.filter(v => v !== value);
      onFilterChange(key, newValue.length > 0 ? newValue : null);
    } else {
      onFilterChange(key, null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1">
              <Filter className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Filters
              </span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 rounded-full px-1 min-w-[1.25rem] h-5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {filterGroups.map((group, index) => (
              <React.Fragment key={group.key}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-xs font-semibold">
                  {group.label}
                </DropdownMenuLabel>
                {group.options.map(option => {
                  const currentValue = filters[group.key];
                  const isChecked = Array.isArray(currentValue)
                    ? currentValue.includes(option.value)
                    : currentValue === option.value;

                  return (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (group.type === 'radio') {
                          onFilterChange(group.key, checked ? option.value : null);
                        } else {
                          handleCheckboxChange(group.key, option.value, checked);
                        }
                      }}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </React.Fragment>
            ))}
            {activeFilterCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    onClick={onResetFilters}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {activeLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeLabels.map((filter, index) => (
            <Badge
              key={`${filter.key}-${filter.value}-${index}`}
              variant="secondary"
              className="gap-1"
            >
              <span className="text-xs font-normal text-muted-foreground">
                {filter.label}:
              </span>
              <span className="text-xs">{filter.value}</span>
              <button
                onClick={() => removeFilter(filter.key, filter.value)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
