
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { scrapCategories } from "@/lib/data"
import PricingTableClient from "@/components/dashboard/pricing-table-client"

export default function PricingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scrap Pricing</CardTitle>
        <CardDescription>
          Set and update scrap pricing per category to reflect market rates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PricingTableClient initialCategories={scrapCategories} />
      </CardContent>
    </Card>
  )
}
