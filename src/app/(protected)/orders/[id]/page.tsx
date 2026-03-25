"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Package, Calendar, MapPin, CreditCard, User, Gift, Play, CheckCircle, XCircle, Edit, X, FileDown } from "lucide-react";
import { toast } from "sonner";
import type { Order, OrderItem, OrderPersonalization } from "@/lib/types";
import { ProductImagePreview } from "@/components/products/product-image-preview";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [personalizationsOpen, setPersonalizationsOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const handleDownloadInvoice = async () => {
    try {
      setInvoiceLoading(true);
      const res = await fetch(`/api/admin/orders/${orderId}/invoice`);
      if (!res.ok) throw new Error("Failed to download invoice");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download invoice");
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load order");
      }

      const responseData = await response.json();
      console.log("Raw order response:", responseData);
      
      // Handle wrapped response (if API returns {data: {...}}) or direct response
      const orderData = responseData.data || responseData;
      
      if (!orderData || !orderData.id) {
        console.error("Invalid order data structure:", responseData);
        toast.error("Invalid order data received from server");
        return;
      }
      
      console.log("Setting order data:", orderData);
      setOrder(orderData);
    } catch (error) {
      console.error("Failed to load order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      toast.success("Order status updated");
      loadOrder();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update order status");
    } finally {
      setSaving(false);
    }
  };

  const handleStartProduction = async (itemId: number) => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/admin/orders/${orderId}/items/${itemId}/start-production`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start production");
      }

      toast.success("Production started");
      loadOrder();
    } catch (error) {
      console.error("Failed to start production:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start production");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteProduction = async (itemId: number) => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/admin/orders/${orderId}/items/${itemId}/complete-production`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete production");
      }

      toast.success("Production completed");
      loadOrder();
    } catch (error) {
      console.error("Failed to complete production:", error);
      toast.error(error instanceof Error ? error.message : "Failed to complete production");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancellationReason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel order");
      }

      toast.success("Order cancelled. Refund requests created if order was paid.");
      setCancelDialogOpen(false);
      setCancellationReason("");
      loadOrder();
    } catch (error) {
      console.error("Failed to cancel order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to cancel order");
    } finally {
      setSaving(false);
    }
  };

  const canEdit = order && ["pending", "confirmed", "processing"].includes(order.status);
  const canCancel = order && order.status !== "cancelled" && order.status !== "delivered";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "secondary",
      confirmed: "default",
      processing: "default",
      shipped: "default",
      delivered: "default",
      cancelled: "destructive",
    };
    return colors[status] || "secondary";
  };

  const getProductionStatusColor = (status: string | null | undefined) => {
    if (!status) return "secondary";
    const colors: Record<string, string> = {
      pending: "secondary",
      in_progress: "default",
      completed: "default",
      cancelled: "destructive",
    };
    return colors[status] || "secondary";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link href="/orders">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div className="text-center py-12 text-muted-foreground">Order not found</div>
      </div>
    );
  }

  const customerName = order.user
    ? order.user.name || order.user.email
    : order.guest_name || order.guest_email || "Guest";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Order #{order.id}</h1>
            <p className="text-muted-foreground">Ordered on {formatDate(order.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(order.status) as any} className="text-sm">
            {order.status}
          </Badge>
          {order.status !== "cancelled" && (
            <Button
              variant="outline"
              onClick={handleDownloadInvoice}
              disabled={invoiceLoading}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {invoiceLoading ? "Downloading..." : "Download Invoice"}
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/orders/${orderId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Order
              </Link>
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => setCancelDialogOpen(true)}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>{order.items?.length || 0} item(s) in this order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border rounded-lg p-4"
                >
                  <div className="w-20 h-20 flex-shrink-0">
                    <ProductImagePreview
                      thumbnailUrl={item.product?.thumbnail_url}
                      originalUrl={item.product?.thumbnail_url}
                      gallery={item.product?.thumbnail_url ? [item.product.thumbnail_url] : []}
                      alt={item.product_name}
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{item.product_name}</h4>
                        {item.variant && (
                          <p className="text-sm text-muted-foreground">
                            {Object.entries(item.variant.attributes || {})
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(", ")}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                      </div>
                    </div>

                    {item.is_made_to_order && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Badge variant={getProductionStatusColor(item.production_status) as any}>
                          {item.production_status?.replace("_", " ") || "Pending"}
                        </Badge>
                        {item.estimated_completion_date && (
                          <span className="text-xs text-muted-foreground">
                            Est. completion: {formatDate(item.estimated_completion_date)}
                          </span>
                        )}
                        <div className="flex-1" />
                        {item.production_status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartProduction(item.id)}
                            disabled={saving}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start Production
                          </Button>
                        )}
                        {item.production_status === "in_progress" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompleteProduction(item.id)}
                            disabled={saving}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    )}

                    {item.personalizations && item.personalizations.length > 0 && (
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setPersonalizationsOpen(true);
                          }}
                        >
                          View Personalizations ({item.personalizations.length})
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))) : (
                <p className="text-muted-foreground text-center py-8">
                  No items found in this order
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={order.status}
                onValueChange={handleStatusUpdate}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{customerName}</p>
                <p className="text-sm text-muted-foreground">
                  {order.user ? order.user.email : order.guest_email}
                </p>
                {order.guest_email && (
                  <Badge variant="secondary" className="mt-1">Guest Order</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          {order.address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.address.name}</p>
                  <p>{order.address.address_line1}</p>
                  {order.address.address_line2 && <p>{order.address.address_line2}</p>}
                  <p>
                    {order.address.city}, {order.address.state || ""} {order.address.postal_code}
                  </p>
                  {order.address.country && <p>{order.address.country}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          {order.payment_method && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p>
                    {order.payment_method.brand.toUpperCase()} •••• {order.payment_method.last4}
                  </p>
                  {order.payment_method.cardholder_name && (
                    <p className="text-muted-foreground">
                      {order.payment_method.cardholder_name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(order.shipping_fee)}</span>
              </div>
              {order.shipping_discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Shipping Discount</span>
                  <span>-{formatCurrency(order.shipping_discount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Delivery Date:</span>
                <p className="font-medium">{formatDate(order.delivery_date)}</p>
              </div>
              {order.gift_wrapped && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Gift className="h-4 w-4" />
                  <span>Gift Wrapped</span>
                </div>
              )}
              {order.leave_at_door && (
                <p className="text-muted-foreground">Leave at door</p>
              )}
              {order.delivery_instructions && (
                <div>
                  <span className="text-muted-foreground">Instructions:</span>
                  <p>{order.delivery_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Personalizations Dialog */}
      <Dialog open={personalizationsOpen} onOpenChange={setPersonalizationsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Personalizations - {selectedItem?.product_name}
            </DialogTitle>
            <DialogDescription>
              Customer personalization details for this item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedItem?.personalizations && selectedItem.personalizations.length > 0 ? (
              selectedItem.personalizations.map((personalization) => (
                <div key={personalization.id} className="border rounded-lg p-4">
                  <div className="font-medium mb-2">
                    {personalization.personalization_option?.name || "Personalization"}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Type: {personalization.personalization_option?.type || "Unknown"}
                  </div>
                  {personalization.file_url ? (
                    <div>
                      <img
                        src={personalization.file_url}
                        alt="Personalization file"
                        className="max-w-full h-auto rounded-md border"
                      />
                      <a
                        href={personalization.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                      >
                        Download File
                      </a>
                    </div>
                  ) : (
                    <div className="text-sm">{personalization.value}</div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No personalizations for this item
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order #{order.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the order and create refund requests for all items if the order was paid.
              This action cannot be undone. Orders cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancellation-reason">Cancellation Reason (Optional)</Label>
              <Textarea
                id="cancellation-reason"
                placeholder="Enter reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancellationReason("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              className="bg-destructive text-destructive-foreground"
              disabled={saving}
            >
              {saving ? "Cancelling..." : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

