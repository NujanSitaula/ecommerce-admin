"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, Plus, Trash2, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Order, OrderItem, Product } from "@/lib/types";
import { ProductImagePreview } from "@/components/products/product-image-preview";

export default function OrderEditPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [itemToRemove, setItemToRemove] = useState<OrderItem | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (orderId) {
      loadOrder();
      loadProducts();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load order");
      }

      const data = await response.json();
      const orderData = data.data || data;
      setOrder(orderData);
    } catch (error) {
      console.error("Failed to load order:", error);
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/admin/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const canEdit = order && ["pending", "confirmed", "processing"].includes(order.status);

  const handleAddItem = async () => {
    if (!selectedProduct || !quantity || quantity < 1) {
      toast.error("Please select a product and quantity");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/orders/${orderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: parseInt(selectedProduct),
          quantity: quantity,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add item");
      }

      toast.success("Item added to order");
      setSelectedProduct("");
      setQuantity(1);
      loadOrder();
    } catch (error) {
      console.error("Failed to add item:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveItem = async () => {
    if (!itemToRemove) return;

    try {
      setSaving(true);
      const response = await fetch(
        `/api/admin/orders/${orderId}/items/${itemToRemove.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove item");
      }

      const data = await response.json();
      toast.success("Item removed. Refund request created.");
      setItemToRemove(null);
      setRemoveDialogOpen(false);
      loadOrder();
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove item");
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Order not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orders/${orderId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Order #{order.id}</h1>
            <p className="text-muted-foreground">
              {order.guest_name || order.user?.name || order.guest_email || order.user?.email}
            </p>
          </div>
        </div>
        <Badge variant={order.status === "cancelled" ? "destructive" : "default"}>
          {order.status}
        </Badge>
      </div>

      {!canEdit && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              <p>
                This order cannot be modified. Only orders with status "pending", "confirmed", or "processing" can be edited.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Item Section */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Add Item to Order</CardTitle>
            <CardDescription>Add a new product to this order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search Products</Label>
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - ${product.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <Button onClick={handleAddItem} disabled={saving || !selectedProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>
            {order.items?.length || 0} item(s) in this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          {order.items && order.items.length > 0 ? (
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="w-20 h-20 flex-shrink-0">
                    <ProductImagePreview
                      thumbnailUrl={item.product?.thumbnail_url}
                      originalUrl={item.product?.thumbnail_url}
                      gallery={item.product?.thumbnail_url ? [item.product.thumbnail_url] : []}
                      alt={item.product_name}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{item.product_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × ${item.price} = ${item.subtotal.toFixed(2)}
                        </p>
                        {item.variant && (
                          <p className="text-sm text-muted-foreground">
                            Variant: {JSON.stringify(item.variant.attributes)}
                          </p>
                        )}
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setItemToRemove(item);
                            setRemoveDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No items in this order
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          {order.discount_amount && order.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>-${order.discount_amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping:</span>
            <span>${order.shipping_fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total:</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Remove Item Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item from Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{itemToRemove?.product_name}" from the order and create a refund request for ${itemToRemove?.subtotal.toFixed(2)}.
              The refund will need to be approved before processing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveItem} className="bg-destructive text-destructive-foreground">
              Remove Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

