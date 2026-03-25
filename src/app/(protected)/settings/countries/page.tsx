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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Globe2, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { AdminCountry, AdminState } from "@/lib/types";

interface CountryFormData {
  name: string;
  iso2: string;
  iso3: string;
  phone_code: string;
  is_active: boolean;
}

interface StateFormData {
  name: string;
  code: string;
  is_active: boolean;
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<AdminCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [countryDialogOpen, setCountryDialogOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<AdminCountry | null>(null);
  const [countryForm, setCountryForm] = useState<CountryFormData>({
    name: "",
    iso2: "",
    iso3: "",
    phone_code: "",
    is_active: true,
  });

  const [statesDialogOpen, setStatesDialogOpen] = useState(false);
  const [statesCountry, setStatesCountry] = useState<AdminCountry | null>(null);
  const [states, setStates] = useState<AdminState[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [stateForm, setStateForm] = useState<StateFormData>({
    name: "",
    code: "",
    is_active: true,
  });
  const [editingState, setEditingState] = useState<AdminState | null>(null);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const response = await fetch(
        `/api/admin/countries${params.toString() ? `?${params.toString()}` : ""}`
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load countries");
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.data ?? [];
      setCountries(list);
    } catch (error) {
      console.error("Failed to load countries:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load countries"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCountryDialog = (country?: AdminCountry) => {
    if (country) {
      setEditingCountry(country);
      setCountryForm({
        name: country.name,
        iso2: country.iso2 ?? "",
        iso3: country.iso3 ?? "",
        phone_code: country.phone_code ?? "",
        is_active: country.is_active,
      });
    } else {
      setEditingCountry(null);
      setCountryForm({
        name: "",
        iso2: "",
        iso3: "",
        phone_code: "",
        is_active: true,
      });
    }
    setCountryDialogOpen(true);
  };

  const handleSaveCountry = async () => {
    if (!countryForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!countryForm.iso2.trim() || countryForm.iso2.trim().length !== 2) {
      toast.error("ISO2 code must be 2 characters");
      return;
    }

    try {
      const payload = {
        name: countryForm.name.trim(),
        iso2: countryForm.iso2.trim().toUpperCase(),
        iso3: countryForm.iso3.trim()
          ? countryForm.iso3.trim().toUpperCase()
          : null,
        phone_code: countryForm.phone_code.trim() || null,
        is_active: countryForm.is_active,
      };

      const url = editingCountry
        ? `/api/admin/countries/${editingCountry.id}`
        : "/api/admin/countries";
      const method = editingCountry ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg =
          data.errors?.name?.[0] ??
          data.errors?.iso2?.[0] ??
          data.errors?.iso3?.[0] ??
          data.message ??
          "Failed to save country";
        throw new Error(msg);
      }

      toast.success(
        `Country ${editingCountry ? "updated" : "created"} successfully`
      );
      setCountryDialogOpen(false);
      await loadCountries();
    } catch (error) {
      console.error("Failed to save country:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save country"
      );
    }
  };

  const handleDeleteCountry = async (country: AdminCountry) => {
    if (
      !confirm(
        `Are you sure you want to delete ${country.name}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/countries/${country.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const msg = data.message || "Failed to delete country";
        throw new Error(msg);
      }

      toast.success("Country deleted successfully");
      await loadCountries();
    } catch (error) {
      console.error("Failed to delete country:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete country"
      );
    }
  };

  const openStatesDialog = async (country: AdminCountry) => {
    setStatesCountry(country);
    setStatesDialogOpen(true);
    setEditingState(null);
    setStateForm({
      name: "",
      code: "",
      is_active: true,
    });
    await loadStates(country.id);
  };

  const loadStates = async (countryId: number) => {
    try {
      setStatesLoading(true);
      const response = await fetch(
        `/api/admin/countries/${countryId}/states`
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load states");
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.data ?? [];
      setStates(list);
    } catch (error) {
      console.error("Failed to load states:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load states"
      );
    } finally {
      setStatesLoading(false);
    }
  };

  const handleOpenStateForm = (state?: AdminState) => {
    if (state) {
      setEditingState(state);
      setStateForm({
        name: state.name,
        code: state.code ?? "",
        is_active: state.is_active,
      });
    } else {
      setEditingState(null);
      setStateForm({
        name: "",
        code: "",
        is_active: true,
      });
    }
  };

  const handleSaveState = async () => {
    if (!statesCountry) return;
    if (!stateForm.name.trim()) {
      toast.error("State name is required");
      return;
    }

    try {
      const payload = {
        name: stateForm.name.trim(),
        code: stateForm.code.trim() || null,
        is_active: stateForm.is_active,
      };

      const url = editingState
        ? `/api/admin/countries/${statesCountry.id}/states/${editingState.id}`
        : `/api/admin/countries/${statesCountry.id}/states`;
      const method = editingState ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg =
          data.errors?.name?.[0] ?? data.message ?? "Failed to save state";
        throw new Error(msg);
      }

      toast.success(
        `State ${editingState ? "updated" : "created"} successfully`
      );
      setEditingState(null);
      setStateForm({
        name: "",
        code: "",
        is_active: true,
      });
      await loadStates(statesCountry.id);
      await loadCountries();
    } catch (error) {
      console.error("Failed to save state:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save state"
      );
    }
  };

  const handleDeleteState = async (state: AdminState) => {
    if (!statesCountry) return;
    if (!confirm(`Delete state ${state.name}? This cannot be undone.`)) {
      return;
    }
    try {
      const response = await fetch(
        `/api/admin/countries/${statesCountry.id}/states/${state.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const msg = data.message || "Failed to delete state";
        throw new Error(msg);
      }

      toast.success("State deleted successfully");
      await loadStates(statesCountry.id);
      await loadCountries();
    } catch (error) {
      console.error("Failed to delete state:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete state"
      );
    }
  };

  const filteredCountries = countries;

  const canSaveCountry =
    countryForm.name.trim() && countryForm.iso2.trim().length === 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Countries &amp; States</h1>
          <p className="text-muted-foreground">
            Manage which countries and states are available for addresses,
            shipping, and tax rules.
          </p>
        </div>
        <Button onClick={() => handleOpenCountryDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Country
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Countries</CardTitle>
          <CardDescription>
            Configure active countries and manage their states and provinces.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              placeholder="Search by name or ISO code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  loadCountries();
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  loadCountries();
                }}
              >
                Reset
              </Button>
              <Button variant="outline" onClick={() => loadCountries()}>
                Apply
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading countries...
            </div>
          ) : filteredCountries.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Globe2 className="mx-auto mb-4 h-10 w-10 opacity-40" />
              <p>No countries found. Add your first country to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ISO2</TableHead>
                  <TableHead>ISO3</TableHead>
                  <TableHead>Phone Code</TableHead>
                  <TableHead>States</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCountries.map((country) => (
                  <TableRow key={country.id}>
                    <TableCell className="font-medium">
                      {country.name}
                    </TableCell>
                    <TableCell>{country.iso2 ?? "—"}</TableCell>
                    <TableCell>{country.iso3 ?? "—"}</TableCell>
                    <TableCell>{country.phone_code ?? "—"}</TableCell>
                    <TableCell>
                      {country.states_count ?? country.states?.length ?? 0}
                    </TableCell>
                    <TableCell>
                      {country.is_active ? "Active" : "Inactive"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStatesDialog(country)}
                        >
                          <MapPin className="mr-1 h-4 w-4" />
                          States
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenCountryDialog(country)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCountry(country)}
                          title="Delete country"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={countryDialogOpen} onOpenChange={setCountryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCountry ? "Edit Country" : "Add Country"}
            </DialogTitle>
            <DialogDescription>
              Configure country codes and availability for checkout and shipping.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="country-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="country-name"
                value={countryForm.name}
                onChange={(e) =>
                  setCountryForm({ ...countryForm, name: e.target.value })
                }
                placeholder="e.g., United Kingdom"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iso2">
                  ISO2 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="iso2"
                  value={countryForm.iso2}
                  onChange={(e) =>
                    setCountryForm({
                      ...countryForm,
                      iso2: e.target.value.toUpperCase(),
                    })
                  }
                  maxLength={2}
                  placeholder="GB"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iso3">ISO3</Label>
                <Input
                  id="iso3"
                  value={countryForm.iso3}
                  onChange={(e) =>
                    setCountryForm({
                      ...countryForm,
                      iso3: e.target.value.toUpperCase(),
                    })
                  }
                  maxLength={3}
                  placeholder="GBR"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_code">Phone code</Label>
              <Input
                id="phone_code"
                value={countryForm.phone_code}
                onChange={(e) =>
                  setCountryForm({
                    ...countryForm,
                    phone_code: e.target.value,
                  })
                }
                placeholder="e.g., +44"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={countryForm.is_active}
                onCheckedChange={(v) =>
                  setCountryForm({ ...countryForm, is_active: v })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCountryDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCountry} disabled={!canSaveCountry}>
              {editingCountry ? "Update" : "Create"} Country
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statesDialogOpen} onOpenChange={setStatesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {statesCountry
                ? `States in ${statesCountry.name}`
                : "Manage States"}
            </DialogTitle>
            <DialogDescription>
              Add, edit, or remove states and provinces for this country.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1">
                <Label>State details</Label>
                <p className="text-xs text-muted-foreground">
                  Use this form to create or update a state.
                </p>
              </div>
              <Button
                variant={editingState ? "outline" : "default"}
                size="sm"
                onClick={() => handleOpenStateForm()}
              >
                <Plus className="mr-1 h-4 w-4" />
                New State
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="state-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="state-name"
                  value={stateForm.name}
                  onChange={(e) =>
                    setStateForm({ ...stateForm, name: e.target.value })
                  }
                  placeholder="e.g., California"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state-code">Code</Label>
                <Input
                  id="state-code"
                  value={stateForm.code}
                  onChange={(e) =>
                    setStateForm({ ...stateForm, code: e.target.value })
                  }
                  placeholder="e.g., CA"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="state-active"
                checked={stateForm.is_active}
                onCheckedChange={(v) =>
                  setStateForm({ ...stateForm, is_active: v })
                }
              />
              <Label htmlFor="state-active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              {editingState && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenStateForm()}
                >
                  Cancel edit
                </Button>
              )}
              <Button size="sm" onClick={handleSaveState}>
                {editingState ? "Update State" : "Add State"}
              </Button>
            </div>

            <div className="border-t pt-4">
              {statesLoading ? (
                <div className="py-6 text-center text-muted-foreground">
                  Loading states...
                </div>
              ) : states.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No states added yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {states.map((state) => (
                      <TableRow key={state.id}>
                        <TableCell>{state.name}</TableCell>
                        <TableCell>{state.code ?? "—"}</TableCell>
                        <TableCell>
                          {state.is_active ? "Active" : "Inactive"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenStateForm(state)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteState(state)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

