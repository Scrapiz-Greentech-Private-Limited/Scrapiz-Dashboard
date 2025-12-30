'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, GripVertical, Image as ImageIcon } from "lucide-react"
import { ContentService } from '@/services/content'
import { useToast } from "@/hooks/use-toast"

interface CarouselImage {
  id: number
  title: string
  image_url: string
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function CarouselManagementPage() {
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([])
  const [loading, setLoading] = useState(true)
  const [newImage, setNewImage] = useState({ title: '', image_url: '' })
  const { toast } = useToast()

  useEffect(() => {
    loadCarouselImages()
  }, [])

  const loadCarouselImages = async () => {
    try {
      setLoading(true)
      const images = await ContentService.getCarouselImages()
      setCarouselImages(images)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load carousel images",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddImage = async () => {
    if (!newImage.title || !newImage.image_url) {
      toast({
        title: "Validation Error",
        description: "Please provide both title and image URL",
        variant: "destructive",
      })
      return
    }

    try {
      const maxOrder = carouselImages.length > 0 
        ? Math.max(...carouselImages.map(img => img.order)) 
        : -1
      
      await ContentService.createCarouselImage({
        ...newImage,
        order: maxOrder + 1,
        is_active: true
      })
      
      toast({
        title: "Success",
        description: "Carousel image added successfully",
      })
      
      setNewImage({ title: '', image_url: '' })
      loadCarouselImages()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add carousel image",
        variant: "destructive",
      })
    }
  }

  const handleDeleteImage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this carousel image?')) {
      return
    }

    try {
      await ContentService.deleteCarouselImage(id)
      toast({
        title: "Success",
        description: "Carousel image deleted successfully",
      })
      loadCarouselImages()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete carousel image",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await ContentService.updateCarouselImage(id, { is_active: !currentStatus })
      toast({
        title: "Success",
        description: `Carousel image ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      })
      loadCarouselImages()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update carousel image",
        variant: "destructive",
      })
    }
  }

  const handleReorder = async (dragIndex: number, hoverIndex: number) => {
    const draggedImage = carouselImages[dragIndex]
    const newImages = [...carouselImages]
    newImages.splice(dragIndex, 1)
    newImages.splice(hoverIndex, 0, draggedImage)
    
    // Update local state immediately for better UX
    setCarouselImages(newImages)
    
    // Prepare order updates
    const orders = newImages.map((img, index) => ({
      id: img.id,
      order: index
    }))
    
    try {
      await ContentService.reorderCarouselImages(orders)
      toast({
        title: "Success",
        description: "Carousel order updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reorder carousel images",
        variant: "destructive",
      })
      // Reload on error to restore correct order
      loadCarouselImages()
    }
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === carouselImages.length - 1) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    handleReorder(index, newIndex)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading carousel images...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Carousel Management</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
          Manage the carousel images displayed on the app's home screen
        </p>
      </div>

      {/* Add New Image */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Add New Carousel Image</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Upload images to S3 and paste the URL here
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          <div className="grid gap-3 sm:gap-4">
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="title" className="text-xs sm:text-sm">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Become A Scrap Seller"
                value={newImage.title}
                onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                className="h-9 sm:h-10"
              />
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="image_url" className="text-xs sm:text-sm">S3 Image URL</Label>
              <Input
                id="image_url"
                placeholder="https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/..."
                value={newImage.image_url}
                onChange={(e) => setNewImage({ ...newImage, image_url: e.target.value })}
                className="h-9 sm:h-10"
              />
              <p className="text-[10px] sm:text-sm text-muted-foreground">
                Upload your image to S3 first, then paste the URL here
              </p>
            </div>
            <Button 
              onClick={handleAddImage}
              size="sm"
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto sm:size-default"
            >
              <Plus className="mr-1.5 sm:mr-2 h-4 w-4" />
              Add Carousel Image
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Images */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Current Carousel Images ({carouselImages.length})</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Drag to reorder, toggle to activate/deactivate
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          {carouselImages.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <ImageIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-xs sm:text-sm font-semibold text-gray-900">No carousel images</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">Get started by adding a new carousel image.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {carouselImages.map((image, index) => (
                <div
                  key={image.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Mobile: Top row with image and controls */}
                  <div className="flex items-start gap-3 sm:contents">
                    {/* Drag Handle & Order Controls */}
                    <div className="flex flex-row sm:flex-col items-center gap-1 order-2 sm:order-none">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveImage(index, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        ▲
                      </Button>
                      <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hidden sm:block" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveImage(index, 'down')}
                        disabled={index === carouselImages.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        ▼
                      </Button>
                    </div>

                    {/* Image Preview */}
                    <div className="w-20 h-14 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 order-1 sm:order-none">
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
                        }}
                      />
                    </div>

                    {/* Image Info - Mobile: beside image */}
                    <div className="flex-1 min-w-0 order-3 sm:order-none">
                      <h4 className="font-semibold text-xs sm:text-sm truncate">{image.title}</h4>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[150px] sm:max-w-none">{image.image_url}</p>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">Order: {image.order}</p>
                    </div>
                  </div>

                  {/* Mobile: Bottom row with toggle and delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0">
                    {/* Active Toggle */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${image.id}`} className="text-xs sm:text-sm">
                        {image.is_active ? 'Active' : 'Inactive'}
                      </Label>
                      <Switch
                        id={`active-${image.id}`}
                        checked={image.is_active}
                        onCheckedChange={() => handleToggleActive(image.id, image.is_active)}
                      />
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9"
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
