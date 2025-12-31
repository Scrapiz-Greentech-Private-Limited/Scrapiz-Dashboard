'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  User, 
  Phone, 
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { AgentService } from "@/services/agent";
import type { AgentListItem } from "@/types/agent";
import { showError } from "@/lib/toast-helpers";

/**
 * Props for AssignAgentDialog component
 */
interface AssignAgentDialogProps {
  open: boolean;
  pincodeId: number | null;
  pincodeName: string;
  areaName: string;
  assignedAgentIds: number[];
  onClose: () => void;
  onAssign: (agentIds: number[]) => Promise<void>;
  isAssigning?: boolean;
}

/**
 * AssignAgentDialog - Modal for assigning agents to a ServiceArea
 * 
 * Requirements: 10.1, 10.2, 10.5
 * - Searchable list of eligible agents
 * - Filter: status='active' OR status='onboarding' (any kyc_status)
 * - Show already-assigned agents as disabled
 * - Multi-select capability
 */
export function AssignAgentDialog({
  open,
  pincodeId,
  pincodeName,
  areaName,
  assignedAgentIds,
  onClose,
  onAssign,
  isAssigning = false,
}: AssignAgentDialogProps) {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);

  /**
   * Fetch eligible agents
   * Requirements: 10.2 - Filter: status='active' OR status='onboarding'
   * Also includes agents without any service areas assigned
   */
  const fetchEligibleAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the eligible agents endpoint with include_onboarding and include_unassigned flags
      // This returns agents that are active/onboarding, not rejected KYC, and includes
      // agents without any service areas assigned
      const agents = await AgentService.getEligibleAgents(
        undefined, // no pincode filter
        true,      // include onboarding agents
        true       // include agents without service areas
      );
      
      setAgents(agents);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load agents';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch agents when dialog opens
  useEffect(() => {
    if (open) {
      fetchEligibleAgents();
      setSelectedAgentIds([]);
      setSearchQuery('');
    }
  }, [open, fetchEligibleAgents]);

  /**
   * Filter agents by search query
   */
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;
    
    const query = searchQuery.toLowerCase();
    return agents.filter(agent => 
      agent.name.toLowerCase().includes(query) ||
      agent.agent_code.toLowerCase().includes(query) ||
      agent.phone.includes(query) ||
      agent.email.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

  /**
   * Check if agent is already assigned
   * Requirements: 10.5
   */
  const isAgentAssigned = (agentId: number) => {
    return assignedAgentIds.includes(agentId);
  };

  /**
   * Handle agent selection toggle
   */
  const handleAgentToggle = (agentId: number) => {
    if (isAgentAssigned(agentId)) return; // Don't allow toggling already-assigned agents
    
    setSelectedAgentIds(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };

  /**
   * Handle assign button click
   */
  const handleAssign = async () => {
    if (selectedAgentIds.length === 0) return;
    await onAssign(selectedAgentIds);
  };

  /**
   * Get status badge
   */
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

  /**
   * Get initials for avatar fallback
   */
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Assign Agents
          </DialogTitle>
          <DialogDescription>
            Select agents to assign to {pincodeName} - {areaName || 'Unknown Area'}
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Agent List */}
        <ScrollArea className="h-[400px] pr-4">
          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <p className="text-lg font-medium text-destructive">Error Loading Agents</p>
                <p className="text-muted-foreground mt-1">{error}</p>
              </div>
              <Button variant="outline" onClick={fetchEligibleAgents}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredAgents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Users className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-lg font-medium">No Eligible Agents Found</p>
                <p className="text-muted-foreground mt-1">
                  {searchQuery 
                    ? 'Try adjusting your search query'
                    : 'No agents with active or onboarding status are available'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Agent List */}
          {!loading && !error && filteredAgents.length > 0 && (
            <div className="space-y-2">
              {filteredAgents.map((agent) => {
                const isAssigned = isAgentAssigned(agent.id);
                const isSelected = selectedAgentIds.includes(agent.id);
                
                return (
                  <div
                    key={agent.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                      isAssigned 
                        ? 'bg-muted/50 opacity-60 cursor-not-allowed' 
                        : isSelected
                          ? 'bg-purple-50 border-purple-200 dark:bg-purple-950'
                          : 'hover:bg-muted/50 cursor-pointer'
                    }`}
                    onClick={() => !isAssigned && handleAgentToggle(agent.id)}
                  >
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected || isAssigned}
                      disabled={isAssigned}
                      onCheckedChange={() => handleAgentToggle(agent.id)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={agent.profile_image_url || undefined} alt={agent.name} />
                      <AvatarFallback>
                        {agent.name ? getInitials(agent.name) : <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>

                    {/* Agent Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{agent.name}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {agent.agent_code}
                        </Badge>
                        {isAssigned && (
                          <Badge variant="secondary" className="text-xs">
                            Already Assigned
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {agent.phone}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {getStatusBadge(agent.status)}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Selection Summary */}
        {selectedAgentIds.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedAgentIds.length} agent{selectedAgentIds.length !== 1 ? 's' : ''} selected
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedAgentIds.length === 0 || isAssigning}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                Assign {selectedAgentIds.length > 0 ? `(${selectedAgentIds.length})` : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
