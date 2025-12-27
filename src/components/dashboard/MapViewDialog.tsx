'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Map, MapPin, Construction } from "lucide-react";
import type { ServiceableCity } from "@/types/serviceability";

/**
 * Props for MapViewDialog component
 */
interface MapViewDialogProps {
  open: boolean;
  city: ServiceableCity | null;
  onClose: () => void;
}

/**
 * MapViewDialog - Placeholder dialog for map view feature
 * 
 * Requirements: 14.1, 14.4
 * - Add "View Map" button
 * - Display placeholder message for coming soon
 * - Prepare for future Google Maps integration
 */
export function MapViewDialog({
  open,
  city,
  onClose,
}: MapViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-green-600" />
            Map View
          </DialogTitle>
          <DialogDescription>
            {city 
              ? `Service coverage map for ${city.name}, ${city.state}`
              : 'View service coverage on the map'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          {/* Placeholder illustration */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 flex items-center justify-center">
              <Map className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-100 dark:bg-yellow-900 rounded-full p-2">
              <Construction className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          
          {/* Coming soon message */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Coming Soon
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              The interactive map view is currently under development. 
              Soon you'll be able to visualize service coverage with Google Maps integration.
            </p>
          </div>
          
          {/* Feature preview */}
          <div className="w-full mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              Planned Features
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Interactive map centered on city coordinates</li>
              <li>• Markers for each serviceable pincode</li>
              <li>• Tooltips showing pincode, area name, and agent count</li>
              <li>• Service radius visualization</li>
              <li>• Agent location tracking (future)</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
