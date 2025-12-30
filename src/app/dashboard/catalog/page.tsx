'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Plus, Edit, Trash2, Layers, Package, Search, Filter, Loader2, Image as ImageIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InventoryService, CategorySummary, ProductSummary } from "@/components/backend/apiService";

export default function CatalogPage() {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [activeTab, setActiveTab] = useState('categories');

  // Category Dialog State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategorySummary | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', image_url: '', image: null as File | null });
  const [savingCategory, setSavingCategory] = useState(false);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategorySummary | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  
  // Item Dialog State
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductSummary | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 0,
    min_rate: 0,
    max_rate: 0,
    unit: 'kg',
    description: '',
    image_url: '',
    image: null as File | null
  });
  const [savingItem, setSavingItem] = useState(false);
  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProductSummary | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);
  
  const { toast } = useToast();

  // Load data from backend
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
        description: error.message || "Failed to load catalog data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get product count per category
  const getProductCount = (categoryId: number) => {
    return products.filter(p => p.category === categoryId).length;
  };


  // Category Handlers
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', image_url: '', image: null });
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: CategorySummary) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, image_url: category.image_url || '', image: null });
    setIsCategoryDialogOpen(true);
  };

  const handleCategoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCategoryForm({ ...categoryForm, image: file, image_url: '' });
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({ title: "Error", description: "Category name is required", variant: "destructive" });
      return;
    }

    console.log('[handleSaveCategory] categoryForm:', categoryForm);
    console.log('[handleSaveCategory] image_url value:', categoryForm.image_url, 'length:', categoryForm.image_url?.length);

    try {
      setSavingCategory(true);
      if (editingCategory) {
        // For update, send image_url if it has a value, otherwise send null to clear it
        const updateData: { name: string; image_url?: string | null; image?: File } = {
          name: categoryForm.name,
        };
        
        if (categoryForm.image) {
          updateData.image = categoryForm.image;
        } else if (categoryForm.image_url && categoryForm.image_url.trim()) {
          updateData.image_url = categoryForm.image_url.trim();
        }
        
        console.log('[handleSaveCategory] Updating category with:', updateData);
        const updated = await InventoryService.updateCategory(editingCategory.id, updateData);
        setCategories(categories.map(cat => cat.id === editingCategory.id ? updated : cat));
        toast({ title: "✅ Category Updated", description: `${categoryForm.name} has been updated.` });
      } else {
        // For create, only include image_url if it has a value
        const createData: { name: string; image_url?: string; image?: File } = {
          name: categoryForm.name,
        };
        
        if (categoryForm.image) {
          createData.image = categoryForm.image;
        } else if (categoryForm.image_url && categoryForm.image_url.trim()) {
          createData.image_url = categoryForm.image_url.trim();
        }
        
        console.log('[handleSaveCategory] Creating category with:', createData);
        const newCategory = await InventoryService.createCategory(createData);
        setCategories([...categories, newCategory]);
        toast({ title: "✅ Category Added", description: `${categoryForm.name} has been added.` });
      }
      setIsCategoryDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save category", variant: "destructive" });
    } finally {
      setSavingCategory(false);
    }
  };


  const handleDeleteCategoryClick = (category: CategorySummary) => {
    setCategoryToDelete(category);
    setDeleteCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    const itemsInCategory = getProductCount(categoryToDelete.id);
    if (itemsInCategory > 0) {
      toast({ 
        title: "Cannot Delete", 
        description: `This category has ${itemsInCategory} product(s). Remove them first.`,
        variant: "destructive" 
      });
      setDeleteCategoryDialogOpen(false);
      return;
    }

    try {
      setDeletingCategory(true);
      await InventoryService.deleteCategory(categoryToDelete.id);
      setCategories(categories.filter(c => c.id !== categoryToDelete.id));
      toast({ title: "✅ Category Deleted", description: `${categoryToDelete.name} has been deleted.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete category", variant: "destructive" });
    } finally {
      setDeletingCategory(false);
      setDeleteCategoryDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  // Item Handlers
  const handleAddItem = () => {
    setEditingItem(null);
    setItemForm({ 
      name: '', 
      category: categories[0]?.id || 0, 
      min_rate: 0, 
      max_rate: 0, 
      unit: 'kg', 
      description: '',
      image_url: '',
      image: null
    });
    setIsItemDialogOpen(true);
  };

  const handleEditItem = (item: ProductSummary) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      category: item.category,
      min_rate: item.min_rate,
      max_rate: item.max_rate,
      unit: item.unit,
      description: item.description,
      image_url: item.image_url || '',
      image: null
    });
    setIsItemDialogOpen(true);
  };


  const handleItemFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setItemForm({ ...itemForm, image: file, image_url: '' });
    }
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) {
      toast({ title: "Error", description: "Product name is required", variant: "destructive" });
      return;
    }
    if (itemForm.min_rate <= 0 || itemForm.max_rate <= 0) {
      toast({ title: "Error", description: "Price rates must be greater than 0", variant: "destructive" });
      return;
    }
    if (itemForm.min_rate > itemForm.max_rate) {
      toast({ title: "Error", description: "Min rate cannot be greater than max rate", variant: "destructive" });
      return;
    }

    console.log('[handleSaveItem] itemForm:', itemForm);
    console.log('[handleSaveItem] image_url value:', itemForm.image_url, 'length:', itemForm.image_url?.length);

    try {
      setSavingItem(true);
      if (editingItem) {
        const updateData: any = {
          name: itemForm.name,
          category: itemForm.category,
          min_rate: itemForm.min_rate,
          max_rate: itemForm.max_rate,
          unit: itemForm.unit,
          description: itemForm.description,
        };
        
        if (itemForm.image) {
          updateData.image = itemForm.image;
        } else if (itemForm.image_url && itemForm.image_url.trim()) {
          updateData.image_url = itemForm.image_url.trim();
        }
        
        console.log('[handleSaveItem] Updating product with:', updateData);
        const updated = await InventoryService.updateProduct(editingItem.id, updateData);
        setProducts(products.map(p => p.id === editingItem.id ? updated : p));
        toast({ title: "✅ Product Updated", description: `${itemForm.name} has been updated.` });
      } else {
        const createData: any = {
          name: itemForm.name,
          category: itemForm.category,
          min_rate: itemForm.min_rate,
          max_rate: itemForm.max_rate,
          unit: itemForm.unit,
          description: itemForm.description,
        };
        
        if (itemForm.image) {
          createData.image = itemForm.image;
        } else if (itemForm.image_url && itemForm.image_url.trim()) {
          createData.image_url = itemForm.image_url.trim();
        }
        
        console.log('[handleSaveItem] Creating product with:', createData);
        const newProduct = await InventoryService.createProduct(createData);
        setProducts([...products, newProduct]);
        toast({ title: "✅ Product Added", description: `${itemForm.name} has been added.` });
      }
      setIsItemDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save product", variant: "destructive" });
    } finally {
      setSavingItem(false);
    }
  };


  const handleDeleteItemClick = (item: ProductSummary) => {
    setItemToDelete(item);
    setDeleteItemDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      setDeletingItem(true);
      await InventoryService.deleteProduct(itemToDelete.id);
      setProducts(products.filter(p => p.id !== itemToDelete.id));
      toast({ title: "✅ Product Deleted", description: `${itemToDelete.name} has been deleted.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete product", variant: "destructive" });
    } finally {
      setDeletingItem(false);
      setDeleteItemDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Filter items
  const filteredItems = products.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
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
      {/* Header */}
      <div className="flex flex-col gap-2 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">Catalog Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage scrap categories and products in one place</p>
        </div>
      </div>


      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-1 sm:gap-2">
              <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Total Categories</span>
              <span className="sm:hidden">Categories</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">{categories.length}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1 sm:gap-2">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Total Products</span>
              <span className="sm:hidden">Products</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">{products.length}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-background">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">
              <span className="hidden sm:inline">Avg Min Rate</span>
              <span className="sm:hidden">Avg Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100">
              ₹{products.length > 0 ? (products.reduce((sum, p) => sum + p.min_rate, 0) / products.length).toFixed(0) : 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-background">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">With Images</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-100">
              {categories.filter(c => c.image_url).length + products.filter(p => p.image_url).length}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories" className="text-xs sm:text-sm">
            <Layers className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Categories</span>
            <span className="sm:hidden">Cat.</span>
            <span className="ml-1">({categories.length})</span>
          </TabsTrigger>
          <TabsTrigger value="items" className="text-xs sm:text-sm">
            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Products</span>
            <span className="sm:hidden">Prod.</span>
            <span className="ml-1">({products.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Manage scrap categories</p>
            <Button onClick={handleAddCategory} size="sm" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto sm:size-default">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Add Category</span>
            </Button>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(category => (
              <Card key={category.id} className="border-green-100 hover:shadow-md transition-shadow">
                <CardHeader className="p-3 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {category.image_url ? (
                        <img src={category.image_url} alt={category.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-green-100 flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <CardTitle className="text-sm sm:text-base text-green-900 dark:text-green-100 truncate">{category.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{getProductCount(category.id)} products</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditCategory(category)} className="flex-1 h-8 sm:h-9 text-xs sm:text-sm">
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteCategoryClick(category)} className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>


        {/* Products Tab */}
        <TabsContent value="items" className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 sm:h-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter.toString()} onValueChange={(v) => setCategoryFilter(v === 'all' ? 'all' : parseInt(v))}>
                  <SelectTrigger className="flex-1 sm:w-[180px] h-9 sm:h-10">
                    <span className="flex items-center gap-2">
                      <Filter className="h-4 w-4 hidden sm:block" />
                      <SelectValue placeholder="Category" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddItem} size="sm" className="bg-green-600 hover:bg-green-700 sm:size-default" disabled={categories.length === 0}>
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Product</span>
                </Button>
              </div>
            </div>
          </div>

          <Card className="border-green-100">
            <CardContent className="p-0 sm:pt-6 sm:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="hidden md:table-cell">Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="hidden lg:table-cell">Unit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No products found</TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="hidden sm:table-cell">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-green-100 flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 sm:block">
                              {/* Mobile: Show image inline */}
                              <div className="sm:hidden">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="w-8 h-8 rounded object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                                    <ImageIcon className="h-4 w-4 text-green-600" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-medium text-xs sm:text-sm block">{item.name}</span>
                                {/* Mobile: Show category below name */}
                                <span className="md:hidden text-[10px] sm:text-xs text-muted-foreground">{getCategoryName(item.category)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-xs">{getCategoryName(item.category)}</Badge></TableCell>
                          <TableCell className="font-semibold text-green-600 text-xs sm:text-sm whitespace-nowrap">₹{item.min_rate}-{item.max_rate}</TableCell>
                          <TableCell className="hidden lg:table-cell text-xs sm:text-sm">{item.unit}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 sm:gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditItem(item)} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteItemClick(item)} className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
        </TabsContent>
      </Tabs>


      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingCategory ? 'Update category details' : 'Create a new scrap category'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="cat-name" className="text-xs sm:text-sm">Category Name</Label>
              <Input
                id="cat-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Paper, Plastic"
                disabled={savingCategory}
                className="h-9 sm:h-10"
              />
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label className="text-xs sm:text-sm">Image</Label>
              <div className="flex gap-2">
                <Input
                  value={categoryForm.image_url}
                  onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value, image: null })}
                  placeholder="https://s3.amazonaws.com/... or upload"
                  disabled={savingCategory || !!categoryForm.image}
                  className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                />
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleCategoryFileChange} className="hidden" disabled={savingCategory} />
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" disabled={savingCategory}>
                    <span><Upload className="h-4 w-4" /></span>
                  </Button>
                </label>
              </div>
              {categoryForm.image && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
                  <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate max-w-[150px] sm:max-w-none">{categoryForm.image.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCategoryForm({ ...categoryForm, image: null })} className="h-6 px-2 text-red-500 text-xs">Remove</Button>
                </div>
              )}
            </div>
            {(categoryForm.image_url || categoryForm.image) && (
              <div className="grid gap-1.5 sm:gap-2">
                <Label className="text-xs sm:text-sm">Preview</Label>
                <img src={categoryForm.image ? URL.createObjectURL(categoryForm.image) : categoryForm.image_url} alt="Preview" className="w-full h-24 sm:h-32 object-cover rounded border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)} disabled={savingCategory} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSaveCategory} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" disabled={savingCategory}>
              {savingCategory ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <>{editingCategory ? 'Update' : 'Add'} Category</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{editingItem ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingItem ? 'Update product details' : 'Create a new scrap product'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="item-name" className="text-xs sm:text-sm">Product Name</Label>
              <Input id="item-name" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="e.g., Newspaper, PET Bottles" disabled={savingItem} className="h-9 sm:h-10" />
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="item-category" className="text-xs sm:text-sm">Category</Label>
              <Select value={itemForm.category.toString()} onValueChange={(v) => setItemForm({ ...itemForm, category: parseInt(v) })} disabled={savingItem}>
                <SelectTrigger className="h-9 sm:h-10">
                <span className="flex items-center">
                  <SelectValue placeholder="Select category" />
                </span>
              </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (<SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="item-min" className="text-xs sm:text-sm">Min Rate (₹)</Label>
                <Input id="item-min" type="number" value={itemForm.min_rate} onChange={(e) => setItemForm({ ...itemForm, min_rate: parseFloat(e.target.value) || 0 })} disabled={savingItem} className="h-9 sm:h-10" />
              </div>
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="item-max" className="text-xs sm:text-sm">Max Rate (₹)</Label>
                <Input id="item-max" type="number" value={itemForm.max_rate} onChange={(e) => setItemForm({ ...itemForm, max_rate: parseFloat(e.target.value) || 0 })} disabled={savingItem} className="h-9 sm:h-10" />
              </div>
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="item-unit" className="text-xs sm:text-sm">Unit</Label>
              <Input id="item-unit" value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} placeholder="kg, piece, ton" disabled={savingItem} className="h-9 sm:h-10" />
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="item-desc" className="text-xs sm:text-sm">Description</Label>
              <Textarea id="item-desc" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} placeholder="Product description..." rows={2} disabled={savingItem} className="text-sm" />
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label className="text-xs sm:text-sm">Image</Label>
              <div className="flex gap-2">
                <Input value={itemForm.image_url} onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value, image: null })} placeholder="https://s3.amazonaws.com/... or upload" disabled={savingItem || !!itemForm.image} className="flex-1 h-9 sm:h-10 text-xs sm:text-sm" />
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleItemFileChange} className="hidden" disabled={savingItem} />
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" asChild disabled={savingItem}><span><Upload className="h-4 w-4" /></span></Button>
                </label>
              </div>
              {itemForm.image && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
                  <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" /><span className="truncate max-w-[150px] sm:max-w-none">{itemForm.image.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setItemForm({ ...itemForm, image: null })} className="h-6 px-2 text-red-500 text-xs">Remove</Button>
                </div>
              )}
            </div>
            {(itemForm.image_url || itemForm.image) && (
              <div className="grid gap-1.5 sm:gap-2">
                <Label className="text-xs sm:text-sm">Preview</Label>
                <img src={itemForm.image ? URL.createObjectURL(itemForm.image) : itemForm.image_url} alt="Preview" className="w-full h-24 sm:h-32 object-cover rounded border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)} disabled={savingItem} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSaveItem} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" disabled={savingItem}>
              {savingItem ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <>{editingItem ? 'Update' : 'Add'} Product</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Delete Category Dialog */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingCategory}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} disabled={deletingCategory} className="bg-red-600 hover:bg-red-700">
              {deletingCategory ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Dialog */}
      <AlertDialog open={deleteItemDialogOpen} onOpenChange={setDeleteItemDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingItem}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} disabled={deletingItem} className="bg-red-600 hover:bg-red-700">
              {deletingItem ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
