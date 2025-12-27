'use client'

import * as React from "react"
import { MoreHorizontal, PlusCircle, Check, X, Map } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ServiceArea } from "@/lib/types"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

type AreasTableClientProps = {
  initialAreas: ServiceArea[]
}

export default function AreasTableClient({ initialAreas }: AreasTableClientProps) {
  const [areas, setAreas] = React.useState(initialAreas)
  const { toast } = useToast()

  const handleToggleActive = (areaId: string, active: boolean) => {
    setAreas(
      areas.map((area) =>
        area.id === areaId ? { ...area, active } : area
      )
    )
    toast({
      title: `Area ${active ? "Activated" : "Deactivated"}`,
      description: `Service area has been updated.`,
    })
  }

  const handleAddNewArea = () => {
    toast({
      title: "Add New Area",
      description: "Add new area dialog would open here",
    })
    // TODO: Implement add area dialog
  }

  const handleViewCoverageMap = () => {
    toast({
      title: "Coverage Map",
      description: "Coverage map view would open here",
    })
    // TODO: Implement coverage map view
  }

  const handleEdit = (areaId: string) => {
    toast({
      title: "Edit Area",
      description: `Edit dialog for area ${areaId} would open here`,
    })
    // TODO: Implement edit area dialog
  }

  const handleAssignDrivers = (areaId: string) => {
    toast({
      title: "Assign Drivers",
      description: `Assign drivers dialog for area ${areaId} would open here`,
    })
    // TODO: Implement assign drivers dialog
  }

  const handleRemove = (areaId: string, areaName: string) => {
    if (confirm(`Are you sure you want to remove ${areaName}?`)) {
      setAreas(areas.filter(area => area.id !== areaId))
      toast({
        title: "Area Removed",
        description: `${areaName} has been removed successfully.`,
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
            <Button onClick={handleAddNewArea} className="bg-green-600 hover:bg-green-700">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Area
            </Button>
        </div>
         <Button variant="outline" onClick={handleViewCoverageMap}>
            <Map className="h-4 w-4 mr-2" />
            View Coverage Map
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Area Name</TableHead>
            <TableHead>Pincode</TableHead>
            <TableHead>Zone</TableHead>
            <TableHead className="text-center">Active</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {areas.map((area) => (
            <TableRow key={area.id}>
              <TableCell className="font-medium">{area.name}</TableCell>
              <TableCell>{area.pincode}</TableCell>
              <TableCell>
                  <Badge variant="secondary">{area.zone}</Badge>
              </TableCell>
              <TableCell className="text-center">
                 <Switch
                    id={`active-switch-${area.id}`}
                    checked={area.active}
                    onCheckedChange={(checked) => handleToggleActive(area.id, checked)}
                    aria-label="Toggle service area status"
                  />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-haspopup="true"
                      size="icon"
                      variant="ghost"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEdit(area.id)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAssignDrivers(area.id)}>Assign Drivers</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleRemove(area.id, area.name)}>
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
