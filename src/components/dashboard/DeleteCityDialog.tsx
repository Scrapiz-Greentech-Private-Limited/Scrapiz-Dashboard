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
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import type { ServiceableCity } from "@/types/serviceability";

/**
 * Props for DeleteCityDialog component
 */
interface DeleteCityDialogProps {
  open: boolean;
  city: ServiceableCity | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

/**
 * DeleteCityDialog - Confirmation dialog for deleting a city
 * 
 * Requirements: 4.1, 4.2
 */
export function DeleteCityDialog({
  open,
  city,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteCityDialogProps) {
  if (!city) return null;

  const hasPincodes = city.pincode_count > 0;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete City
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Are you sure you want to delete the city <strong>{city.name}</strong> ({city.state})?
              </p>
              
              {/* City info summary - Requirements: 4.1 */}
              <div className="bg-muted p-3 rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span>City:</span>
                  <span className="font-medium">{city.name}, {city.state}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pincodes:</span>
                  <Badge variant="outline">{city.pincode_count}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <Badge 
                    variant={city.status === 'available' ? 'default' : 'secondary'}
                    className={city.status === 'available' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                    }
                  >
                    {city.status === 'available' ? 'Available' : 'Coming Soon'}
                  </Badge>
                </div>
              </div>

              {/* Warning about pincodes - Requirements: 4.2 */}
              {hasPincodes && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Warning:</strong> This city has {city.pincode_count} pincode{city.pincode_count > 1 ? 's' : ''} associated with it. 
                    Deleting this city will also delete all associated pincodes and may affect agent assignments.
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
            Delete City
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
