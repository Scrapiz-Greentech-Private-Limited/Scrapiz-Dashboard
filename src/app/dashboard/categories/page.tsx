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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">Scrap Categories</h2>
          <p className="text-muted-foreground">Manage scrap categories and their associated products</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{categories.length}</div>
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{products.length}</div>
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">With Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {categories.filter(c => c.image_url).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map(category => {
          const productCount = getProductCount(category.id);
          return (
            <Card key={category.id} className="border-green-100">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {category.image_url ? (
                      <img 
                        src={category.image_url} 
                        alt={category.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-green-100 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-green-600" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-green-900 dark:text-green-100">{category.name}</CardTitle>
                      <CardDescription>{productCount} product{productCount !== 1 ? 's' : ''}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(category)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClick(category)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update category details' : 'Create a new scrap category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Paper, Plastic, Metal"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex gap-2">
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value, image: null })}
                  placeholder="https://s3.amazonaws.com/... or upload below"
                  disabled={saving || !!formData.image}
                  className="flex-1"
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
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <ImageIcon className="h-4 w-4" />
                  {formData.image.name}
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
                <Label>Image Preview</Label>
                <img 
                  src={formData.image ? URL.createObjectURL(formData.image) : formData.image_url} 
                  alt="Preview"
                  className="w-full h-32 object-cover rounded border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
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
