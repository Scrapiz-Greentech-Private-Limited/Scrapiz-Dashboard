'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Search, Loader2, Image as ImageIcon, Trash2, Upload } from "lucide-react";
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

export default function ItemsPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductSummary | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 0,
    min_rate: 0,
    max_rate: 0,
    unit: 'kg',
    description: '',
    image_url: '',
    image: null as File | null
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Load products and categories from backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        InventoryService.getProducts(),
        InventoryService.getCategories()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({ 
      name: '', 
      category: categories[0]?.id || 0, 
      min_rate: 0, 
      max_rate: 0, 
      unit: 'kg', 
      description: '',
      image_url: '',
      image: null
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (product: ProductSummary) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      min_rate: product.min_rate,
      max_rate: product.max_rate,
      unit: product.unit,
      description: product.description,
      image_url: product.image_url || '',
      image: null
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (product: ProductSummary) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      setDeleting(true);
      await InventoryService.deleteProduct(productToDelete.id);
      setProducts(products.filter(p => p.id !== productToDelete.id));
      toast({
        title: "✅ Product Deleted",
        description: `${productToDelete.name} has been deleted.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
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
      toast({ title: "Error", description: "Product name is required", variant: "destructive" });
      return;
    }
    if (formData.min_rate <= 0 || formData.max_rate <= 0) {
      toast({ title: "Error", description: "Price rates must be greater than 0", variant: "destructive" });
      return;
    }
    if (formData.min_rate > formData.max_rate) {
      toast({ title: "Error", description: "Min rate cannot be greater than max rate", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      if (editingProduct) {
        const updated = await InventoryService.updateProduct(editingProduct.id, {
          name: formData.name,
          category: formData.category,
          min_rate: formData.min_rate,
          max_rate: formData.max_rate,
          unit: formData.unit,
          description: formData.description,
          image_url: formData.image_url || null,
          image: formData.image || undefined
        });
        setProducts(products.map(p => p.id === editingProduct.id ? updated : p));
        toast({ title: "✅ Product Updated", description: `${formData.name} has been updated.` });
      } else {
        const newProduct = await InventoryService.createProduct({
          name: formData.name,
          category: formData.category,
          min_rate: formData.min_rate,
          max_rate: formData.max_rate,
          unit: formData.unit,
          description: formData.description,
          image_url: formData.image_url || undefined,
          image: formData.image || undefined
        });
        setProducts([...products, newProduct]);
        toast({ title: "✅ Product Added", description: `${formData.name} has been added.` });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
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
          <h2 className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">Products</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage scrap products and pricing</p>
        </div>
        <Button onClick={handleAdd} className="gap-2 w-full sm:w-auto" disabled={categories.length === 0}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">{categories.length}</div>
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100">
              <span className="hidden sm:inline">Avg Min Rate</span>
              <span className="sm:hidden">Avg Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
              ₹{products.length > 0 ? (products.reduce((sum, p) => sum + p.min_rate, 0) / products.length).toFixed(0) : 0}
            </div>
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
              {products.filter(p => p.image_url).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filterCategory.toString()} onValueChange={(value) => setFilterCategory(value === 'all' ? 'all' : parseInt(value))}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card className="border-green-100">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell w-[60px]">Image</TableHead>
                  <TableHead className="min-w-[150px]">Product</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden sm:table-cell">Price Range</TableHead>
                  <TableHead className="hidden lg:table-cell">Unit</TableHead>
                  <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map(product => (
                    <TableRow key={product.id}>
                      <TableCell className="hidden sm:table-cell">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-green-600" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 sm:gap-0">
                          {/* Mobile: Show image inline */}
                          <div className="sm:hidden flex-shrink-0">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-green-600" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            {/* Mobile: Show category and price inline */}
                            <div className="md:hidden">
                              <Badge variant="outline" className="text-xs mt-0.5">{getCategoryName(product.category)}</Badge>
                            </div>
                            <p className="text-xs text-green-600 font-semibold sm:hidden mt-0.5">
                              ₹{product.min_rate} - ₹{product.max_rate}/{product.unit}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{getCategoryName(product.category)}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-semibold text-green-600">
                        ₹{product.min_rate} - ₹{product.max_rate}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{product.unit}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(product)} className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteClick(product)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 sm:h-9 sm:w-9"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingProduct ? 'Update product details and pricing' : 'Create a new scrap product'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Newspaper, PET Bottles"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm">Category</Label>
              <Select 
                value={formData.category.toString()} 
                onValueChange={(value) => setFormData({ ...formData, category: parseInt(value) })}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_rate" className="text-sm">Min Rate (₹)</Label>
                <Input
                  id="min_rate"
                  type="number"
                  value={formData.min_rate}
                  onChange={(e) => setFormData({ ...formData, min_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_rate" className="text-sm">Max Rate (₹)</Label>
                <Input
                  id="max_rate"
                  type="number"
                  value={formData.max_rate}
                  onChange={(e) => setFormData({ ...formData, max_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  disabled={saving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit" className="text-sm">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="kg, piece, ton, etc."
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description..."
                rows={2}
                className="min-h-[60px] sm:min-h-[80px]"
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
                  <span className="truncate max-w-[150px] sm:max-w-[250px]">{formData.image.name}</span>
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
                <>{editingProduct ? 'Update' : 'Add'} Product</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
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
