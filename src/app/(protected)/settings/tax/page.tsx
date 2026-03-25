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
import { Plus, Edit, Trash2, Percent } from "lucide-react";
import { toast } from "sonner";
import type { TaxRate } from "@/lib/types";

interface Country {
  id: number;
  name: string;
  iso2?: string;
  states?: { id: number; name: string; code?: string }[];
}

const TAX_TYPES = [
  { value: "vat", label: "VAT" },
  { value: "sales_tax", label: "Sales Tax" },
  { value: "gst", label: "GST" },
  { value: "hst", label: "HST" },
  { value: "pst", label: "PST" },
  { value: "qst", label: "QST" },
] as const;

export default function TaxRatesPage() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null);
  const [formData, setFormData] = useState({
    country_id: null as number | null,
    state_id: null as number | null,
    name: "",
    tax_type: "vat" as const,
    rate: 0,
    shipping_taxable: true,
    is_default: false,
    is_active: true,
  });

  useEffect(() => {
    loadTaxRates();
    loadCountries();
  }, []);

  const loadTaxRates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/tax-rates");
      if (response.ok) {
        const data = await response.json();
        setTaxRates(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to load tax rates:", error);
      toast.error("Failed to load tax rates");
    } finally {
      setLoading(false);
    }
  };

  const loadCountries = async () => {
    try {
      const response = await fetch("/api/countries");
      if (response.ok) {
        const data = await response.json();
        setCountries(Array.isArray(data) ? data : data.data ?? []);
      }
    } catch (error) {
      console.error("Failed to load countries:", error);
    }
  };

  const handleOpenDialog = (rate?: TaxRate) => {
    if (rate) {
      setEditingRate(rate);
      setFormData({
        country_id: rate.country_id ?? null,
        state_id: rate.state_id ?? null,
        name: rate.name,
        tax_type: rate.tax_type,
        rate: rate.rate,
        shipping_taxable: rate.shipping_taxable,
        is_default: rate.is_default,
        is_active: rate.is_active,
      });
    } else {
      setEditingRate(null);
      setFormData({
        country_id: null,
        state_id: null,
        name: "",
        tax_type: "vat",
        rate: 0,
        shipping_taxable: true,
        is_default: false,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        country_id: formData.is_default ? null : formData.country_id,
        state_id: formData.is_default ? null : formData.state_id,
      };

      const url = editingRate
        ? `/api/admin/tax-rates/${editingRate.id}`
        : "/api/admin/tax-rates";
      const method = editingRate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to save tax rate");
      }

      toast.success(`Tax rate ${editingRate ? "updated" : "created"} successfully`);
      setDialogOpen(false);
      loadTaxRates();
    } catch (error) {
      console.error("Failed to save tax rate:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save tax rate");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tax rate?")) return;

    try {
      const response = await fetch(`/api/admin/tax-rates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to delete tax rate");
      }

      toast.success("Tax rate deleted successfully");
      loadTaxRates();
    } catch (error) {
      console.error("Failed to delete tax rate:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete tax rate");
    }
  };

  const selectedCountry = countries.find((c) => c.id === formData.country_id);
  const states = selectedCountry?.states ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tax Rates</h1>
          <p className="text-muted-foreground">
            Manage tax rates by country and state for global compliance
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tax Rate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRate ? "Edit Tax Rate" : "Add Tax Rate"}
              </DialogTitle>
              <DialogDescription>
                Configure tax rates for specific regions or set a default rate
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, is_default: v })
                  }
                />
                <Label htmlFor="is_default">Default rate (no country/state)</Label>
              </div>

              {!formData.is_default && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={formData.country_id?.toString() ?? "none"}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          country_id: v === "none" ? null : parseInt(v, 10),
                          state_id: null,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {countries.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name} ({c.iso2 ?? c.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.country_id && states.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Select
                        value={formData.state_id?.toString() ?? "none"}
                        onValueChange={(v) =>
                          setFormData({
                            ...formData,
                            state_id: v === "none" ? null : parseInt(v, 10),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (country-wide)</SelectItem>
                          {states.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name} ({s.code ?? s.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., UK VAT, California Sales Tax"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_type">Tax Type</Label>
                  <Select
                    value={formData.tax_type}
                    onValueChange={(v: TaxRate["tax_type"]) =>
                      setFormData({ ...formData, tax_type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">
                    Rate (%) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.rate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rate: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="shipping_taxable"
                  checked={formData.shipping_taxable}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, shipping_taxable: v })
                  }
                />
                <Label htmlFor="shipping_taxable">Tax shipping</Label>
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
              <Button
                onClick={handleSave}
                disabled={!formData.name || formData.rate < 0}
              >
                {editingRate ? "Update" : "Create"} Tax Rate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading tax rates...
        </div>
      ) : taxRates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Percent className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No tax rates yet. Add your first tax rate to get started.</p>
            <p className="mt-2 text-sm">
              Run <code className="rounded bg-muted px-1">php artisan db:seed</code> to seed UK
              VAT and a default rate.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Tax Rates</CardTitle>
            <CardDescription>
              Tax rates are matched by state, then country, then default
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Shipping Taxable</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.name}</TableCell>
                    <TableCell>
                      {rate.country?.name ?? (rate.is_default ? "—" : "—")}
                    </TableCell>
                    <TableCell>
                      {rate.state?.name ?? "—"}
                    </TableCell>
                    <TableCell className="capitalize">{rate.tax_type.replace("_", " ")}</TableCell>
                    <TableCell>{rate.rate}%</TableCell>
                    <TableCell>{rate.shipping_taxable ? "Yes" : "No"}</TableCell>
                    <TableCell>{rate.is_default ? "Yes" : "No"}</TableCell>
                    <TableCell>{rate.is_active ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(rate)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rate.id)}
                          disabled={rate.is_default}
                          title={rate.is_default ? "Cannot delete default rate" : "Delete"}
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
