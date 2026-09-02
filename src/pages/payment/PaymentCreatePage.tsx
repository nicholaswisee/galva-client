import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Controller, useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilePlus, Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DataSelect } from "@/components/data-select";
import { useVendors, useBanks } from "@/lib/use-master-data";
import { useInvoiceList } from "@/api/invoice";
import { buildCreatePaymentPayload, useCreatePayment, usePaidByVendor } from "@/api/payment";
import {
  buildPaymentFormSchema,
  calcPaymentTotals,
  type PaymentFormInput,
} from "@/schemas/payment";

export function PaymentCreatePage() {
  const navigate = useNavigate();
  const { data: vendors } = useVendors();
  const { data: banks } = useBanks();
  const { data: invoices, isLoading: invoicesLoading } = useInvoiceList();
  const createPayment = useCreatePayment();

  const [kode_Supplier, setKode_Supplier] = useState("");

  const { data: paidByInvoice = {}, isLoading: outstandingLoading } = usePaidByVendor(kode_Supplier || null);

  const vendorItems = vendors?.map((v) => ({ code: v.kode, label: `${v.kode} - ${v.nama}` })) ?? [];
  const bankItems = banks?.map((b) => ({ code: b.kode, label: `${b.kode} - ${b.nama}` })) ?? [];

  const vendorInvoices = useMemo(
    () => (invoices ?? []).filter(
      (inv) => (inv.kode_Supplier ?? "").toLowerCase() === kode_Supplier.toLowerCase(),
    ),
    [invoices, kode_Supplier],
  );

  // Outstanding per invoice is invoice value minus what usePaidByVendor reports as already paid.
  const outstandingByInvoice = useMemo(() => {
    const map: Record<string, number> = {};
    for (const inv of vendorInvoices) {
      map[inv.doku] = Math.max(0, (inv.nilai ?? 0) - (paidByInvoice[inv.doku] ?? 0));
    }
    return map;
  }, [vendorInvoices, paidByInvoice]);

  const resolver = useMemo(
    () => zodResolver(buildPaymentFormSchema(outstandingByInvoice)) as Resolver<PaymentFormInput>,
    [outstandingByInvoice],
  );

  const form = useForm<PaymentFormInput>({
    resolver,
    defaultValues: {
      tgl: new Date().toISOString().split("T")[0],
      kode_Supplier: "",
      kode_BankSupplier: "",
      keterangan: "",
      kode_Valas: "Rp.",
      kurs: 1,
      nilaiKas: 0,
      nilaiGiro: 0,
      lineItems: [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lineItems" });
  const { register, setValue, control, handleSubmit } = form;
  const { errors } = form.formState;

  function outstandingFor(doku: string): number {
    return outstandingByInvoice[doku] ?? 0;
  }

  // Only invoices with a positive outstanding balance are eligible for allocation.
  const eligibleInvoices = vendorInvoices.filter((inv) => outstandingFor(inv.doku) > 0);
  const invoiceItems = eligibleInvoices.map((inv) => ({
    code: inv.doku,
    label: `${inv.doku} - ${inv.supplierName ?? ""} - outstanding ${outstandingFor(inv.doku).toLocaleString("id-ID")}`,
  }));

  function handleVendorChange(code: string) {
    setKode_Supplier(code);
    setValue("kode_Supplier", code);
    setValue("lineItems", []); // allocations must match the vendor's invoices
  }

  function selectInvoice(index: number, doku: string) {
    const inv = vendorInvoices.find((i) => i.doku === doku);
    if (!inv) return;
    const remaining = outstandingFor(inv.doku);
    if (remaining <= 0) return; // fully paid invoices are not selectable
    setValue(`lineItems.${index}.doku_Faktur`, inv.doku);
    setValue(`lineItems.${index}.nilai`, inv.nilai ?? 0);
    setValue(`lineItems.${index}.totalNilai`, remaining);
    setValue(`lineItems.${index}.doku_LPB`, "");
  }

  // useWatch keeps totals live: any keystroke in a line amount or in cash/giro recomputes.
  const lineItems = useWatch({ control, name: "lineItems" });
  const nilaiKas = useWatch({ control, name: "nilaiKas" });
  const nilaiGiro = useWatch({ control, name: "nilaiGiro" });
  const totals = calcPaymentTotals(
    (lineItems ?? []).map((l) => ({
      doku_Faktur: l.doku_Faktur,
      doku_LPB: l.doku_LPB,
      nilai: Number(l.nilai) || 0,
      totalNilai: Number(l.totalNilai) || 0,
    })),
    Number(nilaiKas) || 0,
    Number(nilaiGiro) || 0,
  );

  const allocationsLocked = !kode_Supplier || invoicesLoading || outstandingLoading || invoiceItems.length === 0;

  const onSubmit = handleSubmit((values) => {
    createPayment.mutate(buildCreatePaymentPayload(values), {
      onSuccess: (res) => navigate({ to: "/payments/$doku", params: { doku: res.doku } }),
    });
  });

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create payment with invoice allocations</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2">
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" disabled>
            <FilePlus className="size-4" />New
          </Button>
          <Button type="submit" variant="ghost" size="sm" className="gap-1.5" disabled={createPayment.isPending}>
            <Save className="size-4" />Save
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate({ to: "/payments" })}>
            Cancel
          </Button>
          <div className="ml-auto"><Badge variant="outline">Draft</Badge></div>
        </div>

        {/* Header */}
        <div className="rounded-md border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Header</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Payment Date</label>
              <Controller
                control={control}
                name="tgl"
                render={({ field }) => <Input type="date" value={field.value} onChange={field.onChange} />}
              />
              {errors.tgl?.message && <p className="text-xs text-destructive">{errors.tgl.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Vendor</label>
              <Controller
                control={control}
                name="kode_Supplier"
                render={({ field }) => (
                  <DataSelect
                    items={vendorItems}
                    value={field.value}
                    onValueChange={(v) => handleVendorChange(v)}
                    placeholder="Select vendor"
                    error={errors.kode_Supplier?.message}
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Bank</label>
              <Controller
                control={control}
                name="kode_BankSupplier"
                render={({ field }) => (
                  <DataSelect
                    items={bankItems}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder="Select bank"
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Currency / Rate</label>
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name="kode_Valas"
                  render={({ field }) => <Input value={field.value} onChange={field.onChange} className="w-20" />}
                />
                <Controller
                  control={control}
                  name="kurs"
                  render={({ field }) => (
                    <Input type="number" step="0.01" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} className="w-24" />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Allocations */}
        <div className="rounded-md border bg-card">
          <div className="flex items-center justify-between border-b p-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Invoice Allocations</h2>
            <Button type="button" variant="outline" size="sm" disabled={allocationsLocked} onClick={() => append({ doku_Faktur: "", doku_LPB: "", nilai: 0, totalNilai: 0 })}>
              <Plus className="mr-1.5 size-3.5" />Add Allocation
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Original</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Applied</TableHead>
                  <TableHead>GR Ref</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                      {!kode_Supplier
                        ? "Select a vendor first to load eligible invoices."
                        : invoicesLoading || outstandingLoading
                          ? "Loading invoices..."
                          : invoiceItems.length === 0
                            ? "No invoices with an outstanding balance for this vendor."
                            : 'No allocations yet. Click "Add Allocation" to apply an invoice.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((field, index) => {
                    const lineErrors = errors.lineItems?.[index];
                    const row = lineItems[index];
                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Controller
                            control={control}
                            name={`lineItems.${index}.doku_Faktur`}
                            render={({ field: f }) => (
                              <DataSelect
                                items={invoiceItems}
                                value={f.value}
                                onValueChange={(v) => selectInvoice(index, v)}
                                placeholder="Select invoice"
                                error={lineErrors?.doku_Faktur?.message}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {Number(row?.nilai) || 0}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {outstandingFor(row?.doku_Faktur ?? "")}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-8 w-32 text-right"
                            {...register(`lineItems.${index}.totalNilai`)}
                          />
                          {lineErrors?.totalNilai?.message && (
                            <p className="mt-1 text-xs text-destructive">{lineErrors.totalNilai.message}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            placeholder="GR ref (optional)"
                            {...register(`lineItems.${index}.doku_LPB`)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => remove(index)}
                            aria-label={`Remove allocation ${index + 1}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Description + Totals */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-md border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Description</h2>
            <Controller
              control={control}
              name="keterangan"
              render={({ field }) => <Textarea value={field.value ?? ""} onChange={field.onChange} rows={3} placeholder="Description / notes..." />}
            />
          </div>
          <div className="rounded-md border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Totals</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label className="text-muted-foreground">Cash Amount</label>
                <Input type="number" step="0.01" min="0" className="h-7 w-32 text-right" {...register("nilaiKas")} />
              </div>
              {errors.nilaiKas?.message && <p className="text-xs text-destructive">{errors.nilaiKas.message}</p>}
              <div className="flex items-center justify-between text-sm">
                <label className="text-muted-foreground">Giro Amount</label>
                <Input type="number" step="0.01" min="0" className="h-7 w-32 text-right" {...register("nilaiGiro")} />
              </div>
              {errors.nilaiGiro?.message && <p className="text-xs text-destructive">{errors.nilaiGiro.message}</p>}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Applied Total</span>
                <span className="tabular-nums font-medium">{totals.appliedTotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Grand Total</span>
                <span className="tabular-nums">{totals.grandTotal.toLocaleString("id-ID")}</span>
              </div>
              {Math.abs(totals.allocationDifference) > 0.01 && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
                  Cash + Giro ({totals.grandTotal.toLocaleString("id-ID")}) does not match applied total ({totals.appliedTotal.toLocaleString("id-ID")}).
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
