"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Product, InventoryTransaction } from "@/lib/types";
import { toast } from "sonner";

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [inventoryType, setInventoryType] = useState<"in_stock" | "made_to_order" | "both">("in_stock");
  const [trackInventory, setTrackInventory] = useState(true);

  useEffect(() => {
    if (productId) {
      loadInventoryData();
    }
  }, [productId]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/inventory/${productId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load inventory data");
      }

      const data = await response.json();
      setProduct(data.product);
      setHistory(data.history || []);
      
      // Set form values
      setLowStockThreshold(data.product?.low_stock_threshold || 5);
      setInventoryType(data.product?.inventory_type || "in_stock");
      setTrackInventory(data.product?.track_inventory ?? true);
    } catch (error) {
      console.error("Failed to load inventory:", error);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adjustQuantity || isNaN(Number(adjustQuantity))) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/inventory/${productId}/adjust`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: parseInt(adjustQuantity),
          notes: adjustNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to adjust inventory");
      }

      toast.success("Inventory adjusted successfully");

      setAdjustQuantity("");
      setAdjustNotes("");
      loadInventoryData();
    } catch (error) {
      console.error("Failed to adjust inventory:", error);
      toast.error(error instanceof Error ? error.message : "Failed to adjust inventory");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          low_stock_threshold: lowStockThreshold,
          inventory_type: inventoryType,
          track_inventory: trackInventory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      toast.success("Settings updated successfully");

      loadInventoryData();
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      sale: "destructive",
      purchase: "default",
      adjustment: "secondary",
      return: "default",
      damage: "destructive",
      production: "outline",
    };
    return colors[type] || "secondary";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading inventory data...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <Link href="/inventory">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </Link>
        <div className="text-center py-12 text-muted-foreground">Product not found</div>
      </div>
    );
  }

  const isLowStock = product.quantity <= (product.low_stock_threshold || 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">Inventory Management</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Stock & Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Stock</CardTitle>
              <CardDescription>Real-time inventory status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Available Quantity</Label>
                  {isLowStock && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low Stock
                    </Badge>
                  )}
                </div>
                <div className="text-3xl font-bold">
                  {product.quantity || 0}
                </div>
                {product.track_inventory && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Threshold: {product.low_stock_threshold || 5}
                  </p>
                )}
              </div>

              {product.sku && (
                <div>
                  <Label>SKU</Label>
                  <p className="text-sm font-mono">{product.sku}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Settings</CardTitle>
              <CardDescription>Configure inventory tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="inventory-type">Inventory Type</Label>
                <Select
                  value={inventoryType}
                  onValueChange={(value: "in_stock" | "made_to_order" | "both") =>
                    setInventoryType(value)
                  }
                >
                  <SelectTrigger id="inventory-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="made_to_order">Made to Order</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="track-inventory">Track Inventory</Label>
                <Select
                  value={trackInventory ? "yes" : "no"}
                  onValueChange={(value) => setTrackInventory(value === "yes")}
                >
                  <SelectTrigger id="track-inventory">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {trackInventory && (
                <div>
                  <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
                  <Input
                    id="low-stock-threshold"
                    type="number"
                    min="0"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                  />
                </div>
              )}

              <Button onClick={handleUpdateSettings} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adjust Inventory</CardTitle>
              <CardDescription>Manually adjust stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdjustInventory} className="space-y-4">
                <div>
                  <Label htmlFor="quantity">Set Quantity To</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(e.target.value)}
                    placeholder="Enter new quantity"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    placeholder="Reason for adjustment..."
                    rows={3}
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Adjusting..." : "Adjust Inventory"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Inventory History */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory History</CardTitle>
            <CardDescription>Recent inventory transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-xs">
                          {formatDate(transaction.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTransactionTypeColor(transaction.type) as any}>
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={transaction.quantity < 0 ? "text-red-500" : "text-green-500"}>
                            {transaction.quantity > 0 ? "+" : ""}{transaction.quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          {transaction.previous_quantity} → {transaction.new_quantity}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {transaction.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

