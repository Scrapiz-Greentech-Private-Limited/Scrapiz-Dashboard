'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Edit, 
  Trash2, 
  Users, 
  MapPin,
  Building2,
  Phone,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  UserX,
  MoreVertical,
  Layers,
  Plus,
} from "lucide-react";
import { ServiceabilityService } from "@/services/serviceability";
import type { ServiceablePincode } from "@/types/serviceability";
import type { AgentListItem } from "@/types/agent";

/**
 * Props for PincodeTable component
 */
interface PincodeTableProps {
  pincodes: ServiceablePincode[];
  selectedPincode: ServiceablePincode | null;
  loading?: boolean;
  searchQuery?: string;
  onRowClick: (pincode: ServiceablePincode) => void;
  onEdit: (pincode: ServiceablePincode) => void;
  onDelete: (pincode: ServiceablePincode) => void;
  onManageAreas?: (pincode: ServiceablePincode) => void;
}

/**
 * Props for AgentPopover component
 */
interface AgentPopoverProps {
  pincodeId: number;
  agentCount: number;
}

/**
 * Get initials from name for avatar fallback
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get status badge styling
 */
function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    case 'onboarding':
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Onboarding
        </Badge>
      );
    case 'inactive':
      return (
        <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Inactive
        </Badge>
      );
    case 'suspended':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Suspended
        </Badge>
      );
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

/**
 * AgentPopover - Beautiful popover showing agents assigned to a pincode
 */
function AgentPopover({ pincodeId, agentCount }: AgentPopoverProps) {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch agents when popover opens
  useEffect(() => {
    if (isOpen && agentCount > 0) {
      fetchAgents();
    }
  }, [isOpen, pincodeId]);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`[AgentPopover] Fetching agents for pincode ID: ${pincodeId}`);
      const agentList = await ServiceabilityService.getAgentsForPincode(pincodeId);
      console.log(`[AgentPopover] Received ${agentList.length} agents:`, agentList);
      setAgents(agentList);
    } catch (err: any) {
      console.error(`[AgentPopover] Error fetching agents:`, err);
      setError(err.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  // Don't show popover trigger if no agents
  if (agentCount === 0) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <Users className="h-3 w-3" />
        0
      </Badge>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 h-7 px-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Users className="h-3 w-3" />
          {agentCount}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-t-md">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-full">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">
                Assigned Agents
              </h4>
              <p className="text-xs text-green-600 dark:text-green-400">
                {agentCount} agent{agentCount !== 1 ? 's' : ''} in this area
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-72">
          <div className="p-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                <p className="text-sm text-muted-foreground mt-2">Loading agents...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <XCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-sm text-destructive">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={fetchAgents}
                >
                  Retry
                </Button>
              </div>
            ) : agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <UserX className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No agents found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/**
 * AgentCard - Individual agent card in the popover
 */
function AgentCard({ agent }: { agent: AgentListItem }) {
  const rating = parseFloat(agent.average_rating) || 0;
  
  return (
    <Card className="border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Avatar className="h-12 w-12 border-2 border-green-100 dark:border-green-900">
            <AvatarImage 
              src={agent.profile_image_url || undefined} 
              alt={agent.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-700 dark:text-green-300 font-semibold">
              {getInitials(agent.name)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h5 className="font-semibold text-sm truncate">{agent.name}</h5>
              {getStatusBadge(agent.status)}
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                {agent.agent_code}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mt-2">
              {/* Phone */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{agent.phone}</span>
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Orders info */}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Today: {agent.today_orders}
              </Badge>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Total: {agent.total_orders}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * PincodeTable - Table component for displaying pincodes
 * 
 * Requirements: 5.2
 * - Display pincode, area_name, city_name, city_state, agent_count
 * - Add Edit and Delete action buttons
 * - Add row click handler for agent panel
 */
export function PincodeTable({
  pincodes,
  selectedPincode,
  loading = false,
  searchQuery = '',
  onRowClick,
  onEdit,
  onDelete,
  onManageAreas,
}: PincodeTableProps) {
  if (loading) {
    return <PincodeTableSkeleton />;
  }

  if (pincodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">No Pincodes Found</p>
        <p className="text-muted-foreground mt-1">
          {searchQuery 
            ? `No pincodes match "${searchQuery}". Try a different search term.`
            : 'Select a city to view its pincodes or add a new pincode.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pincode</TableHead>
            <TableHead>Areas</TableHead>
            <TableHead>City</TableHead>
            <TableHead>State</TableHead>
            <TableHead className="text-center">Agents</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pincodes.map((pincode) => (
            <TableRow
              key={pincode.id}
              className={`cursor-pointer ${
                selectedPincode?.id === pincode.id 
                  ? 'bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900' 
                  : ''
              }`}
              onClick={() => onRowClick(pincode)}
            >
              <TableCell className="font-mono font-medium">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  {pincode.pincode}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {pincode.area_count > 0 ? (
                    <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
                      <Layers className="h-3 w-3" />
                      {pincode.area_count} area{pincode.area_count !== 1 ? 's' : ''}
                    </Badge>
                  ) : pincode.area_name ? (
                    <span className="text-sm">{pincode.area_name}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {pincode.city_name}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {pincode.city_state}
              </TableCell>
              <TableCell className="text-center">
                <AgentPopover 
                  pincodeId={pincode.id} 
                  agentCount={pincode.agent_count ?? 0} 
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(pincode);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(pincode);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {/* Three-dot menu for additional actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={() => onManageAreas?.(pincode)}
                        className="cursor-pointer"
                      >
                        <Layers className="h-4 w-4 mr-2 text-purple-600" />
                        Manage Areas
                        {pincode.area_count > 0 && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {pincode.area_count}
                          </Badge>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onManageAreas?.(pincode)}
                        className="cursor-pointer"
                      >
                        <Plus className="h-4 w-4 mr-2 text-green-600" />
                        Add New Area
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onEdit(pincode)}
                        className="cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Pincode
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(pincode)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Pincode
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Skeleton loader for PincodeTable
 */
function PincodeTableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pincode</TableHead>
            <TableHead>Areas</TableHead>
            <TableHead>City</TableHead>
            <TableHead>State</TableHead>
            <TableHead className="text-center">Agents</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="text-center"><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8" />
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
