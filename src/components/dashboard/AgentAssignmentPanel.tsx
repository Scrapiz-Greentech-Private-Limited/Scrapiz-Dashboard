'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "lucide-react";
import { ServiceabilityService } from "@/services/serviceability";
import type { ServiceablePincode } from "@/types/serviceability";
import type { AgentListItem } from "@/types/agent";
import { showError } from "@/lib/toast-helpers";

/**
 * Props for AgentAssignmentPanel component
 */
interface AgentAssignmentPanelProps {
  pincode: ServiceablePincode | null;
  onAssignAgent: () => void;
  onRemoveAgent: (agent: AgentListItem) => void;
}

/**
 * AgentAssignmentPanel - Side panel for managing agent-ServiceArea assignments
 * 
 * Requirements: 9.1, 9.2, 9.3
 * - Display list of agents assigned to ServiceArea (via pincode)
 * - Show agent_code, name, phone, status, kyc_status, availability
 * - Add Remove button for each agent
 * - Add "Assign Agent" button
 * - Handle empty state with message
 */
export function AgentAssignmentPanel({
  pincode,
  onAssignAgent,
  onRemoveAgent,
}: AgentAssignmentPanelProps) {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);

  /**
   * Fetch agents for the selected pincode
   * Requirements: 9.1
   */
  const fetchAgents = useCallback(async () => {
    if (!pincode || isFetching.current) return;
    
    isFetching.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const agentList = await ServiceabilityService.getAgentsForPincode(pincode.id);
      setAgents(agentList);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load agents';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [pincode]);

  // Fetch agents when pincode changes
  useEffect(() => {
    if (pincode) {
      fetchAgents();
    } else {
      setAgents([]);
      setError(null);
    }
  }, [pincode, fetchAgents]);

  // Expose refresh function for parent component
  const handleRefresh = () => {
    fetchAgents();
  };

  /**
   * Get status badge variant and color
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
      case 'inactive':
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case 'suspended':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  /**
   * Get KYC status badge
   */
  const getKycBadge = (kycStatus: string) => {
    switch (kycStatus) {
      case 'verified':
        return (
          <Badge variant="outline" className="text-green-600 border-green-300">
            KYC Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            KYC Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-300">
            KYC Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{kycStatus}</Badge>;
    }
  };

  /**
   * Get availability badge
   */
  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'available':
        return (
          <Badge variant="outline" className="text-green-600 border-green-300">
            Available
          </Badge>
        );
      case 'on_duty':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            On Duty
          </Badge>
        );
      case 'offline':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-300">
            Offline
          </Badge>
        );
      default:
        return <Badge variant="outline">{availability}</Badge>;
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

  // Don't render if no pincode is selected
  if (!pincode) {
    return null;
  }

  return (
    <Card className="border-purple-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Assigned Agents
            </CardTitle>
            <CardDescription>
              Agents covering {pincode.pincode} - {pincode.area_name || 'Unknown Area'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              onClick={onAssignAgent}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Agent
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {loading && agents.length === 0 && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Error State - Requirements: 9.4 */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <p className="text-lg font-medium text-destructive">Error Loading Agents</p>
              <p className="text-muted-foreground mt-1">{error}</p>
            </div>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State - Requirements: 9.3 */}
        {!loading && !error && agents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-medium">No Agents Assigned</p>
              <p className="text-muted-foreground mt-1">
                No agents are currently assigned to this area.
              </p>
            </div>
            <Button onClick={onAssignAgent} className="bg-purple-600 hover:bg-purple-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Agent
            </Button>
          </div>
        )}

        {/* Agent List - Requirements: 9.2 */}
        {!loading && !error && agents.length > 0 && (
          <div className="space-y-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage src={agent.profile_image_url || undefined} alt={agent.name} />
                  <AvatarFallback>
                    {agent.name ? getInitials(agent.name) : <User className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>

                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{agent.name}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {agent.agent_code}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Phone className="h-3 w-3" />
                    <span>{agent.phone}</span>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getStatusBadge(agent.status)}
                    {getKycBadge(agent.kyc_status)}
                    {getAvailabilityBadge(agent.availability)}
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveAgent(agent)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Agent count */}
            <p className="text-sm text-muted-foreground text-center pt-2">
              {agents.length} agent{agents.length !== 1 ? 's' : ''} assigned to this area
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export a ref-based version for parent to trigger refresh
export type AgentAssignmentPanelRef = {
  refresh: () => void;
};
