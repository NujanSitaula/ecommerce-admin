"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StoreSettings } from "@/lib/types";

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

const schema = z.object({
  name: z.string().min(2),
  supportEmail: z.string().email().optional(),
  currency: z.string().min(1).optional(),
  paymentProvider: z.string().optional(),
  shippingFrom: z.string().optional(),
  notes: z.string().optional(),
});

const invoiceSchema = z.object({
  invoiceLogo: z.string().optional(),
  invoiceCompanyName: z.string().optional(),
  invoiceAddress: z.string().optional(),
  invoiceEmail: z.string().optional(),
  invoicePhone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [invoicePending, setInvoicePending] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      supportEmail: "",
      currency: "USD",
      paymentProvider: "",
      shippingFrom: "",
      notes: "",
    },
  });

  const invoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceLogo: "",
      invoiceCompanyName: "",
      invoiceAddress: "",
      invoiceEmail: "",
      invoicePhone: "",
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/settings", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as StoreSettings;
          form.reset({
            ...data,
            notes: (data as { notes?: string }).notes ?? "",
          });
          invoiceForm.reset({
            invoiceLogo: data.invoiceLogo ?? "",
            invoiceCompanyName: data.invoiceCompanyName ?? "",
            invoiceAddress: data.invoiceAddress ?? "",
            invoiceEmail: data.invoiceEmail ?? "",
            invoicePhone: data.invoicePhone ?? "",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [form, invoiceForm]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error("Unable to update settings");
        toast.success("Settings saved");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save settings",
        );
      }
    });
  };

  const onInvoiceSubmit = (values: InvoiceFormValues) => {
    setInvoicePending(true);
    fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unable to update invoice settings");
        toast.success("Invoice settings saved");
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Failed to save"),
      )
      .finally(() => setInvoicePending(false));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">General</h1>
        <p className="text-sm text-muted-foreground">
          Store info, payments, and shipping.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Store name</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name?.message && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  {...form.register("supportEmail")}
                />
                {form.formState.errors.supportEmail?.message && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.supportEmail.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" {...form.register("currency")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentProvider">Payment provider</Label>
                <Input
                  id="paymentProvider"
                  placeholder="Stripe, etc."
                  {...form.register("paymentProvider")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingFrom">Shipping origin</Label>
                <Input id="shippingFrom" {...form.register("shippingFrom")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional settings or notes..."
                {...form.register("notes")}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending || isLoading}>
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <p className="text-sm text-muted-foreground">
            Customize how the admin panel looks on your device.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={theme ?? "system"}
              onValueChange={(value) => setTheme(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Light uses a light background. Dark uses a dark background.
              System follows your device preference.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice</CardTitle>
          <p className="text-sm text-muted-foreground">
            Logo and company details shown on generated invoices.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={invoiceForm.handleSubmit(onInvoiceSubmit)}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="invoiceLogo">Logo URL</Label>
                <Input
                  id="invoiceLogo"
                  placeholder="https://example.com/logo.png"
                  {...invoiceForm.register("invoiceLogo")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceCompanyName">Company name</Label>
                <Input
                  id="invoiceCompanyName"
                  placeholder="Defaults to store name"
                  {...invoiceForm.register("invoiceCompanyName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceEmail">Email</Label>
                <Input
                  id="invoiceEmail"
                  type="email"
                  placeholder="Defaults to support email"
                  {...invoiceForm.register("invoiceEmail")}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="invoiceAddress">Address</Label>
                <Textarea
                  id="invoiceAddress"
                  placeholder="Company address for invoice"
                  className="min-h-[80px]"
                  {...invoiceForm.register("invoiceAddress")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoicePhone">Phone</Label>
                <Input
                  id="invoicePhone"
                  placeholder="Optional"
                  {...invoiceForm.register("invoicePhone")}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={invoicePending}>
                {invoicePending ? "Saving..." : "Save invoice settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

