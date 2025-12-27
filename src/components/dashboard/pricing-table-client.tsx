
'use client'

import * as React from "react"
import { Pencil, History, CalendarClock, Send, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { ScrapCategory } from "@/lib/types"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "../ui/checkbox"

type PricingTableClientProps = {
    initialCategories: ScrapCategory[]
}

export default function PricingTableClient({ initialCategories }: PricingTableClientProps) {
    const [categories, setCategories] = React.useState(initialCategories);
    const [selectedCategory, setSelectedCategory] = React.useState<ScrapCategory | null>(null);
    const [newPrice, setNewPrice] = React.useState("");
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = React.useState(false);
    const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = React.useState(false);
    const [bulkUpdatePrices, setBulkUpdatePrices] = React.useState<Record<string, string>>({});

    const { toast } = useToast();

    const handleUpdateClick = (category: ScrapCategory) => {
        setSelectedCategory(category);
        setNewPrice(String(category.pricePerKg));
        setIsUpdateDialogOpen(true);
    };

    const handleHistoryClick = (category: ScrapCategory) => {
        setSelectedCategory(category);
        setIsHistoryDialogOpen(true);
    };

    const handleSavePrice = () => {
        if (selectedCategory) {
            const updatedCategories = categories.map(cat =>
                cat.id === selectedCategory.id
                    ? { 
                        ...cat, 
                        pricePerKg: parseFloat(newPrice), 
                        updatedAt: new Date().toISOString(),
                        priceHistory: [...cat.priceHistory, { date: cat.updatedAt, rate: cat.pricePerKg }]
                      }
                    : cat
            );
            setCategories(updatedCategories);
            toast({
                title: "Price Updated",
                description: `Price for ${selectedCategory.name} has been updated to ₹${newPrice}.`,
            });
            toast({
                title: "🚀 SMS Notification Sent",
                description: `Users will be notified of the price change for ${selectedCategory.name}.`,
            });
            setIsUpdateDialogOpen(false);
            setSelectedCategory(null);
        }
    };

    const handleBulkUpdateInputChange = (categoryId: string, value: string) => {
        setBulkUpdatePrices(prev => ({...prev, [categoryId]: value}));
    }

    const handleSaveBulkUpdate = () => {
        const updatedCategories = categories.map(cat => {
            const newBulkPrice = bulkUpdatePrices[cat.id];
            if (newBulkPrice && !isNaN(parseFloat(newBulkPrice))) {
                return {
                    ...cat,
                    pricePerKg: parseFloat(newBulkPrice),
                    updatedAt: new Date().toISOString(),
                    priceHistory: [...cat.priceHistory, { date: cat.updatedAt, rate: cat.pricePerKg }]
                }
            }
            return cat;
        });
        setCategories(updatedCategories);
        toast({
            title: "Bulk Prices Updated",
            description: "Selected scrap prices have been successfully updated.",
        });
        setIsBulkUpdateDialogOpen(false);
        setBulkUpdatePrices({});
    }

    const handleScheduleChange = () => {
        toast({
            title: "Scheduling Not Implemented",
            description: "This feature will be available in a future update.",
        })
    }

    return (
        <>
            <div className="flex items-center gap-2 mb-4">
                 <Button onClick={() => setIsBulkUpdateDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Update
                </Button>
                <Button variant="outline" onClick={handleScheduleChange}>
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Schedule Rate Change
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Current Rate (₹)</TableHead>
                        <TableHead className="hidden md:table-cell text-right">
                            Last Updated
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map((category) => (
                        <TableRow key={category.id}>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell className="capitalize">{category.unit}</TableCell>
                            <TableCell className="text-right">₹{category.pricePerKg.toFixed(2)}</TableCell>
                            <TableCell className="hidden md:table-cell text-right">
                                {format(new Date(category.updatedAt), "PPp")}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateClick(category)}
                                    className="mr-2"
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Update
                                </Button>
                                 <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleHistoryClick(category)}
                                >
                                    <History className="h-4 w-4 mr-2" />
                                    History
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {/* Update Price Dialog */}
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Update Price for {selectedCategory?.name}</DialogTitle>
                        <DialogDescription>
                            Set the new price per kilogram. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                                New Price (₹)
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" onClick={handleSavePrice}>Save & Notify</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Price History Dialog */}
            <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Price History for {selectedCategory?.name}</DialogTitle>
                         <DialogDescription>
                            Review the rate changes for this category over time.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-96 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Rate (₹)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...(selectedCategory?.priceHistory || []), {date: selectedCategory?.updatedAt || '', rate: selectedCategory?.pricePerKg || 0}]
                                .filter(entry => entry.date && !isNaN(new Date(entry.date).getTime()))
                                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{format(new Date(entry.date), "PPp")}</TableCell>
                                        <TableCell className="text-right">₹{entry.rate.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bulk Update Dialog */}
            <Dialog open={isBulkUpdateDialogOpen} onOpenChange={setIsBulkUpdateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Bulk Price Update</DialogTitle>
                        <DialogDescription>
                            Update prices for multiple categories at once.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                        {categories.map(cat => (
                             <div key={cat.id} className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor={`bulk-price-${cat.id}`} className="text-left col-span-1">
                                    {cat.name}
                                </Label>
                                <Input
                                    id={`bulk-price-${cat.id}`}
                                    type="number"
                                    placeholder={`Current: ₹${cat.pricePerKg}`}
                                    value={bulkUpdatePrices[cat.id] || ''}
                                    onChange={(e) => handleBulkUpdateInputChange(cat.id, e.target.value)}
                                    className="col-span-2"
                                />
                            </div>
                        ))}
                    </div>
                     <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkUpdateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveBulkUpdate}>Save Bulk Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
