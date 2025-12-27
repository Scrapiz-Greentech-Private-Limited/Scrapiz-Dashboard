'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash2, 
  Users, 
  Search,
  MapPin,
  CheckCircle2,
  XCircle
} from "lucide-react";
import type { ServiceArea } from "@/types/serviceability";

interface AreaTableProps {
  areas: ServiceArea[];
  onEdit: (area: ServiceArea) => void;
  onDelete: (area: ServiceArea) => void;
  onSelect: (area: ServiceArea) => void;
  selectedAreaId?: number;
  isLoading?: boolean;
}

export function AreaTable({
  areas,
  onEdit,
  onDelete,
  onSelect,
  selectedAreaId,
  isLoading = false,
}: AreaTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter areas by search query
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areas;
    
    const query = searchQuery.toLowerCase();
    return areas.filter(area => 
      area.name.toLowerCase().includes(query)
    );
  }, [areas, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  if (areas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No areas found for this pincode.</p>
        <p className="text-sm">Add areas to enable area-wise agent assignment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search areas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Area Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Agents</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAreas.map((area) => (
              <TableRow 
                key={area.id}
                className={`cursor-pointer hover:bg-muted/50 ${
                  selectedAreaId === area.id ? 'bg-green-50' : ''
                }`}
                onClick={() => onSelect(area)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{area.name}</span>
                  </div>
                  {(area.latitude && area.longitude) && (
                    <span className="text-xs text-muted-foreground ml-6">
                      {area.latitude}, {area.longitude}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {area.is_active ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500 border-gray-500">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{area.agent_count}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(area);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(area);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredAreas.length} of {areas.length} areas
      </p>
    </div>
  );
}
