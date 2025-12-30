'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Map, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw,
  AlertCircle,
  Building2,
  Globe,
  Compass,
  Users
} from "lucide-react";
import { ServiceabilityService } from "@/services/serviceability";
import { AgentService } from "@/services/agent";
import type { AgentStats } from "@/types/agent";
import { CityFormDialog } from "@/components/dashboard/CityFormDialog";
import { DeleteCityDialog } from "@/components/dashboard/DeleteCityDialog";
import { PincodeTable } from "@/components/dashboard/PincodeTable";
import { PincodeFormDialog } from "@/components/dashboard/PincodeFormDialog";
import { DeletePincodeDialog } from "@/components/dashboard/DeletePincodeDialog";
import { AgentAssignmentPanel } from "@/components/dashboard/AgentAssignmentPanel";
import { AssignAgentDialog } from "@/components/dashboard/AssignAgentDialog";
import { RemoveAgentDialog } from "@/components/dashboard/RemoveAgentDialog";
import { MapViewDialog } from "@/components/dashboard/MapViewDialog";
import { AreasManagementDialog } from "@/components/dashboard/AreasManagementDialog";
import type { AgentListItem, Agent } from "@/types/agent";
import type { 
  ServiceableCity, 
  ServiceablePincode,
  CityStatus,
  LoadingState,
  ErrorState,
  CityFormDialogState,
  PincodeFormDialogState,
  AssignAgentDialogState,
  ConfirmDialogState,
  CreateCityRequest,
  UpdateCityRequest,
  CreatePincodeRequest,
  UpdatePincodeRequest,
} from "@/types/serviceability";
import { showError, showSuccess, showInfo } from "@/lib/toast-helpers";

/**
 * ServiceAreasPage - Main page for managing service areas
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 13.1, 13.2, 13.3, 13.4, 13.5
 */
export default function ServiceAreasPage() {
  // ==========================================================================
  // State Management - Task 6.1
  // ==========================================================================
  
  // Data state
  const [cities, setCities] = useState<ServiceableCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<ServiceableCity | null>(null);
  const [pincodes, setPincodes] = useState<ServiceablePincode[]>([]);
  const [selectedPincode, setSelectedPincode] = useState<ServiceablePincode | null>(null);
  
  // Loading state
  const [loading, setLoading] = useState<LoadingState>({
    cities: true,
    pincodes: false,
    agents: false,
    submit: false,
  });
  
  // Error state
  const [error, setError] = useState<ErrorState>({
    cities: null,
    pincodes: null,
    agents: null,
    submit: null,
  });
  
  // Dialog states (for future tasks)
  const [cityFormDialog, setCityFormDialog] = useState<CityFormDialogState>({
    open: false,
    mode: 'create',
  });
  const [pincodeFormDialog, setPincodeFormDialog] = useState<PincodeFormDialogState>({
    open: false,
    mode: 'create',
  });
  const [assignAgentDialog, setAssignAgentDialog] = useState<AssignAgentDialogState>({
    open: false,
  });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    type: 'delete-city',
  });
  
  // Filter and search state - Task 6.4
  const [statusFilter, setStatusFilter] = useState<'all' | CityStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pincode search state - Task 9.5
  const [pincodeSearchQuery, setPincodeSearchQuery] = useState('');
  
  // Agent assignment state - Task 11
  const [assignedAgents, setAssignedAgents] = useState<AgentListItem[]>([]);
  const [agentToRemove, setAgentToRemove] = useState<AgentListItem | null>(null);
  const [removeAgentDialogOpen, setRemoveAgentDialogOpen] = useState(false);
  const [agentPanelKey, setAgentPanelKey] = useState(0); // Used to force refresh
  
  // Agent statistics state - Task 13.1
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [loadingAgentStats, setLoadingAgentStats] = useState(true);
  
  // Map view dialog state - Task 13.5
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  
  // Areas management dialog state
  const [areasDialogOpen, setAreasDialogOpen] = useState(false);
  const [areasDialogPincode, setAreasDialogPincode] = useState<ServiceablePincode | null>(null);
  
  // Refs to prevent duplicate API calls
  const hasFetchedInitially = useRef(false);
  const isFetchingCities = useRef(false);
  const isFetchingPincodes = useRef(false);

  // ==========================================================================
  // API Calls
  // ==========================================================================
  
  /**
   * Fetch cities from API
   * Requirements: 1.1, 1.3
   */
  const fetchCities = useCallback(async () => {
    if (isFetchingCities.current) return;
    
    isFetchingCities.current = true;
    setLoading(prev => ({ ...prev, cities: true }));
    setError(prev => ({ ...prev, cities: null }));
    
    try {
      const params: { status?: CityStatus; search?: string } = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      const response = await ServiceabilityService.getCities(params);
      setCities(response.results);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load cities';
      setError(prev => ({ ...prev, cities: errorMessage }));
      showError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, cities: false }));
      isFetchingCities.current = false;
    }
  }, [statusFilter, searchQuery]);

  /**
   * Fetch pincodes for selected city
   * Requirements: 5.1
   */
  const fetchPincodes = useCallback(async (cityId: number) => {
    if (isFetchingPincodes.current) return;
    
    isFetchingPincodes.current = true;
    setLoading(prev => ({ ...prev, pincodes: true }));
    setError(prev => ({ ...prev, pincodes: null }));
    
    try {
      const response = await ServiceabilityService.getPincodes({ city: cityId });
      setPincodes(response.results);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load pincodes';
      setError(prev => ({ ...prev, pincodes: errorMessage }));
      showError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, pincodes: false }));
      isFetchingPincodes.current = false;
    }
  }, []);

  /**
   * Fetch agent statistics
   * Requirements: 12.1, 12.2
   */
  const fetchAgentStats = useCallback(async () => {
    setLoadingAgentStats(true);
    try {
      const stats = await AgentService.getStats();
      setAgentStats(stats);
    } catch (err: any) {
      // Silently fail for stats - not critical
      console.error('Failed to load agent stats:', err);
    } finally {
      setLoadingAgentStats(false);
    }
  }, []);

  // ==========================================================================
  // Effects
  // ==========================================================================
  
  // Initial data fetch
  useEffect(() => {
    if (hasFetchedInitially.current) return;
    hasFetchedInitially.current = true;
    fetchCities();
    fetchAgentStats();
  }, [fetchCities, fetchAgentStats]);

  // Refetch cities when filters change
  useEffect(() => {
    if (!hasFetchedInitially.current) return;
    fetchCities();
  }, [statusFilter, searchQuery, fetchCities]);

  // Fetch pincodes when city is selected
  useEffect(() => {
    if (selectedCity) {
      fetchPincodes(selectedCity.id);
    } else {
      setPincodes([]);
      setSelectedPincode(null);
    }
  }, [selectedCity, fetchPincodes]);

  // ==========================================================================
  // Event Handlers
  // ==========================================================================
  
  const handleRefresh = useCallback(() => {
    fetchCities();
    fetchAgentStats();
    if (selectedCity) {
      fetchPincodes(selectedCity.id);
    }
  }, [fetchCities, fetchAgentStats, fetchPincodes, selectedCity]);

  const handleCitySelect = (city: ServiceableCity) => {
    setSelectedCity(city);
    setSelectedPincode(null);
  };

  const handleAddCity = () => {
    setCityFormDialog({ open: true, mode: 'create' });
  };

  const handleEditCity = (city: ServiceableCity) => {
    setCityFormDialog({ open: true, mode: 'edit', data: city });
  };

  const handleDeleteCity = (city: ServiceableCity) => {
    setConfirmDialog({ open: true, type: 'delete-city', data: city });
  };

  const handleCloseCityFormDialog = () => {
    setCityFormDialog({ open: false, mode: 'create' });
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ open: false, type: 'delete-city' });
  };

  /**
   * Handle city form submission (create or update)
   * Requirements: 2.2, 2.6, 3.2, 3.3
   */
  const handleCityFormSubmit = async (
    data: CreateCityRequest | UpdateCityRequest, 
    mode: 'create' | 'edit'
  ) => {
    setLoading(prev => ({ ...prev, submit: true }));
    setError(prev => ({ ...prev, submit: null }));

    try {
      if (mode === 'create') {
        // Create new city - Requirements: 2.2
        await ServiceabilityService.createCity(data as CreateCityRequest);
        showSuccess('City created successfully');
      } else if (cityFormDialog.data) {
        // Update existing city - Requirements: 3.2
        await ServiceabilityService.updateCity(cityFormDialog.data.id, data as UpdateCityRequest);
        showSuccess('City updated successfully');
        
        // Update selected city if it was the one being edited
        if (selectedCity?.id === cityFormDialog.data.id) {
          const updatedCity = await ServiceabilityService.getCity(cityFormDialog.data.id);
          setSelectedCity(updatedCity);
        }
      }

      // Close dialog and refresh list - Requirements: 2.6, 3.3
      handleCloseCityFormDialog();
      await fetchCities();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save city';
      setError(prev => ({ ...prev, submit: errorMessage }));
      showError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  /**
   * Handle city deletion confirmation
   * Requirements: 4.3, 4.4, 4.5
   */
  const handleConfirmDeleteCity = async () => {
    const cityToDelete = confirmDialog.data as ServiceableCity;
    if (!cityToDelete) return;

    setLoading(prev => ({ ...prev, submit: true }));
    setError(prev => ({ ...prev, submit: null }));

    try {
      // Delete city - Requirements: 4.3
      await ServiceabilityService.deleteCity(cityToDelete.id);
      
      // Show success message - Requirements: 4.4
      showSuccess(`City "${cityToDelete.name}" deleted successfully`);
      
      // Clear selection if deleted city was selected
      if (selectedCity?.id === cityToDelete.id) {
        setSelectedCity(null);
        setPincodes([]);
      }

      // Close dialog and refresh list
      handleCloseConfirmDialog();
      await fetchCities();
    } catch (err: any) {
      // Show error message - Requirements: 4.5
      const errorMessage = err.message || 'Failed to delete city';
      setError(prev => ({ ...prev, submit: errorMessage }));
      showError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  /**
   * Handle opening the map view dialog
   * Requirements: 14.1, 14.4
   */
  const handleViewMap = () => {
    setMapDialogOpen(true);
  };

  const handleCloseMapDialog = () => {
    setMapDialogOpen(false);
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
  };

  // ==========================================================================
  // Pincode Event Handlers - Task 9
  // ==========================================================================

  const handlePincodeSelect = (pincode: ServiceablePincode) => {
    setSelectedPincode(pincode);
  };

  const handleAddPincode = () => {
    setPincodeFormDialog({ open: true, mode: 'create' });
  };

  const handleEditPincode = (pincode: ServiceablePincode) => {
    setPincodeFormDialog({ open: true, mode: 'edit', data: pincode });
  };

  const handleDeletePincode = (pincode: ServiceablePincode) => {
    setConfirmDialog({ open: true, type: 'delete-pincode', data: pincode });
  };

  const handleManageAreas = (pincode: ServiceablePincode) => {
    setAreasDialogPincode(pincode);
    setAreasDialogOpen(true);
  };

  const handleCloseAreasDialog = () => {
    setAreasDialogOpen(false);
    setAreasDialogPincode(null);
  };

  const handleAreasChanged = async () => {
    // Refresh pincodes to update area counts
    if (selectedCity) {
      await fetchPincodes(selectedCity.id);
    }
  };

  const handleClosePincodeFormDialog = () => {
    setPincodeFormDialog({ open: false, mode: 'create' });
  };

  /**
   * Handle pincode form submission (create or update)
   * Requirements: 6.2, 6.5, 6.6, 7.2, 7.3
   */
  const handlePincodeFormSubmit = async (
    data: CreatePincodeRequest | UpdatePincodeRequest,
    mode: 'create' | 'edit'
  ) => {
    setLoading(prev => ({ ...prev, submit: true }));
    setError(prev => ({ ...prev, submit: null }));

    try {
      if (mode === 'create') {
        // Create new pincode - Requirements: 6.2
        await ServiceabilityService.createPincode(data as CreatePincodeRequest);
        showSuccess('Pincode created successfully');
      } else if (pincodeFormDialog.data) {
        // Update existing pincode - Requirements: 7.2
        await ServiceabilityService.updatePincode(pincodeFormDialog.data.id, data as UpdatePincodeRequest);
        showSuccess('Pincode updated successfully');
      }

      // Close dialog and refresh list - Requirements: 6.6, 7.3
      handleClosePincodeFormDialog();
      if (selectedCity) {
        await fetchPincodes(selectedCity.id);
      }
      // Also refresh cities to update pincode counts
      await fetchCities();
    } catch (err: any) {
      // Handle duplicate pincode error - Requirements: 6.5
      const errorMessage = err.message || 'Failed to save pincode';
      setError(prev => ({ ...prev, submit: errorMessage }));
      showError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  /**
   * Handle pincode deletion confirmation
   * Requirements: 8.3, 8.4
   */
  const handleConfirmDeletePincode = async () => {
    const pincodeToDelete = confirmDialog.data as ServiceablePincode;
    if (!pincodeToDelete) return;

    setLoading(prev => ({ ...prev, submit: true }));
    setError(prev => ({ ...prev, submit: null }));

    try {
      // Delete pincode - Requirements: 8.3
      await ServiceabilityService.deletePincode(pincodeToDelete.id);
      
      // Show success message - Requirements: 8.4
      showSuccess(`Pincode "${pincodeToDelete.pincode}" deleted successfully`);
      
      // Clear selection if deleted pincode was selected
      if (selectedPincode?.id === pincodeToDelete.id) {
        setSelectedPincode(null);
      }

      // Close dialog and refresh list
      handleCloseConfirmDialog();
      if (selectedCity) {
        await fetchPincodes(selectedCity.id);
      }
      // Also refresh cities to update pincode counts
      await fetchCities();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete pincode';
      setError(prev => ({ ...prev, submit: errorMessage }));
      showError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const handleClearPincodeSearch = () => {
    setPincodeSearchQuery('');
  };

  // ==========================================================================
  // Agent Assignment Event Handlers - Task 11
  // ==========================================================================

  /**
   * Fetch agents assigned to the selected pincode
   * Requirements: 9.1
   */
  const fetchAssignedAgents = useCallback(async () => {
    if (!selectedPincode) {
      setAssignedAgents([]);
      return;
    }

    setLoading(prev => ({ ...prev, agents: true }));
    setError(prev => ({ ...prev, agents: null }));

    try {
      const agents = await ServiceabilityService.getAgentsForPincode(selectedPincode.id);
      setAssignedAgents(agents);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load agents';
      setError(prev => ({ ...prev, agents: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, agents: false }));
    }
  }, [selectedPincode]);

  // Fetch agents when pincode is selected
  useEffect(() => {
    if (selectedPincode) {
      fetchAssignedAgents();
    } else {
      setAssignedAgents([]);
    }
  }, [selectedPincode, fetchAssignedAgents]);

  /**
   * Handle opening the assign agent dialog
   * Requirements: 10.1
   */
  const handleOpenAssignAgentDialog = () => {
    if (!selectedPincode) return;
    setAssignAgentDialog({ open: true, pincodeId: selectedPincode.id });
  };

  /**
   * Handle closing the assign agent dialog
   */
  const handleCloseAssignAgentDialog = () => {
    setAssignAgentDialog({ open: false });
  };

  /**
   * Handle agent assignment
   * Requirements: 10.3, 10.4
   * - Get ServiceArea ID from pincode context
   * - PATCH agent's service_area_ids to include ServiceArea ID
   * - Use existing AgentService.updateAgent()
   * - Refresh agent list and show success toast
   */
  const handleAssignAgents = async (agentIds: number[]) => {
    if (!selectedPincode || agentIds.length === 0) return;

    setLoading(prev => ({ ...prev, submit: true }));
    setError(prev => ({ ...prev, submit: null }));

    try {
      // The pincode ID is used as the ServiceArea ID
      const serviceAreaId = selectedPincode.id;

      // Assign each selected agent to the service area
      for (const agentId of agentIds) {
        // Get current agent data to preserve existing service areas
        const agent = await AgentService.getAgent(agentId);
        const currentServiceAreaIds = agent.service_areas?.map(sa => sa.id) || [];
        
        // Add the new service area if not already assigned
        if (!currentServiceAreaIds.includes(serviceAreaId)) {
          const updatedServiceAreaIds = [...currentServiceAreaIds, serviceAreaId];
          await AgentService.assignServiceAreas(agentId, updatedServiceAreaIds);
        }
      }

      showSuccess(`Successfully assigned ${agentIds.length} agent${agentIds.length !== 1 ? 's' : ''} to this area`);
      
      // Close dialog and refresh agent list
      handleCloseAssignAgentDialog();
      setAgentPanelKey(prev => prev + 1); // Force refresh of agent panel
      await fetchAssignedAgents();
      
      // Also refresh pincodes to update agent counts
      if (selectedCity) {
        await fetchPincodes(selectedCity.id);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to assign agents';
      setError(prev => ({ ...prev, submit: errorMessage }));
      showError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  /**
   * Handle opening the remove agent dialog
   * Requirements: 11.1
   */
  const handleOpenRemoveAgentDialog = (agent: AgentListItem) => {
    setAgentToRemove(agent);
    setRemoveAgentDialogOpen(true);
  };

  /**
   * Handle closing the remove agent dialog
   */
  const handleCloseRemoveAgentDialog = () => {
    setAgentToRemove(null);
    setRemoveAgentDialogOpen(false);
  };

  /**
   * Handle agent removal from service area
   * Requirements: 11.2, 11.3
   * - PATCH agent's service_area_ids to exclude ServiceArea ID
   * - Refresh agent list and show success toast
   */
  const handleRemoveAgent = async () => {
    if (!selectedPincode || !agentToRemove) return;

    setLoading(prev => ({ ...prev, submit: true }));
    setError(prev => ({ ...prev, submit: null }));

    try {
      // The pincode ID is used as the ServiceArea ID
      const serviceAreaId = selectedPincode.id;

      // Get current agent data
      const agent = await AgentService.getAgent(agentToRemove.id);
      const currentServiceAreaIds = agent.service_areas?.map(sa => sa.id) || [];
      
      // Remove the service area from the agent's list
      const updatedServiceAreaIds = currentServiceAreaIds.filter(id => id !== serviceAreaId);
      await AgentService.assignServiceAreas(agentToRemove.id, updatedServiceAreaIds);

      showSuccess(`Successfully removed ${agentToRemove.name} from this area`);
      
      // Close dialog and refresh agent list
      handleCloseRemoveAgentDialog();
      setAgentPanelKey(prev => prev + 1); // Force refresh of agent panel
      await fetchAssignedAgents();
      
      // Also refresh pincodes to update agent counts
      if (selectedCity) {
        await fetchPincodes(selectedCity.id);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to remove agent';
      setError(prev => ({ ...prev, submit: errorMessage }));
      showError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  /**
   * Get the service area count for the agent being removed
   * Used to show warning if it's their last service area
   * Requirements: 11.4
   */
  const getAgentServiceAreaCount = useCallback(async (agentId: number): Promise<number> => {
    try {
      const agent = await AgentService.getAgent(agentId);
      return agent.service_areas?.length || 0;
    } catch {
      return 0;
    }
  }, []);

  // State for agent service area count (for warning display)
  const [agentServiceAreaCount, setAgentServiceAreaCount] = useState(0);

  // Fetch service area count when agent to remove changes
  useEffect(() => {
    if (agentToRemove) {
      getAgentServiceAreaCount(agentToRemove.id).then(setAgentServiceAreaCount);
    } else {
      setAgentServiceAreaCount(0);
    }
  }, [agentToRemove, getAgentServiceAreaCount]);

  // ==========================================================================
  // Computed Values
  // ==========================================================================
  
  // Client-side filtering for search (in addition to API filtering)
  const filteredCities = cities.filter(city => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      city.name.toLowerCase().includes(query) ||
      city.state.toLowerCase().includes(query)
    );
  });

  // Client-side filtering for pincode search - Task 9.5
  // Requirements: 5.3 - Filter by pincode or area_name
  const filteredPincodes = useMemo(() => {
    if (!pincodeSearchQuery.trim()) return pincodes;
    const query = pincodeSearchQuery.toLowerCase();
    return pincodes.filter(pincode => 
      pincode.pincode.toLowerCase().includes(query) ||
      (pincode.area_name && pincode.area_name.toLowerCase().includes(query))
    );
  }, [pincodes, pincodeSearchQuery]);

  // Statistics - Task 13.1
  // Requirements: 12.1, 12.2
  const stats = useMemo(() => {
    const totalCities = cities.length;
    const activeCities = cities.filter(c => c.status === 'available').length;
    const totalPincodes = cities.reduce((sum, c) => sum + c.pincode_count, 0);
    const totalAgents = agentStats?.total ?? 0;
    const avgAgentsPerArea = totalPincodes > 0 && totalAgents > 0
      ? (totalAgents / totalPincodes).toFixed(1)
      : '0';
    
    return {
      totalCities,
      activeCities,
      totalPincodes,
      totalAgents,
      avgAgentsPerArea,
    };
  }, [cities, agentStats]);

  // ==========================================================================
  // Render Helpers
  // ==========================================================================
  
  /**
   * Render statistics skeleton
   */
  const renderStatsSkeleton = () => (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className={i === 4 ? 'col-span-2 sm:col-span-1' : ''}>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mb-1" />
            <Skeleton className="h-2 sm:h-3 w-14 sm:w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  /**
   * Render city cards skeleton
   */
  const renderCitiesSkeleton = () => (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="p-3 sm:p-6">
            <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
            <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-2">
              <Skeleton className="h-3 sm:h-4 w-full" />
              <Skeleton className="h-3 sm:h-4 w-3/4" />
              <Skeleton className="h-3 sm:h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  /**
   * Render error state with retry button - Task 6.7
   * Requirements: 1.5, 13.1, 13.2, 13.3, 13.4, 13.5
   */
  const renderError = (errorMessage: string, onRetry: () => void) => (
    <Card className="border-destructive/50">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="text-center">
            <p className="text-lg font-medium text-destructive">Error Loading Data</p>
            <p className="text-muted-foreground mt-1">{errorMessage}</p>
          </div>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  /**
   * Render statistics cards
   * Requirements: 12.1, 12.2
   * Task 13.1: Display total cities, active cities, total pincodes, total agents, average agents per area
   */
  const renderStatsCards = () => {
    if (loading.cities && cities.length === 0) {
      return renderStatsSkeleton();
    }

    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-1 sm:gap-2">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Total Cities</span>
              <span className="sm:hidden">Cities</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">{stats.totalCities}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{stats.activeCities} active</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1 sm:gap-2">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Total Pincodes</span>
              <span className="sm:hidden">Pincodes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalPincodes}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Across all cities</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-background">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1 sm:gap-2">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Active Cities</span>
              <span className="sm:hidden">Active</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.activeCities}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Currently serving</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-background">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-1 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Total Agents</span>
              <span className="sm:hidden">Agents</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-100">
              {loadingAgentStats ? <Skeleton className="h-7 sm:h-9 w-10 sm:w-12" /> : stats.totalAgents}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Registered agents</p>
          </CardContent>
        </Card>

        <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950 dark:to-background col-span-2 sm:col-span-1">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-cyan-700 dark:text-cyan-300 flex items-center gap-1 sm:gap-2">
              <Compass className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Avg Agents/Area</span>
              <span className="sm:hidden">Avg/Area</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-cyan-900 dark:text-cyan-100">
              {loadingAgentStats ? <Skeleton className="h-7 sm:h-9 w-10 sm:w-12" /> : stats.avgAgentsPerArea}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Per pincode</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  /**
   * Render CityCard component - Task 6.2
   * Requirements: 1.2
   */
  const renderCityCard = (city: ServiceableCity) => (
    <Card 
      key={city.id}
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedCity?.id === city.id ? 'ring-2 ring-green-500 border-green-500' : 'border-green-100'
      }`}
      onClick={() => handleCitySelect(city)}
    >
      <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg flex items-center gap-1 sm:gap-2 truncate">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
              <span className="truncate">{city.name}</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">{city.state}</CardDescription>
          </div>
          <Badge 
            variant={city.status === 'available' ? 'default' : 'secondary'}
            className={`text-[10px] sm:text-xs flex-shrink-0 ${city.status === 'available' 
              ? 'bg-green-100 text-green-700 border-green-200' 
              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
            }`}
          >
            {city.status === 'available' ? (
              <><CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" /> <span className="hidden sm:inline">Available</span><span className="sm:hidden">Active</span></>
            ) : (
              <><Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" /> <span className="hidden sm:inline">Coming Soon</span><span className="sm:hidden">Soon</span></>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Pincodes:</span>
            <Badge variant="outline" className="text-xs">{city.pincode_count}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground hidden sm:inline">Coordinates:</span>
            <span className="text-muted-foreground sm:hidden">Coords:</span>
            <span className="font-mono text-[10px] sm:text-xs">
              {parseFloat(city.latitude).toFixed(2)}, {parseFloat(city.longitude).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Radius:</span>
            <span>{city.radius_km} km</span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
          <Button 
            size="sm" 
            variant="outline"
            className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleEditCity(city);
            }}
          >
            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCity(city);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  /**
   * Render city list - Task 6.2
   */
  const renderCityList = () => {
    if (loading.cities && cities.length === 0) {
      return renderCitiesSkeleton();
    }

    if (error.cities) {
      return renderError(error.cities, fetchCities);
    }

    if (filteredCities.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <MapPin className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-lg font-medium">No Cities Found</p>
                <p className="text-muted-foreground mt-1">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your filters or search query'
                    : 'Add your first serviceable city to get started'
                  }
                </p>
              </div>
              {(searchQuery || statusFilter !== 'all') && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCities.map(renderCityCard)}
      </div>
    );
  };

  // ==========================================================================
  // Main Render
  // ==========================================================================
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">Service Areas</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage serviceable cities and pincodes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            className="sm:size-default"
            onClick={handleRefresh}
            disabled={loading.cities}
          >
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading.cities ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" className="sm:size-default" onClick={handleViewMap}>
            <Map className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">View Map</span>
          </Button>
          <Button onClick={handleAddCity} size="sm" className="sm:size-default bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add City</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {renderStatsCards()}

      {/* Filters - Task 6.4 */}
      <Card className="border-green-100">
        <CardContent className="p-3 sm:pt-6 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by city name or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select 
                value={statusFilter} 
                onValueChange={(value) => setStatusFilter(value as 'all' | CityStatus)}
              >
                <SelectTrigger className="flex-1 sm:w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                </SelectContent>
              </Select>
              {(searchQuery || statusFilter !== 'all') && (
                <Button variant="outline" size="sm" className="sm:size-default" onClick={handleClearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* City List - Task 6.2 */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-1.5 sm:gap-2">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <span className="hidden sm:inline">Serviceable Cities</span>
            <span className="sm:hidden">Cities</span>
            <span className="text-muted-foreground">({filteredCities.length})</span>
          </h3>
        </div>
        {renderCityList()}
      </div>

      {/* Pincode Section - Task 9 */}
      {selectedCity && (
        <Card className="border-blue-100">
          <CardHeader className="p-3 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Pincodes in {selectedCity.name}</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  Manage serviceable pincodes for {selectedCity.name}, {selectedCity.state}
                </CardDescription>
              </div>
              <Button onClick={handleAddPincode} size="sm" className="sm:size-default bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="sm:hidden">Add</span>
                <span className="hidden sm:inline">Add Pincode</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {/* Pincode Search - Task 9.5 */}
            <div className="mb-3 sm:mb-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by pincode or area name..."
                    value={pincodeSearchQuery}
                    onChange={(e) => setPincodeSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {pincodeSearchQuery && (
                  <Button variant="outline" size="sm" className="sm:size-default" onClick={handleClearPincodeSearch}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Pincode Error State */}
            {error.pincodes ? (
              renderError(error.pincodes, () => fetchPincodes(selectedCity.id))
            ) : (
              <>
                {/* Pincode Table - Task 9.1 */}
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <div className="min-w-[500px] sm:min-w-0 px-3 sm:px-0">
                    <PincodeTable
                      pincodes={filteredPincodes}
                      selectedPincode={selectedPincode}
                      loading={loading.pincodes}
                      searchQuery={pincodeSearchQuery}
                      onRowClick={handlePincodeSelect}
                      onEdit={handleEditPincode}
                      onDelete={handleDeletePincode}
                      onManageAreas={handleManageAreas}
                    />
                  </div>
                </div>
                
                {/* Pincode count info */}
                {!loading.pincodes && filteredPincodes.length > 0 && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                    Showing {filteredPincodes.length} of {pincodes.length} pincode{pincodes.length !== 1 ? 's' : ''}
                    {pincodeSearchQuery && ` matching "${pincodeSearchQuery}"`}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agent Assignment Panel - Task 11.1 */}
      {selectedPincode && (
        <AgentAssignmentPanel
          key={agentPanelKey}
          pincode={selectedPincode}
          onAssignAgent={handleOpenAssignAgentDialog}
          onRemoveAgent={handleOpenRemoveAgentDialog}
        />
      )}

      {/* City Form Dialog - Task 7.1, 7.3, 7.5 */}
      <CityFormDialog
        open={cityFormDialog.open}
        mode={cityFormDialog.mode}
        city={cityFormDialog.data}
        onClose={handleCloseCityFormDialog}
        onSubmit={handleCityFormSubmit}
        isSubmitting={loading.submit}
      />

      {/* Delete City Confirmation Dialog - Task 7.7 */}
      <DeleteCityDialog
        open={confirmDialog.open && confirmDialog.type === 'delete-city'}
        city={confirmDialog.data as ServiceableCity}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleConfirmDeleteCity}
        isDeleting={loading.submit}
      />

      {/* Pincode Form Dialog - Task 9.7, 9.9, 9.11 */}
      <PincodeFormDialog
        open={pincodeFormDialog.open}
        mode={pincodeFormDialog.mode}
        pincode={pincodeFormDialog.data}
        cities={cities}
        selectedCityId={selectedCity?.id}
        onClose={handleClosePincodeFormDialog}
        onSubmit={handlePincodeFormSubmit}
        isSubmitting={loading.submit}
      />

      {/* Delete Pincode Confirmation Dialog - Task 9.13 */}
      <DeletePincodeDialog
        open={confirmDialog.open && confirmDialog.type === 'delete-pincode'}
        pincode={confirmDialog.data as ServiceablePincode}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleConfirmDeletePincode}
        isDeleting={loading.submit}
      />

      {/* Assign Agent Dialog - Task 11.3 */}
      <AssignAgentDialog
        open={assignAgentDialog.open}
        pincodeId={assignAgentDialog.pincodeId || null}
        pincodeName={selectedPincode?.pincode || ''}
        areaName={selectedPincode?.area_name || ''}
        assignedAgentIds={assignedAgents.map(a => a.id)}
        onClose={handleCloseAssignAgentDialog}
        onAssign={handleAssignAgents}
        isAssigning={loading.submit}
      />

      {/* Remove Agent Confirmation Dialog - Task 11.8 */}
      <RemoveAgentDialog
        open={removeAgentDialogOpen}
        agent={agentToRemove}
        pincodeName={selectedPincode?.pincode || ''}
        areaName={selectedPincode?.area_name || ''}
        agentServiceAreaCount={agentServiceAreaCount}
        onClose={handleCloseRemoveAgentDialog}
        onConfirm={handleRemoveAgent}
        isRemoving={loading.submit}
      />

      {/* Map View Dialog - Task 13.5 */}
      <MapViewDialog
        open={mapDialogOpen}
        city={selectedCity}
        onClose={handleCloseMapDialog}
      />

      {/* Areas Management Dialog */}
      <AreasManagementDialog
        open={areasDialogOpen}
        pincode={areasDialogPincode}
        onClose={handleCloseAreasDialog}
        onAreasChanged={handleAreasChanged}
      />
    </div>
  );
}
