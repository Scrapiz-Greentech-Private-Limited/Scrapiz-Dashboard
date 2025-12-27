'use client'

import * as React from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { SortConfig } from "@/hooks/useSearchAndFilter"

interface SortableTableHeaderProps<T> {
  column: keyof T;
  label: string;
  sortConfig: SortConfig<T>;
  onSort: (column: keyof T) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function SortableTableHeader<T>({
  column,
  label,
  sortConfig,
  onSort,
  className = "",
  align = 'left',
}: SortableTableHeaderProps<T>) {
  const isSorted = sortConfig.key === column;
  const direction = isSorted ? sortConfig.direction : null;

  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[align];

  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className={`-ml-3 h-8 data-[state=open]:bg-accent ${alignClass}`}
        onClick={() => onSort(column)}
      >
        <span>{label}</span>
        {direction === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
        {direction === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
        {!direction && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
      </Button>
    </TableHead>
  );
}
