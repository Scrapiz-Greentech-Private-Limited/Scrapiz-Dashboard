'use client';

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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  UserMinus, 
  AlertTriangle,
  Loader2,
} from "lucide-react";
import type { AgentListItem } from "@/types/agent";

/**
 * Props for RemoveAgentDialog component
 */
interface RemoveAgentDialogProps {
  open: boolean;
  agent: AgentListItem | null;
  pincodeName: string;
  areaName: string;
  agentServiceAreaCount: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isRemoving?: boolean;
}

/**
 * RemoveAgentDialog - Confirmation dialog for removing an agent from a ServiceArea
 * 
 * Requirements: 11.1, 11.4
 * - Show confirmation dialog
 * - Warn if agent has only one ServiceArea
 */
export function RemoveAgentDialog({
  open,
  agent,
  pincodeName,
  areaName,
  agentServiceAreaCount,
  onClose,
  onConfirm,
  isRemoving = false,
}: RemoveAgentDialogProps) {
  if (!agent) return null;

  const isLastServiceArea = agentServiceAreaCount <= 1;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-destructive" />
            Remove Agent from Area
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Are you sure you want to remove <strong>{agent.name}</strong>{' '}
                <Badge variant="outline" className="font-mono text-xs">
                  {agent.agent_code}
                </Badge>{' '}
                from <strong>{pincodeName}</strong> - {areaName || 'Unknown Area'}?
              </p>

              {/* Warning for last service area - Requirements: 11.4 */}
              {isLastServiceArea && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> This is the agent's only assigned service area. 
                    Removing them will leave them with no assigned areas, which may affect 
                    their ability to receive orders.
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-sm text-muted-foreground">
                The agent will no longer be able to receive pickup orders in this area.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isRemoving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRemoving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              'Remove Agent'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
