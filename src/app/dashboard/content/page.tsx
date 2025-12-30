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
    <div className="grid gap-4 sm:gap-6">
      {/* Banner Management */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Banner Management</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage promotional banners on the app's home screen.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Upload area */}
            <div className="relative group flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground p-4 sm:p-6 text-center min-h-[120px] sm:min-h-[150px]">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                <p className="text-xs sm:text-sm text-muted-foreground">Drop image here or</p>
                <Button variant="outline" size="sm" onClick={handleSelectFile} className="h-8 text-xs sm:text-sm">Select File</Button>
            </div>
            {/* Banner 1 */}
            <div className="relative group">
                <img src="https://picsum.photos/seed/banner1/600/300" alt="Banner 1" className="rounded-lg object-cover aspect-video w-full"/>
                {/* Show delete button always on mobile, hover on desktop */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-lg">
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteBanner('banner1')} className="h-9 w-9 sm:h-10 sm:w-10">
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            </div>
            {/* Banner 2 */}
            <div className="relative group">
                <img src="https://picsum.photos/seed/banner2/600/300" alt="Banner 2" className="rounded-lg object-cover aspect-video w-full"/>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-lg">
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteBanner('banner2')} className="h-9 w-9 sm:h-10 sm:w-10">
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Guidelines</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Update the list of items you do and don't accept.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="grid gap-3 sm:gap-4">
            <Label htmlFor="guidelines-dont-buy" className="text-sm sm:text-base">Things We Don't Buy</Label>
            <Textarea
              id="guidelines-dont-buy"
              placeholder="List items separated by commas..."
              defaultValue="Hazardous waste, bio-medical items, wet waste, glass bottles..."
              className="min-h-20 sm:min-h-24 text-sm"
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-4 sm:px-6 py-3 sm:py-4">
          <Button onClick={handleSaveGuidelines} className="bg-green-600 hover:bg-green-700 h-9 sm:h-10 text-sm w-full sm:w-auto">Save Guidelines</Button>
        </CardFooter>
      </Card>

      {/* FAQs */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Frequently Asked Questions</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Add, edit, or delete questions and answers.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-sm sm:text-base text-left">How do I schedule a pickup?</AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm">
                You can schedule a pickup directly from the app by selecting your scrap category, estimating the weight, and choosing a convenient time slot.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-sm sm:text-base text-left">How is the price determined?</AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm">
                The price is based on the daily market rate for each scrap category, which you can view on the Pricing screen. The final amount is calculated after our agent weighs the scrap.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-sm sm:text-base text-left">When will I get paid?</AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm">
                Payment is transferred to your registered bank account or UPI within 24 hours of a completed pickup.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter className="border-t px-4 sm:px-6 py-3 sm:py-4 flex justify-end">
            <Button onClick={handleAddFAQ} className="bg-green-600 hover:bg-green-700 h-9 sm:h-10 text-sm w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add FAQ
            </Button>
        </CardFooter>
      </Card>

      {/* Legal & Other Content */}
      <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Legal & Information Pages</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Update content for your app's legal and informational pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 grid gap-4 sm:gap-6">
             <div className="grid gap-2 sm:gap-3">
              <Label htmlFor="about-us" className="text-sm sm:text-base">About Us</Label>
              <Textarea
                id="about-us"
                placeholder="Tell your company's story..."
                className="min-h-24 sm:min-h-32 text-sm"
                defaultValue="Scrapiz is dedicated to making recycling easy and rewarding for everyone. Our mission is to build a sustainable future, one pickup at a time."
              />
            </div>
             <div className="grid gap-2 sm:gap-3">
              <Label htmlFor="terms" className="text-sm sm:text-base">Terms & Conditions</Label>
              <Textarea
                id="terms"
                placeholder="Enter your terms and conditions..."
                className="min-h-24 sm:min-h-32 text-sm"
                defaultValue="By using the Scrapiz app, you agree to our terms of service..."
              />
            </div>
             <div className="grid gap-2 sm:gap-3">
              <Label htmlFor="privacy" className="text-sm sm:text-base">Privacy Policy</Label>
              <Textarea
                id="privacy"
                placeholder="Enter your privacy policy..."
                className="min-h-24 sm:min-h-32 text-sm"
                defaultValue="Your privacy is important to us. This policy explains what information we collect and how we use it..."
              />
            </div>
          </CardContent>
           <CardFooter className="border-t px-4 sm:px-6 py-3 sm:py-4">
            <Button onClick={handleSaveAllContent} className="bg-green-600 hover:bg-green-700 h-9 sm:h-10 text-sm w-full sm:w-auto">Save All Content</Button>
          </CardFooter>
        </Card>
    </div>
  );
}
