'use client'

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { Payment } from "@/lib/types"
import { users } from "@/lib/data"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { CreditCard } from "lucide-react"

type PaymentsTableClientProps = {
    payments: Payment[]
}

const paymentStatusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    completed: "default",
    pending: "secondary",
    failed: "destructive",
}

const paymentTypeCopy: { [key: string]: string } = {
    sellerPayout: "Seller Payout",
    agentPayout: "Agent Payout",
    scrapPurchase: "Scrap Purchase",
}


export default function PaymentsTableClient({ payments: initialPayments }: PaymentsTableClientProps) {
    const [payments, setPayments] = React.useState(initialPayments);
    const { toast } = useToast();

    const handlePayout = (paymentId: string) => {
        setPayments(payments.map(p => p.id === paymentId ? {...p, status: 'completed'} : p));
        toast({
            title: "Payout Processed",
            description: `Payment ${paymentId} has been marked as completed.`,
        });
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>
                        <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {payments.map((payment) => {
                    const user = users.find(u => u.id === payment.userId);
                    return (
                        <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.id}</TableCell>
                            <TableCell>{user?.name || 'N/A'}</TableCell>
                            <TableCell>{paymentTypeCopy[payment.type]}</TableCell>
                            <TableCell>
                                <Badge variant={paymentStatusVariant[payment.status]} className="capitalize">
                                    {payment.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                {format(new Date(payment.createdAt), "PPp")}
                            </TableCell>
                            <TableCell className="text-right">₹{payment.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                                {payment.status === 'pending' && (
                                    <Button size="sm" onClick={() => handlePayout(payment.id)}>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Process Payout
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}
