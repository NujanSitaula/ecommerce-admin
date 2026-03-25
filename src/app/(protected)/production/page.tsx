"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, CheckCircle, Package, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ProductImagePreview } from "@/components/products/product-image-preview";
import type { OrderItem } from "@/lib/types";

interface ProductionItem extends OrderItem {
  order?: {
    id: number;
    created_at: string;
    user?: { name?: string; email: string };
    guest_name?: string;
    guest_email?: string;
  };
}

export default function ProductionPage() {
  const [allItems, setAllItems] = useState<ProductionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadProductionItems();
  }, []); // Load all items once on mount, then filter client-side

  const loadProductionItems = async () => {
    try {
      setLoading(true);
      // Always load all items for stats, then filter by tab
      const response = await fetch(`/api/admin/production`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Production API error:", response.status, errorText);
        throw new Error(`Failed to load production items: ${response.status}`);
      }

      const data = await response.json();
      console.log("Production API response:", data);
      setAllItems(data.data || []);
    } catch (error) {
      console.error("Failed to load production items:", error);
      toast.error("Failed to load production items");
    } finally {
      setLoading(false);
    }
  };

  const handleStartProduction = async (itemId: number, orderId: number) => {
    try {
      setProcessing(true);
      const response = await fetch(
        `/api/admin/orders/${orderId}/items/${itemId}/start-production`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start production");
      }

      toast.success("Production started");
      loadProductionItems();
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    } catch (error) {
      console.error("Failed to start production:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start production");
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteProduction = async (itemId: number, orderId: number) => {
    try {
      setProcessing(true);
      const response = await fetch(
        `/api/admin/orders/${orderId}/items/${itemId}/complete-production`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete production");
      }

      toast.success("Production completed");
      loadProductionItems();
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    } catch (error) {
      console.error("Failed to complete production:", error);
      toast.error(error instanceof Error ? error.message : "Failed to complete production");
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkStart = async () => {
    if (selectedItems.length === 0) return;

    try {
      setProcessing(true);
      const promises = selectedItems.map((itemId) => {
        const item = allItems.find((i) => i.id === itemId);
        if (!item || !item.order) return Promise.resolve();
        return handleStartProduction(itemId, item.order.id);
      });

      await Promise.all(promises);
      setSelectedItems([]);
    } catch (error) {
      console.error("Bulk start failed:", error);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysRemaining = (estimatedDate: string | undefined) => {
    if (!estimatedDate) return null;
    const today = new Date();
    const estimated = new Date(estimatedDate);
    const diffTime = estimated.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  const getCustomerName = (item: ProductionItem) => {
    if (item.order?.user) {
      return item.order.user.name || item.order.user.email;
    }
    return item.order?.guest_name || item.order?.guest_email || "Guest";
  };

  // Calculate stats from all items
  const stats = {
    pending: allItems.filter((i) => i.production_status === "pending").length,
    in_progress: allItems.filter((i) => i.production_status === "in_progress").length,
    completed: allItems.filter((i) => i.production_status === "completed").length,
  };

  // Filter items based on active tab
  const filteredItems = activeTab === "all"
    ? allItems
    : allItems.filter((item) => item.production_status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Management</h1>
          <p className="text-muted-foreground">
            Track and manage made-to-order items
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="py-4">
          <CardContent className="flex flex-col gap-1 px-4 pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">All Items</span>
              <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="text-xl font-bold">{allItems.length}</div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex flex-col gap-1 px-4 pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Pending</span>
              <Clock className="h-4 w-4 shrink-0 text-orange-500" />
            </div>
            <div className="text-xl font-bold text-orange-500">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex flex-col gap-1 px-4 pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">In Progress</span>
              <Play className="h-4 w-4 shrink-0 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-blue-500">{stats.in_progress}</div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex flex-col gap-1 px-4 pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Completed</span>
              <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
            </div>
            <div className="text-xl font-bold text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      {mounted && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {selectedItems.length > 0 && activeTab === "pending" && (
            <Button
              onClick={handleBulkStart}
              disabled={processing}
              variant="default"
            >
              <Play className="h-4 w-4 mr-2" />
              Start {selectedItems.length} Item(s)
            </Button>
          )}
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading production items...
            </div>
          ) : filteredItems.length === 0 ? (
            <Card className="py-6">
              <CardContent className="pt-0 text-center text-muted-foreground">
                No production items found
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const daysRemaining = getDaysRemaining(item.estimated_completion_date);
                const isOverdue = daysRemaining !== null && daysRemaining < 0;
                const isSelected = selectedItems.includes(item.id);

                return (
                  <Card key={item.id} className="py-3">
                    <CardContent className="px-4 pt-0">
                      <div className="flex gap-3">
                        {activeTab === "pending" && (
                          <div className="pt-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedItems((prev) => [...prev, item.id]);
                                } else {
                                  setSelectedItems((prev) =>
                                    prev.filter((id) => id !== item.id)
                                  );
                                }
                              }}
                            />
                          </div>
                        )}

                        <div className="w-20 h-20 flex-shrink-0">
                          <ProductImagePreview
                            thumbnailUrl={item.product?.thumbnail_url}
                            originalUrl={item.product?.thumbnail_url}
                            gallery={item.product?.thumbnail_url ? [item.product.thumbnail_url] : []}
                            alt={item.product_name}
                          />
                        </div>

                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{item.product_name}</h4>
                                <Badge variant={getProductionStatusColor(item.production_status) as any}>
                                  {item.production_status?.replace("_", " ") || "Pending"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Order #{item.order?.id} • {getCustomerName(item)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              {item.estimated_completion_date && (
                                <div>
                                  <p className="text-sm font-medium">
                                    {formatDate(item.estimated_completion_date)}
                                  </p>
                                  {daysRemaining !== null && (
                                    <p
                                      className={`text-xs ${
                                        isOverdue
                                          ? "text-red-500 font-medium"
                                          : daysRemaining <= 3
                                          ? "text-orange-500"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {isOverdue
                                        ? `${Math.abs(daysRemaining)} days overdue`
                                        : `${daysRemaining} days remaining`}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {item.personalizations && item.personalizations.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              {item.personalizations.length} personalization(s)
                            </div>
                          )}

                          {(item.product as any)?.materials?.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="text-sm font-medium mb-2">Materials Required:</div>
                              <div className="space-y-1">
                                {(item.product as any).materials.map((material: any) => {
                                  const requiredQuantity = (material.quantity_required || 0) * (item.quantity || 1);
                                  const isLowStock = material.current_stock <= material.low_stock_threshold;
                                  const isInsufficient = material.current_stock < requiredQuantity;
                                  
                                  return (
                                    <div
                                      key={material.id}
                                      className={`text-xs p-2 rounded ${
                                        isInsufficient
                                          ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                                          : isLowStock
                                          ? "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">{material.name}</span>
                                        <span>
                                          {requiredQuantity.toFixed(2)} {material.unit} needed
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between mt-1">
                                        <span>Available: {material.current_stock.toFixed(2)} {material.unit}</span>
                                        {isInsufficient && (
                                          <span className="font-medium">Insufficient</span>
                                        )}
                                        {!isInsufficient && isLowStock && (
                                          <span className="font-medium">Low Stock</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link href={`/orders/${item.order?.id}`}>
                                View Order
                              </Link>
                            </Button>
                            {item.production_status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStartProduction(item.id, item.order!.id)
                                }
                                disabled={processing}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Start Production
                              </Button>
                            )}
                            {item.production_status === "in_progress" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleCompleteProduction(item.id, item.order!.id)
                                }
                                disabled={processing}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete Production
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

