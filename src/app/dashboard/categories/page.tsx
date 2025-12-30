'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InventoryService, CategorySummary, ProductSummary } from "@/components/backend/apiService";
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategorySummary | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    image: null as File | null
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategorySummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Load categories and products from backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, productsData] = await Promise.all([
        InventoryService.getCategories(),
        InventoryService.getProducts()
      ]);
      setCategories(categoriesData);
      setProducts(productsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Count products per category
  const getProductCount = (categoryId: number) => {
    return products.filter(p => p.category === categoryId).length;
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', image_url: '', image: null });
    setIsDialogOpen(true);
  };

  const handleEdit = (category: CategorySummary) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      image_url: category.image_url || '',
      image: null
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (category: CategorySummary) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    
    const productCount = getProductCount(categoryToDelete.id);
    if (productCount > 0) {
      toast({
        title: "Cannot Delete",
        description: `This category has ${productCount} product(s). Remove them first.`,
        variant: "destructive"
      });
      setDeleteDialogOpen(false);
      return;
    }

    try {
      setDeleting(true);
      await InventoryService.deleteCategory(categoryToDelete.id);
      setCategories(categories.filter(c => c.id !== categoryToDelete.id));
      toast({
        title: "✅ Category Deleted",
        description: `${categoryToDelete.name} has been deleted.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file, image_url: '' });
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        // Update existing
        const updated = await InventoryService.updateCategory(editingCategory.id, {
          name: formData.name,
          image_url: formData.image_url || null,
          image: formData.image || undefined
        });
        setCategories(categories.map(cat =>
          cat.id === editingCategory.id ? updated : cat
        ));
        toast({
          title: "✅ Category Updated",
          description: `${formData.name} has been updated successfully.`
        });
      } else {
        // Add new
        const newCategory = await InventoryService.createCategory({
          name: formData.name,
          image_url: formData.image_url || undefined,
          image: formData.image || undefined
        });
        setCategories([...categories, newCategory]);
        toast({
          title: "✅ Category Added",
          description: `${formData.name} has been added successfully.`
        });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">Scrap Categories</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage scrap categories and their associated products</p>
        </div>
        <Button onClick={handleAdd} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-3">
        <Card className="border-green-100">
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100">
              <span className="hidden sm:inline">Total Categories</span>
              <span className="sm:hidden">Categories</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">{categories.length}</div>
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100">
              <span className="hidden sm:inline">Total Products</span>
              <span className="sm:hidden">Products</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">{products.length}</div>
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100">
              <span className="hidden sm:inline">With Images</span>
              <span className="sm:hidden">Images</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
              {categories.filter(c => c.image_url).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(category => {
          const productCount = getProductCount(category.id);
          return (
            <Card key={category.id} className="border-green-100">
              <CardHeader className="p-3 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {category.image_url ? (
                      <img 
                        src={category.image_url} 
                        alt={category.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-green-900 dark:text-green-100 text-sm sm:text-base truncate">{category.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">{productCount} product{productCount !== 1 ? 's' : ''}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(category)}
                    className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClick(category)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 sm:h-9 sm:w-9 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingCategory ? 'Update category details' : 'Create a new scrap category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">Category Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Paper, Plastic, Metal"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Image</Label>
              <div className="flex gap-2">
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value, image: null })}
                  placeholder="https://... or upload"
                  disabled={saving || !!formData.image}
                  className="flex-1 text-sm"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={saving}
                  />
                  <Button type="button" variant="outline" size="icon" asChild disabled={saving}>
                    <span><Upload className="h-4 w-4" /></span>
                  </Button>
                </label>
              </div>
              {formData.image && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600 flex-wrap">
                  <ImageIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">{formData.image.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({ ...formData, image: null })}
                    className="h-6 px-2 text-red-500"
                  >
                    Remove
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload an image or provide an S3 URL
              </p>
            </div>
            {(formData.image_url || formData.image) && (
              <div className="space-y-2">
                <Label className="text-sm">Image Preview</Label>
                <img 
                  src={formData.image ? URL.createObjectURL(formData.image) : formData.image_url} 
                  alt="Preview"
                  className="w-full h-24 sm:h-32 object-cover rounded border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{editingCategory ? 'Update' : 'Add'} Category</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={deleting} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
