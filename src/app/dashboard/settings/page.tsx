
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Manage general application settings and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-3">
              <Label htmlFor="appName">App Name</Label>
              <Input id="appName" type="text" defaultValue="Scrapiz Admin" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="logo">Logo URL</Label>
              <Input id="logo" type="text" defaultValue="/logo.png" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input id="supportEmail" type="email" defaultValue="support@scrapiz.com" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="supportPhone">Support Phone</Label>
              <Input id="supportPhone" type="tel" defaultValue="+91 9999988888" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-3">
                    <Label htmlFor="working-hours-start">Working Hours Start</Label>
                    <Input id="working-hours-start" type="time" defaultValue="09:00" />
                </div>
                 <div className="grid gap-3">
                    <Label htmlFor="working-hours-end">Working Hours End</Label>
                    <Input id="working-hours-end" type="time" defaultValue="18:00" />
                </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save General Settings</Button>
        </CardFooter>
      </Card>

      {/* Business Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Business Settings</CardTitle>
          <CardDescription>
            Configure business rules like taxes, order minimums, and policies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid md:grid-cols-2 gap-6">
             <div className="grid gap-3">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input id="taxRate" type="number" defaultValue="5" />
            </div>
             <div className="grid gap-3">
              <Label htmlFor="minOrderAmount">Minimum Order Amount (₹)</Label>
              <Input id="minOrderAmount" type="number" defaultValue="100" />
            </div>
             <div className="grid gap-3">
              <Label htmlFor="freePickupThreshold">Free Pickup Threshold (₹)</Label>
              <Input id="freePickupThreshold" type="number" defaultValue="500" />
            </div>
             <div className="grid gap-3 md:col-span-2">
              <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
              <Textarea
                id="cancellationPolicy"
                placeholder="Enter your cancellation policy..."
                defaultValue="Orders can be cancelled up to 2 hours before the scheduled pickup time. A cancellation fee may apply afterwards."
                className="min-h-24"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save Business Settings</Button>
        </CardFooter>
      </Card>
      
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Enable or disable automatic notifications for different events.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="orderConfirmation" className="flex flex-col gap-1.5">
              <span>Order Confirmation</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Send a notification when an order is placed.
              </span>
            </Label>
            <Switch id="orderConfirmation" defaultChecked />
          </div>
           <div className="flex items-center justify-between">
            <Label htmlFor="driverAssignment" className="flex flex-col gap-1.5">
              <span>Driver Assignment</span>
               <span className="font-normal leading-snug text-muted-foreground">
                Notify customers when a driver is assigned.
              </span>
            </Label>
            <Switch id="driverAssignment" defaultChecked />
          </div>
           <div className="flex items-center justify-between">
            <Label htmlFor="orderCompletion" className="flex flex-col gap-1.5">
              <span>Order Completion</span>
               <span className="font-normal leading-snug text-muted-foreground">
                Send a summary after an order is completed.
              </span>
            </Label>
            <Switch id="orderCompletion" defaultChecked />
          </div>
           <div className="flex items-center justify-between">
            <Label htmlFor="priceUpdates" className="flex flex-col gap-1.5">
              <span>Price Updates</span>
               <span className="font-normal leading-snug text-muted-foreground">
                Notify users about changes in scrap prices.
              </span>
            </Label>
            <Switch id="priceUpdates" />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save Notification Settings</Button>
        </CardFooter>
      </Card>

      {/* Integration Settings */}
      <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
              Manage integrations with third-party services.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                 <Label htmlFor="payment-gateway">Payment Gateway</Label>
                 <p className="text-sm text-muted-foreground">Select and connect your payment provider.</p>
              </div>
              <div className="flex items-center gap-2">
                 <Select defaultValue="razorpay">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select gateway" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="razorpay">Razorpay</SelectItem>
                        <SelectItem value="paytm">Paytm</SelectItem>
                        <SelectItem value="phonepe">PhonePe</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline">Connect</Button>
              </div>
            </div>
             <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="sms-provider">SMS Provider</Label>
                <p className="text-sm text-muted-foreground">Connect to your SMS provider for notifications.</p>
              </div>
              <Button variant="outline">Connect</Button>
            </div>
             <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="email-provider">Email Provider</Label>
                <p className="text-sm text-muted-foreground">Connect to your email service for campaigns.</p>
              </div>
              <Button variant="outline">Connect</Button>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
