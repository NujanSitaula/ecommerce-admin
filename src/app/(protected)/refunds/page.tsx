"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { CheckCircle, XCircle, Clock, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";
import type { Transaction } from "@/lib/types";

export default function RefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Transaction | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | "process" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      // Load both pending and approved refund requests
      const response = await fetch("/api/admin/refunds");
      if (response.ok) {
        const data = await response.json();
        setRefunds(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load refunds:", error);
      toast.error("Failed to load refund requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (refund: Transaction) => {
    try {
      setProcessing(true);
      const response = await fetch(
        `/api/admin/refunds/${refund.order_id}/${refund.id}/approve`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to approve refund");
      }

      toast.success("Refund approved");
      loadRefunds();
    } catch (error) {
      console.error("Failed to approve refund:", error);
      toast.error(error instanceof Error ? error.message : "Failed to approve refund");
    } finally {
      setProcessing(false);
      setDialogOpen(false);
      setSelectedRefund(null);
      setAction(null);
    }
  };

  const handleReject = async (refund: Transaction) => {
    try {
      setProcessing(true);
      const response = await fetch(
        `/api/admin/refunds/${refund.order_id}/${refund.id}/reject`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reject refund");
      }

      toast.success("Refund rejected");
      loadRefunds();
    } catch (error) {
      console.error("Failed to reject refund:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reject refund");
    } finally {
      setProcessing(false);
      setDialogOpen(false);
      setSelectedRefund(null);
      setAction(null);
    }
  };

  const handleProcess = async (refund: Transaction) => {
    try {
      setProcessing(true);
      const response = await fetch(
        `/api/admin/refunds/${refund.order_id}/${refund.id}/process`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process refund");
      }

      toast.success("Refund processed successfully");
      loadRefunds();
    } catch (error) {
      console.error("Failed to process refund:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process refund");
    } finally {
      setProcessing(false);
      setDialogOpen(false);
      setSelectedRefund(null);
      setAction(null);
    }
  };

  const openDialog = (refund: Transaction, actionType: "approve" | "reject" | "process") => {
    setSelectedRefund(refund);
    setAction(actionType);
    setDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedRefund || !action) return;

    if (action === "approve") {
      handleApprove(selectedRefund);
    } else if (action === "reject") {
      handleReject(selectedRefund);
    } else if (action === "process") {
      handleProcess(selectedRefund);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading refund requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Refund Management</h1>
        <p className="text-muted-foreground">
          Review and manage refund requests. Approve pending requests, then process approved refunds to issue them via Stripe.
        </p>
      </div>

      {refunds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending or approved refund requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {refunds.map((refund) => (
            <Card key={refund.id} className="py-4">
              <CardContent className="px-4 pt-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold text-lg">
                        ${refund.amount.toFixed(2)} {refund.currency}
                      </span>
                      {getStatusBadge(refund.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {refund.description}
                    </p>
                    {refund.order && (
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          Order #{refund.order.id} - ${refund.order.total.toFixed(2)}
                        </span>
                        <Link
                          href={`/orders/${refund.order.id}`}
                          className="text-primary hover:underline"
                        >
                          View Order
                        </Link>
                      </div>
                    )}
                    {refund.created_by && (
                      <p className="text-xs text-muted-foreground">
                        Created by: {refund.created_by.name} ({refund.created_by.email})
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(refund.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {refund.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => openDialog(refund, "approve")}
                          disabled={processing}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDialog(refund, "reject")}
                          disabled={processing}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    {refund.status === "approved" && (
                      <Button
                        size="sm"
                        onClick={() => openDialog(refund, "process")}
                        disabled={processing}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Process Refund
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "approve" && "Approve Refund Request?"}
              {action === "reject" && "Reject Refund Request?"}
              {action === "process" && "Process Refund?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === "approve" &&
                `Are you sure you want to approve this refund request for $${selectedRefund?.amount.toFixed(2)}?`}
              {action === "reject" &&
                `Are you sure you want to reject this refund request? This action cannot be undone.`}
              {action === "process" &&
                `This will process the refund via Stripe for $${selectedRefund?.amount.toFixed(2)}. The refund will be issued to the customer's payment method.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={processing}
              className={action === "reject" ? "bg-destructive text-destructive-foreground" : ""}
            >
              {processing ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

