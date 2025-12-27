'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Users,
  RefreshCw,
  MoreVertical,
  UserPlus,
} from "lucide-react";
import { ServiceabilityService } from "@/services/serviceability";
import { AreaFormDialog } from "./AreaFormDialog";
import { AreaAgentAssignmentDialog } from "./AreaAgentAssignmentDialog";
import type { ServiceablePincode, ServiceArea, CreateAreaRequest, UpdateAreaRequest } from "@/types/serviceability";
import { showError, showSuccess } from "@/lib/toast-helpers";

interface AreasManagementDialogProps {
  open: boolean;
  pincode: ServiceablePincode | null;
  onClose: () => void;
  onAreasChanged?: () => void;
}

export function AreasManagementDialog({
  open,
  pincode,
  onClose,
  onAreasChanged,
}: AreasManagementDialogProps) {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedArea, setSelectedArea] = useState<ServiceArea | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<ServiceArea | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Agent assignment dialog state
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [selectedAreaForAgents, setSelectedAreaForAgents] = useState<ServiceArea | null>(null);

  const fetchAreas = useCallback(async () => {
    if (!pincode) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await ServiceabilityService.getAreas({ pincode: pincode.id });
      setAreas(response.results);
    } catch (err: any) {
      setError(err.message || 'Failed to load areas');
    } finally {
      setLoading(false);
    }
  }, [pincode]);

  useEffect(() => {
    if (open && pincode) {
      fetchAreas();
    }
  }, [open, pincode, fetchAreas]);

  const handleAddArea = () => {
    setFormMode('create');
    setSelectedArea(undefined);
    setFormDialogOpen(true);
  };

  const handleEditArea = (area: ServiceArea) => {
    setFormMode('edit');
    setSelectedArea(area);
    setFormDialogOpen(true);
  };

  const handleDeleteArea = (area: ServiceArea) => {
    setAreaToDelete(area);
    setDeleteDialogOpen(true);
  };

  const handleAssignAgents = (area: ServiceArea) => {
    setSelectedAreaForAgents(area);
    setAgentDialogOpen(true);
  };

  const handleFormSubmit = async (data: CreateAreaRequest | UpdateAreaRequest, mode: 'create' | 'edit') => {
    setIsSubmitting(true);
    
    try {
      if (mode === 'create') {
        await ServiceabilityService.createArea(data as CreateAreaRequest);
        showSuccess('Area created successfully');
      } else if (selectedArea) {
        await ServiceabilityService.updateArea(selectedArea.id, data as UpdateAreaRequest);
        showSuccess('Area updated successfully');
      }
      
      setFormDialogOpen(false);
      await fetchAreas();
      onAreasChanged?.();
    } catch (err: any) {
      showError(err.message || 'Failed to save area');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!areaToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await ServiceabilityService.deleteArea(areaToDelete.id);
      showSuccess(`Area "${areaToDelete.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setAreaToDelete(null);
      await fetchAreas();
      onAreasChanged?.();
    } catch (err: any) {
      showError(err.message || 'Failed to delete area');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!pincode) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Manage Areas - {pincode.pincode}
            </DialogTitle>
            <DialogDescription>
              Add and manage multiple areas/localities under pincode {pincode.pincode} ({pincode.city_name})
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {/* Header with Add button */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {areas.length} area{areas.length !== 1 ? 's' : ''} in this pincode
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchAreas} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button size="sm" onClick={handleAddArea} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Area
                </Button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <AreasTableSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <XCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-lg font-medium text-destructive">Error Loading Areas</p>
                <p className="text-muted-foreground mt-1">{error}</p>
                <Button variant="outline" onClick={fetchAreas} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : areas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No Areas Yet</p>
                <p className="text-muted-foreground mt-1 max-w-sm">
                  Add specific areas/localities under this pincode to better organize your service coverage.
                </p>
                <Button onClick={handleAddArea} className="mt-4 bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Area
                </Button>
              </div>
            ) : (
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
                    {areas.map((area) => (
                      <TableRow key={area.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-purple-600" />
                            {area.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {area.is_active ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            {area.agent_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleAssignAgents(area)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign Agents
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditArea(area)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteArea(area)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Area Form Dialog */}
      <AreaFormDialog
        open={formDialogOpen}
        mode={formMode}
        area={selectedArea}
        pincodeId={pincode.id}
        pincodeName={pincode.pincode}
        onClose={() => setFormDialogOpen(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Area</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the area "{areaToDelete?.name}"?
              {areaToDelete && areaToDelete.agent_count > 0 && (
                <span className="block mt-2 text-amber-600 font-medium">
                  ⚠️ This area has {areaToDelete.agent_count} assigned agent{areaToDelete.agent_count !== 1 ? 's' : ''}.
                  They will be unassigned from this area.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Area Agent Assignment Dialog */}
      <AreaAgentAssignmentDialog
        open={agentDialogOpen}
        area={selectedAreaForAgents}
        onClose={() => {
          setAgentDialogOpen(false);
          setSelectedAreaForAgents(null);
        }}
        onAgentsChanged={() => {
          fetchAreas();
          onAreasChanged?.();
        }}
      />
    </>
  );
}

function AreasTableSkeleton() {
  return (
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
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-6 w-16" /></TableCell>
              <TableCell className="text-center"><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
