"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import type { Coupon } from "@/lib/types";

const COUPON_TYPES = [
  { value: "free_shipping", label: "Free Shipping" },
  { value: "percent", label: "Percent Off" },
  { value: "flat", label: "Flat Amount" },
] as const;

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    type: "percent" as "free_shipping" | "percent" | "flat",
    value: "" as number | "",
    max_discount_amount: "" as number | "",
    max_uses: "" as number | "",
    max_uses_per_user: "" as number | "",
    min_cart_total: "" as number | "",
    starts_at: "",
    expires_at: "",
    is_active: true,
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/coupons");
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value ?? "",
        max_discount_amount: coupon.max_discount_amount ?? "",
        max_uses: coupon.max_uses ?? "",
        max_uses_per_user: coupon.max_uses_per_user ?? "",
        min_cart_total: coupon.min_cart_total ?? "",
        starts_at: toDatetimeLocal(coupon.starts_at),
        expires_at: toDatetimeLocal(coupon.expires_at),
        is_active: coupon.is_active,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        type: "percent",
        value: "",
        max_discount_amount: "",
        max_uses: "",
        max_uses_per_user: "",
        min_cart_total: "",
        starts_at: "",
        expires_at: "",
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      code: formData.code.trim(),
      type: formData.type,
      is_active: formData.is_active,
    };
    if (formData.type === "percent" || formData.type === "flat") {
      payload.value = typeof formData.value === "number" ? formData.value : parseFloat(String(formData.value)) || 0;
    } else {
      payload.value = null;
    }
    if (formData.type === "percent" && (formData.max_discount_amount !== "" || formData.max_discount_amount === 0)) {
      payload.max_discount_amount = typeof formData.max_discount_amount === "number"
        ? formData.max_discount_amount
        : formData.max_discount_amount ? parseFloat(String(formData.max_discount_amount)) : null;
    } else {
      payload.max_discount_amount = null;
    }
    payload.max_uses = formData.max_uses === "" ? null : (typeof formData.max_uses === "number" ? formData.max_uses : parseInt(String(formData.max_uses), 10) || null);
    payload.max_uses_per_user = formData.max_uses_per_user === "" ? null : (typeof formData.max_uses_per_user === "number" ? formData.max_uses_per_user : parseInt(String(formData.max_uses_per_user), 10) || null);
    payload.min_cart_total = formData.min_cart_total === "" ? null : (typeof formData.min_cart_total === "number" ? formData.min_cart_total : parseFloat(String(formData.min_cart_total)) || null);
    payload.starts_at = formData.starts_at ? new Date(formData.starts_at).toISOString() : null;
    payload.expires_at = formData.expires_at ? new Date(formData.expires_at).toISOString() : null;
    return payload;
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      toast.error("Code is required");
      return;
    }
    if ((formData.type === "percent" || formData.type === "flat") && (formData.value === "" || (typeof formData.value === "number" && formData.value <= 0))) {
      toast.error("Value is required for percent and flat coupons");
      return;
    }

    try {
      const url = editingCoupon
        ? `/api/admin/coupons/${editingCoupon.id}`
        : "/api/admin/coupons";
      const method = editingCoupon ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.errors?.code?.[0] ?? data.errors?.value?.[0] ?? data.message ?? "Failed to save coupon";
        throw new Error(msg);
      }

      toast.success(`Coupon ${editingCoupon ? "updated" : "created"} successfully`);
      setDialogOpen(false);
      loadCoupons();
    } catch (error) {
      console.error("Failed to save coupon:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save coupon");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete coupon");
      }

      toast.success("Coupon deleted successfully");
      loadCoupons();
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete coupon");
    }
  };

  const formatValue = (coupon: Coupon) => {
    switch (coupon.type) {
      case "free_shipping":
        return "Free shipping";
      case "percent":
        return `${coupon.value}% off${coupon.max_discount_amount ? ` (max $${coupon.max_discount_amount})` : ""}`;
      case "flat":
        return `$${coupon.value} off`;
      default:
        return "—";
    }
  };

  const formatValidity = (coupon: Coupon) => {
    const start = coupon.starts_at ? new Date(coupon.starts_at).toLocaleDateString() : null;
    const end = coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : null;
    if (!start && !end) return "—";
    if (start && end) return `${start} – ${end}`;
    return start || end || "—";
  };

  const formatUsage = (coupon: Coupon) => {
    const used = coupon.redemptions_count ?? 0;
    const max = coupon.max_uses;
    if (max == null) return `${used}/—`;
    return `${used}/${max}`;
  };

  const canSave =
    formData.code.trim() &&
    (formData.type === "free_shipping" || (formData.value !== "" && (typeof formData.value !== "number" || formData.value > 0)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupon Management</h1>
          <p className="text-muted-foreground">
            Create and manage discount coupons for your store
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Edit Coupon" : "Add New Coupon"}
              </DialogTitle>
              <DialogDescription>
                {editingCoupon
                  ? "Update coupon settings"
                  : "Create a discount coupon for customers"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., SAVE20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v: "free_shipping" | "percent" | "flat") =>
                    setFormData({ ...formData, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUPON_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(formData.type === "percent" || formData.type === "flat") && (
                <div className="space-y-2">
                  <Label htmlFor="value">
                    Value <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    step={formData.type === "percent" ? "1" : "0.01"}
                    min="0"
                    value={formData.value === "" ? "" : formData.value}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData({
                        ...formData,
                        value: v === "" ? "" : parseFloat(v) || 0,
                      });
                    }}
                    placeholder={formData.type === "percent" ? "e.g., 20" : "e.g., 10.00"}
                  />
                </div>
              )}

              {formData.type === "percent" && (
                <div className="space-y-2">
                  <Label htmlFor="max_discount_amount">Max discount amount (optional)</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.max_discount_amount === "" ? "" : formData.max_discount_amount}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData({
                        ...formData,
                        max_discount_amount: v === "" ? "" : parseFloat(v) || 0,
                      });
                    }}
                    placeholder="e.g., 50.00"
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max_uses">Max uses (optional)</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min="0"
                    value={formData.max_uses === "" ? "" : formData.max_uses}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData({
                        ...formData,
                        max_uses: v === "" ? "" : parseInt(v, 10) || 0,
                      });
                    }}
                    placeholder="Unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_uses_per_user">Max uses per user (optional)</Label>
                  <Input
                    id="max_uses_per_user"
                    type="number"
                    min="0"
                    value={formData.max_uses_per_user === "" ? "" : formData.max_uses_per_user}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData({
                        ...formData,
                        max_uses_per_user: v === "" ? "" : parseInt(v, 10) || 0,
                      });
                    }}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_cart_total">Min cart total (optional)</Label>
                <Input
                  id="min_cart_total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_cart_total === "" ? "" : formData.min_cart_total}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData({
                      ...formData,
                      min_cart_total: v === "" ? "" : parseFloat(v) || 0,
                    });
                  }}
                  placeholder="e.g., 50.00"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="starts_at">Starts at (optional)</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) =>
                      setFormData({ ...formData, starts_at: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expires at (optional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData({ ...formData, expires_at: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, is_active: v })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!canSave}>
                {editingCoupon ? "Update" : "Create"} Coupon
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading coupons...
        </div>
      ) : coupons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No coupons yet. Add your first coupon to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Coupons</CardTitle>
            <CardDescription>
              Manage discount codes and their usage limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-medium">
                      {coupon.code}
                    </TableCell>
                    <TableCell className="capitalize">
                      {coupon.type.replace("_", " ")}
                    </TableCell>
                    <TableCell>{formatValue(coupon)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatValidity(coupon)}
                    </TableCell>
                    <TableCell>{formatUsage(coupon)}</TableCell>
                    <TableCell>
                      {coupon.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(coupon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
