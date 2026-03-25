"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Package } from "lucide-react";
import { toast } from "sonner";
import type { Transaction } from "@/lib/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    order_id: "",
  });

  useEffect(() => {
    loadTransactions();
    loadReconciliation();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type && filters.type !== "all") params.append("type", filters.type);
      if (filters.status && filters.status !== "all") params.append("status", filters.status);
      if (filters.order_id) params.append("order_id", filters.order_id);

      const response = await fetch(`/api/admin/transactions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const loadReconciliation = async () => {
    try {
      const response = await fetch("/api/admin/transactions/reconciliation");
      if (response.ok) {
        const data = await response.json();
        setReconciliation(data);
      }
    } catch (error) {
      console.error("Failed to load reconciliation:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      completed: "default",
      rejected: "destructive",
      failed: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "refund":
      case "refund_request":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleString() : "—";

  const openDetail = (tx: Transaction) => {
    setSelectedTx(tx);
    setDetailOpen(true);
  };

  if (loading && !reconciliation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">
          View all financial transactions and reconciliation
        </p>
      </div>

      {/* Reconciliation Summary */}
      {reconciliation && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="py-4">
            <CardContent className="flex flex-col gap-1 px-4 pt-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Payments</span>
                <TrendingUp className="h-4 w-4 shrink-0 text-green-500" />
              </div>
              <div className="text-xl font-bold text-green-600">
                ${reconciliation.total_payments.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="py-4">
            <CardContent className="flex flex-col gap-1 px-4 pt-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Refunds</span>
                <TrendingDown className="h-4 w-4 shrink-0 text-red-500" />
              </div>
              <div className="text-xl font-bold text-red-600">
                ${reconciliation.total_refunds.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="py-4">
            <CardContent className="flex flex-col gap-1 px-4 pt-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Pending Refunds</span>
                <AlertCircle className="h-4 w-4 shrink-0 text-orange-500" />
              </div>
              <div className="text-xl font-bold text-orange-600">
                ${(reconciliation.pending_refunds || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="py-4">
            <CardContent className="flex flex-col gap-1 px-4 pt-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Net Amount</span>
                <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold">
                ${(reconciliation.net_amount || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="py-4">
        <CardContent className="pt-0">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Type</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) => setFilters({ ...filters, type: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="refund_request">Refund Request</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="order_modification">Order Modification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Order ID</Label>
              <Input
                placeholder="Filter by order ID"
                value={filters.order_id}
                onChange={(e) => setFilters({ ...filters, order_id: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Data Table */}
      <Card className="py-4">
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">All Transactions</h3>
              <p className="text-sm text-muted-foreground">
                {transactions.length} transaction(s) found
              </p>
            </div>
          </div>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Paid By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="flex items-center gap-2">
                      {getTypeIcon(tx.type)}
                      <Badge variant="outline" className="capitalize">
                        {tx.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell className="font-medium">
                      ${tx.amount.toFixed(2)} {tx.currency}
                    </TableCell>
                    <TableCell>
                      {tx.order ? (
                        <div className="flex items-center gap-2">
                          <span>#{tx.order.id}</span>
                          <Link
                            href={`/orders/${tx.order.id}`}
                            className="text-primary hover:underline text-sm"
                          >
                            View
                          </Link>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {tx.created_by ? (
                        <span>
                          {tx.created_by.name} ({tx.created_by.email})
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{formatDate(tx.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openDetail(tx)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedTx ? `Transaction #${selectedTx.id}` : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                {getTypeIcon(selectedTx.type)}
                <Badge variant="outline" className="capitalize">
                  {selectedTx.type.replace("_", " ")}
                </Badge>
                {getStatusBadge(selectedTx.status)}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Amount</div>
                <div>
                  ${selectedTx.amount.toFixed(2)} {selectedTx.currency}
                </div>
                <div className="font-medium">Order</div>
                <div>
                  {selectedTx.order ? (
                    <Link
                      href={`/orders/${selectedTx.order.id}`}
                      className="text-primary hover:underline"
                    >
                      #{selectedTx.order.id}
                    </Link>
                  ) : (
                    "—"
                  )}
                </div>
                <div className="font-medium">Paid By</div>
                <div>
                  {selectedTx.created_by
                    ? `${selectedTx.created_by.name} (${selectedTx.created_by.email})`
                    : "—"}
                </div>
                <div className="font-medium">Created</div>
                <div>{formatDate(selectedTx.created_at)}</div>
                <div className="font-medium">Approved</div>
                <div>
                  {selectedTx.approved_by
                    ? `${selectedTx.approved_by.name} • ${formatDate(selectedTx.approved_at)}`
                    : "—"}
                </div>
                <div className="font-medium">Processed</div>
                <div>{formatDate(selectedTx.processed_at)}</div>
              </div>
              {selectedTx.description && (
                <div>
                  <div className="font-medium mb-1">Description</div>
                  <p className="text-muted-foreground">{selectedTx.description}</p>
                </div>
              )}
              {(selectedTx.stripe_payment_intent_id || selectedTx.stripe_refund_id) && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedTx.stripe_payment_intent_id && (
                    <>
                      <div className="font-medium">Stripe Payment Intent</div>
                      <div className="text-xs break-all">
                        {selectedTx.stripe_payment_intent_id}
                      </div>
                    </>
                  )}
                  {selectedTx.stripe_refund_id && (
                    <>
                      <div className="font-medium">Stripe Refund ID</div>
                      <div className="text-xs break-all">
                        {selectedTx.stripe_refund_id}
                      </div>
                    </>
                  )}
                </div>
              )}
              {selectedTx.metadata && (
                <div>
                  <div className="font-medium mb-1">Metadata</div>
                  <pre className="bg-muted p-2 rounded text-xs whitespace-pre-wrap">
                    {JSON.stringify(selectedTx.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

