'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  UserPlus, 
  UserMinus,
  Phone, 
  AlertCircle,
  RefreshCw,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Loader2,
} from "lucide-react";
import { ServiceabilityService } from "@/services/serviceability";
import { AgentService } from "@/services/agent";
import type { ServiceArea } from "@/types/serviceability";
import type { AgentListItem } from "@/types/agent";
import { showError, showSuccess } from "@/lib/toast-helpers";

interface AreaAgentAssignmentDialogProps {
  open: boolean;
  area: ServiceArea | null;
  onClose: () => void;
  onAgentsChanged?: () => void;
}

export function AreaAgentAssignmentDialog({
  open,
  area,
  onClose,
  onAgentsChanged,
}: AreaAgentAssignmentDialogProps) {
  // Assigned agents state
  const [assignedAgents, setAssignedAgents] = useState<AgentListItem[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  
  // Available agents state (for assignment)
  const [availableAgents, setAvailableAgents] = useState<AgentListItem[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [agentToRemove, setAgentToRemove] = useState<AgentListItem | null>(null);
  const [showAssignView, setShowAssignView] = useState(false);

  // Fetch assigned agents for this area
  const fetchAssignedAgents = useCallback(async () => {
    if (!area) return;
    
    setLoadingAssigned(true);
    setError(null);
    
    try {
      const agents = await ServiceabilityService.getAgentsForArea(area.id);
      setAssignedAgents(agents);
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned agents');
    } finally {
      setLoadingAssigned(false);
    }
  }, [area]);

  // Fetch available agents for assignment
  const fetchAvailableAgents = useCallback(async () => {
    setLoadingAvailable(true);
    
    try {
      // Get all active and onboarding agents (not using getEligibleAgents which has stricter filters)
      const [activeResponse, onboardingResponse] = await Promise.all([
        AgentService.getAgents({ status: 'active' }),
        AgentService.getAgents({ status: 'onboarding' }),
      ]);
      
      // Combine both lists
      const allAgents = [...activeResponse.results, ...onboardingResponse.results];
      setAvailableAgents(allAgents);
    } catch (err: any) {
      showError(err.message || 'Failed to load available agents');
    } finally {
      setLoadingAvailable(false);
    }
  }, []);

  // Load data when dialog opens
  useEffect(() => {
    if (open && area) {
      fetchAssignedAgents();
      setShowAssignView(false);
      setSelectedAgentIds([]);
      setSearchQuery('');
    }
  }, [open, area, fetchAssignedAgents]);

  // Load available agents when switching to assign view
  useEffect(() => {
    if (showAssignView) {
      fetchAvailableAgents();
    }
  }, [showAssignView, fetchAvailableAgents]);

  // Filter available agents by search and exclude already assigned
  const filteredAvailableAgents = availableAgents.filter(agent => {
    // Exclude already assigned agents
    if (assignedAgents.some(a => a.id === agent.id)) return false;
    
    // Filter by search query
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(query) ||
      agent.agent_code.toLowerCase().includes(query) ||
      agent.phone.includes(query)
    );
  });

  // Handle agent selection toggle
  const handleToggleAgent = (agentId: number) => {
    setSelectedAgentIds(prev => 
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  // Handle assigning selected agents
  const handleAssignAgents = async () => {
    if (!area || selectedAgentIds.length === 0) return;
    
    setIsAssigning(true);
    
    try {
      // For each selected agent, add this area to their service_area_ids
      for (const agentId of selectedAgentIds) {
        const agent = await AgentService.getAgent(agentId);
        const currentAreaIds = agent.service_areas?.map(sa => sa.id) || [];
        
        if (!currentAreaIds.includes(area.id)) {
          const updatedAreaIds = [...currentAreaIds, area.id];
          await AgentService.assignServiceAreas(agentId, updatedAreaIds);
        }
      }
      
      showSuccess(`Successfully assigned ${selectedAgentIds.length} agent${selectedAgentIds.length !== 1 ? 's' : ''} to ${area.name}`);
      
      // Reset and refresh
      setSelectedAgentIds([]);
      setShowAssignView(false);
      await fetchAssignedAgents();
      onAgentsChanged?.();
    } catch (err: any) {
      showError(err.message || 'Failed to assign agents');
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle removing an agent
  const handleRemoveAgent = async (agent: AgentListItem) => {
    if (!area) return;
    
    setAgentToRemove(agent);
    setIsRemoving(true);
    
    try {
      const fullAgent = await AgentService.getAgent(agent.id);
      const currentAreaIds = fullAgent.service_areas?.map(sa => sa.id) || [];
      const updatedAreaIds = currentAreaIds.filter(id => id !== area.id);
      
      await AgentService.assignServiceAreas(agent.id, updatedAreaIds);
      
      showSuccess(`Successfully removed ${agent.name} from ${area.name}`);
      
      await fetchAssignedAgents();
      onAgentsChanged?.();
    } catch (err: any) {
      showError(err.message || 'Failed to remove agent');
    } finally {
      setIsRemoving(false);
      setAgentToRemove(null);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'onboarding':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Onboarding
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!area) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            {showAssignView ? 'Assign Agents' : 'Manage Agents'} - {area.name}
          </DialogTitle>
          <DialogDescription>
            {showAssignView 
              ? `Select agents to assign to ${area.name} (${area.pincode_code})`
              : `Agents assigned to ${area.name} in pincode ${area.pincode_code}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {showAssignView ? (
            // Assign View
            <>
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, code, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Available Agents List */}
              <ScrollArea className="flex-1 -mx-6 px-6">
                {loadingAvailable ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredAvailableAgents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Available Agents</p>
                    <p className="text-muted-foreground mt-1">
                      {searchQuery ? 'No agents match your search' : 'All eligible agents are already assigned'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAvailableAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAgentIds.includes(agent.id) 
                            ? 'bg-purple-50 border-purple-300' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleToggleAgent(agent.id)}
                      >
                        <Checkbox
                          checked={selectedAgentIds.includes(agent.id)}
                          onCheckedChange={() => handleToggleAgent(agent.id)}
                        />
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={agent.profile_image_url || undefined} />
                          <AvatarFallback>{getInitials(agent.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{agent.name}</span>
                            <Badge variant="outline" className="font-mono text-xs">
                              {agent.agent_code}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{agent.phone}</span>
                          </div>
                        </div>
                        {getStatusBadge(agent.status)}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setShowAssignView(false)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <span className="text-sm text-muted-foreground self-center">
                    {selectedAgentIds.length} selected
                  </span>
                  <Button
                    onClick={handleAssignAgents}
                    disabled={selectedAgentIds.length === 0 || isAssigning}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Assign Selected
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // View Assigned Agents
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {assignedAgents.length} agent{assignedAgents.length !== 1 ? 's' : ''} assigned
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchAssignedAgents}
                    disabled={loadingAssigned}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loadingAssigned ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setShowAssignView(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Assign Agent
                  </Button>
                </div>
              </div>

              {/* Assigned Agents List */}
              <ScrollArea className="flex-1 -mx-6 px-6">
                {loadingAssigned ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-8 w-8" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <p className="text-lg font-medium text-destructive">Error Loading Agents</p>
                    <p className="text-muted-foreground mt-1">{error}</p>
                    <Button variant="outline" onClick={fetchAssignedAgents} className="mt-4">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : assignedAgents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Agents Assigned</p>
                    <p className="text-muted-foreground mt-1">
                      No agents are currently assigned to this area.
                    </p>
                    <Button 
                      onClick={() => setShowAssignView(true)} 
                      className="mt-4 bg-purple-600 hover:bg-purple-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Agent
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignedAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={agent.profile_image_url || undefined} />
                          <AvatarFallback>
                            {agent.name ? getInitials(agent.name) : <User className="h-5 w-5" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{agent.name}</span>
                            <Badge variant="outline" className="font-mono text-xs">
                              {agent.agent_code}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{agent.phone}</span>
                          </div>
                        </div>
                        {getStatusBadge(agent.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAgent(agent)}
                          disabled={isRemoving && agentToRemove?.id === agent.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {isRemoving && agentToRemove?.id === agent.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
