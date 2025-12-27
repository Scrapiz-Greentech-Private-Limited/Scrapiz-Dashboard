'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, PlusCircle, Trash2 } from "lucide-react"

export default function ContentPage() {
  const handleSelectFile = () => {
    alert('File selection dialog would open here');
    // TODO: Implement file upload
  };

  const handleDeleteBanner = (bannerId: string) => {
    if (confirm('Are you sure you want to delete this banner?')) {
      alert(`Banner ${bannerId} deleted`);
      // TODO: Implement delete banner
    }
  };

  const handleSaveGuidelines = () => {
    alert('Guidelines saved successfully!');
    // TODO: Implement save guidelines
  };

  const handleAddFAQ = () => {
    alert('Add FAQ dialog would open here');
    // TODO: Implement add FAQ
  };

  const handleSaveAllContent = () => {
    alert('All content saved successfully!');
    // TODO: Implement save all content
  };

  return (
    <div className="grid gap-6">
      {/* Banner Management */}
      <Card>
        <CardHeader>
          <CardTitle>Banner Management</CardTitle>
          <CardDescription>
            Manage the promotional banners displayed on the app's home screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="relative group flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground p-4 text-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drop image here or</p>
                <Button variant="outline" size="sm" onClick={handleSelectFile}>Select File</Button>
            </div>
             <div className="relative group">
                <img src="https://picsum.photos/seed/banner1/600/300" alt="Banner 1" className="rounded-lg object-cover aspect-video"/>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteBanner('banner1')}><Trash2 className="h-4 w-4"/></Button>
                </div>
            </div>
             <div className="relative group">
                <img src="https://picsum.photos/seed/banner2/600/300" alt="Banner 2" className="rounded-lg object-cover aspect-video"/>
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteBanner('banner2')}><Trash2 className="h-4 w-4"/></Button>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Guidelines</CardTitle>
          <CardDescription>
            Update the list of items you do and don't accept.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Label htmlFor="guidelines-dont-buy">Things We Don't Buy</Label>
            <Textarea
              id="guidelines-dont-buy"
              placeholder="List items separated by commas..."
              defaultValue="Hazardous waste, bio-medical items, wet waste, glass bottles..."
              className="min-h-24"
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSaveGuidelines} className="bg-green-600 hover:bg-green-700">Save Guidelines</Button>
        </CardFooter>
      </Card>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions (FAQs)</CardTitle>
          <CardDescription>Add, edit, or delete questions and answers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I schedule a pickup?</AccordionTrigger>
              <AccordionContent>
                You can schedule a pickup directly from the app by selecting your scrap category, estimating the weight, and choosing a convenient time slot.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How is the price determined?</AccordionTrigger>
              <AccordionContent>
                The price is based on the daily market rate for each scrap category, which you can view on the Pricing screen. The final amount is calculated after our agent weighs the scrap.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>When will I get paid?</AccordionTrigger>
              <AccordionContent>
                Payment is transferred to your registered bank account or UPI within 24 hours of a completed pickup.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-end">
            <Button onClick={handleAddFAQ} className="bg-green-600 hover:bg-green-700">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add FAQ
            </Button>
        </CardFooter>
      </Card>

      {/* Legal & Other Content */}
      <Card>
          <CardHeader>
            <CardTitle>Legal & Information Pages</CardTitle>
            <CardDescription>
              Update the content for your app's legal and informational pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
             <div className="grid gap-3">
              <Label htmlFor="about-us">About Us</Label>
              <Textarea
                id="about-us"
                placeholder="Tell your company's story..."
                className="min-h-32"
                defaultValue="Scrapiz is dedicated to making recycling easy and rewarding for everyone. Our mission is to build a sustainable future, one pickup at a time."
              />
            </div>
             <div className="grid gap-3">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                placeholder="Enter your terms and conditions..."
                className="min-h-32"
                defaultValue="By using the Scrapiz app, you agree to our terms of service..."
              />
            </div>
             <div className="grid gap-3">
              <Label htmlFor="privacy">Privacy Policy</Label>
              <Textarea
                id="privacy"
                placeholder="Enter your privacy policy..."
                className="min-h-32"
                defaultValue="Your privacy is important to us. This policy explains what information we collect and how we use it..."
              />
            </div>
          </CardContent>
           <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSaveAllContent} className="bg-green-600 hover:bg-green-700">Save All Content</Button>
          </CardFooter>
        </Card>
    </div>
  );
}
