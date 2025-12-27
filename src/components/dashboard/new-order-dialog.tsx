
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { scrapCategories } from '@/lib/data';
import type { Order, User } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NewOrderDialogProps {
  sellers: User[];
  onOrderCreate: (newOrder: Omit<Order, 'id' | 'createdAt' | 'status'>) => void;
}

export default function NewOrderDialog({ sellers, onOrderCreate }: NewOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [scrapCategory, setScrapCategory] = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState('');
  const [pickupTime, setPickupTime] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const selectedSeller = sellers.find(s => s.id === selectedSellerId);

  const handleSubmit = () => {
    if (!selectedSellerId || !scrapCategory || !estimatedWeight || !pickupTime) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill out all fields to create an order.',
      });
      return;
    }

    const pricePerKg = scrapCategories.find(c => c.name === scrapCategory)?.pricePerKg ?? 0;

    onOrderCreate({
      sellerId: selectedSellerId,
      scrapCategory,
      estimatedWeight: parseFloat(estimatedWeight),
      pickupAddress: selectedSeller?.address || '',
      pickupTime: pickupTime.toISOString(),
      pricePerKg,
    });

    toast({
      title: 'Order Created',
      description: 'The new scrap pickup order has been successfully created.',
    });

    // Reset form and close dialog
    setOpen(false);
    setSelectedSellerId(null);
    setScrapCategory('');
    setEstimatedWeight('');
    setPickupTime(new Date());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Create Order
            </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Fill in the details below to schedule a new scrap pickup.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="seller" className="text-right">
              Seller
            </Label>
            <Select onValueChange={setSelectedSellerId} value={selectedSellerId || ''}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a seller" />
              </SelectTrigger>
              <SelectContent>
                {sellers.map(seller => (
                  <SelectItem key={seller.id} value={seller.id}>
                    {seller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select onValueChange={setScrapCategory} value={scrapCategory}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {scrapCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="weight" className="text-right">
              Est. Weight (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              value={estimatedWeight}
              onChange={e => setEstimatedWeight(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Pickup Address
            </Label>
            <Input
              id="address"
              value={selectedSeller?.address || ''}
              readOnly
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pickup-time" className="text-right">
              Pickup Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'col-span-3 justify-start text-left font-normal',
                    !pickupTime && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {pickupTime ? format(pickupTime, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={pickupTime}
                  onSelect={setPickupTime}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

