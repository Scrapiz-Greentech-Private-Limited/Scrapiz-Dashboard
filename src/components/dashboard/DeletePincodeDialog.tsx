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
import { Loader2, AlertTriangle, Trash2, Users } from "lucide-react";
import type { ServiceablePincode } from "@/types/serviceability";

/**
 * Props for DeletePincodeDialog component
 */
interface DeletePincodeDialogProps {
  open: boolean;
  pincode: ServiceablePincode | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

/**
 * DeletePincodeDialog - Confirmation dialog for deleting a pincode
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 * - Show confirmation dialog with pincode and area_name
 * - Warn about agent impact if agents assigned
 * - DELETE to API on confirm
 */
export function DeletePincodeDialog({
  open,
  pincode,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeletePincodeDialogProps) {
  if (!pincode) return null;

  const hasAgents = (pincode.agent_count ?? 0) > 0;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Pincode
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Are you sure you want to delete the pincode <strong>{pincode.pincode}</strong>?
              </p>
              
              {/* Pincode info summary - Requirements: 8.1 */}
              <div className="bg-muted p-3 rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pincode:</span>
                  <span className="font-mono font-medium">{pincode.pincode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Area:</span>
                  <span className="font-medium">{pincode.area_name || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>City:</span>
                  <span className="font-medium">{pincode.city_name}, {pincode.city_state}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Assigned Agents:</span>
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {pincode.agent_count ?? 0}
                  </Badge>
                </div>
              </div>

              {/* Warning about agents - Requirements: 8.2 */}
              {hasAgents && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Warning:</strong> This pincode has {pincode.agent_count} agent{(pincode.agent_count ?? 0) > 1 ? 's' : ''} assigned to its service area. 
                    Deleting this pincode may affect their service coverage.
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Pincode
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
