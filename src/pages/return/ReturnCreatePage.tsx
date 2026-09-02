import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm, useFieldArray, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { useCreateReturn, useReturnEligibleLines } from "@/api/return";
import { useInvoiceList } from "@/api/invoice";
import { returnFormSchema, type ReturnFormInput } from "@/schemas/return";
import { calcReturnLineAmounts, calcReturnTotals } from "@/lib/return-calc";
import type { ReturnEligibleLine } from "@/types";

export function ReturnCreatePage() {
  const navigate = useNavigate();
  const createReturn = useCreateReturn();
  const { data: invoices, isLoading: invoicesLoading } = useInvoiceList();
  const [showCancel, setShowCancel] = useState(false);

  const resolver = zodResolver(returnFormSchema) as Resolver<ReturnFormInput>;
  const {
    register, handleSubmit, control, setValue, resetField,
    formState: { errors },
  } = useForm<ReturnFormInput>({
    resolver,
    defaultValues: {
      tgl: new Date().toISOString().split("T")[0],
      doku_Faktur: "",
      kode_Valas: "Rp.",
      kurs: 1,
      ppn: 0,
      memo: "",
      lineItems: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });
  const doku_Faktur = useWatch({ control, name: "doku_Faktur" });
  const lineItems = useWatch({ control, name: "lineItems" });
  const ppn = useWatch({ control, name: "ppn" }) ?? 0;
  const kode_Valas = useWatch({ control, name: "kode_Valas" });
  const kurs = useWatch({ control, name: "kurs" }) ?? 1;

  const eligibleQuery = useReturnEligibleLines(doku_Faktur || null);
  const eligible = doku_Faktur ? (eligibleQuery.data ?? []) : [];
  const invoice = useMemo(() => {
    return (invoices ?? []).find((i) => i.doku === doku_Faktur);
  }, [invoices, doku_Faktur]);

  useEffect(() => {
    resetField("lineItems");
    if (doku_Faktur && invoice) {
      setValue("kode_Valas", "Rp.");
      setValue("kurs", 1);
    }
  }, [doku_Faktur, invoice, resetField, setValue]);

  useEffect(() => {
    if (kode_Valas === "Rp." && kurs !== 1) {
      setValue("kurs", 1);
    }
  }, [kode_Valas, kurs, setValue]);

  const totals = useMemo(
    () => calcReturnTotals(lineItems, ppn),
    [lineItems, ppn],
  );

  function addLine() {
    if (eligible.length === 0) return;
    const key = (e: ReturnEligibleLine) => `${e.kode_Brg}|${e.doku_LPB ?? ""}|${e.npo ?? ""}`;
    const used = new Set(lineItems.map((l) => `${l.kode_Brg}|${l.doku_LPB ?? ""}|${l.npo ?? ""}`));
    const next = eligible.find((e) => !used.has(key(e)));
    if (!next) return;
    const amount = calcReturnLineAmounts({
      jumlah: 1,
      harga: next.harga,
      diskon: 0,
    });
    append({
      doku_Faktur: next.doku_Faktur,
      doku_LPB: next.doku_LPB,
      npo: next.npo,
      kode_Brg: next.kode_Brg,
      kode_Gudang: next.kode_Gudang ?? null,
      alias: next.alias ?? null,
      jumlah: 1,
      harga: next.harga,
      diskon: 0,
      ppnBm: next.ppnBm,
      nilai: amount.net,
      noUrut: lineItems.length + 1,
    });
  }

  function refreshLineAmounts() {
    lineItems.forEach((line, index) => {
      const amount = calcReturnLineAmounts({
        jumlah: Number(line.jumlah) || 0,
        harga: Number(line.harga) || 0,
        diskon: Number(line.diskon) || 0,
      });
      setValue(`lineItems.${index}.nilai`, amount.net, { shouldValidate: false });
    });
  }

  useEffect(() => {
    refreshLineAmounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineItems.map((l) => `${l.jumlah}-${l.harga}-${l.diskon}`).join(",")]);

  const onSubmit = (values: ReturnFormInput) => {
    createReturn.mutate(values, {
      onSuccess: (data) => {
        toast.success(`Vendor return ${data.doku} created`);
        navigate({ to: "/returns/$doku", params: { doku: data.doku } });
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to create vendor return");
      },
    });
  };

  const invoiceOptions = (invoices ?? []).map((i) => ({
    value: i.doku,
    label: `${i.doku} — ${i.supplierName ?? i.kode_Supplier ?? ""}`.trim(),
  }));

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => setShowCancel(true)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Vendor Return</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create a return based on an AP invoice</p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Source Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Invoice</label>
              <Select value={doku_Faktur} onValueChange={(v) => setValue("doku_Faktur", v)}>
                <SelectTrigger className="w-full md:w-[360px]">
                  <SelectValue placeholder="Select invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoicesLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : invoiceOptions.length === 0 ? (
                    <SelectItem value="none" disabled>No invoices available</SelectItem>
                  ) : (
                    invoiceOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.doku_Faktur?.message && (
                <p className="text-xs text-destructive">{errors.doku_Faktur.message}</p>
              )}
            </div>
            {invoice && (
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                <div>
                  <span className="text-muted-foreground">Vendor</span>
                  <p className="font-medium">{invoice.supplierName ?? invoice.kode_Supplier ?? "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Invoice Date</span>
                  <p className="font-medium">{invoice.tgl?.split("T")[0] ?? "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Currency</span>
                  <p className="font-medium">Rp.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Return Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Return Date</label>
                <Input type="date" {...register("tgl")} />
                {errors.tgl?.message && <p className="text-xs text-destructive">{errors.tgl.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Currency</label>
                <Input {...register("kode_Valas")} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Rate</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register("kurs", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">VAT %</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  {...register("ppn", { valueAsNumber: true })}
                />
                {errors.ppn?.message && <p className="text-xs text-destructive">{errors.ppn.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Notes</label>
              <Textarea {...register("memo")} rows={3} />
              {errors.memo?.message && <p className="text-xs text-destructive">{errors.memo.message}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Return Lines</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!doku_Faktur || eligible.length === 0}
              onClick={addLine}
            >
              <Plus className="mr-1.5 size-4" />Add Line
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Item</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-[90px]">UOM</TableHead>
                    <TableHead className="w-[90px]">Qty</TableHead>
                    <TableHead className="w-[110px]">Price</TableHead>
                    <TableHead className="w-[80px]">Disc</TableHead>
                    <TableHead className="w-[110px]">Total</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doku_Faktur && eligibleQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32">
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : fields.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                        Select an invoice and add lines to build the return.
                      </TableCell>
                    </TableRow>
                  ) : (
                    fields.map((field, index) => {
                      const row = calcReturnLineAmounts({
                        jumlah: Number(lineItems[index]?.jumlah) || 0,
                        harga: Number(lineItems[index]?.harga) || 0,
                        diskon: Number(lineItems[index]?.diskon) || 0,
                      });
                      return (
                        <TableRow key={field.id}>
                          <TableCell className="text-sm">{index + 1}</TableCell>
                          <TableCell>
                            <Input
                              placeholder="Item code"
                              {...register(`lineItems.${index}.kode_Brg`)}
                              className="text-sm"
                            />
                            {errors.lineItems?.[index]?.kode_Brg?.message && (
                              <p className="mt-1 text-xs text-destructive">{errors.lineItems[index]?.kode_Brg?.message}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              {...register(`lineItems.${index}.alias`)}
                              className="text-sm"
                              placeholder="UOM / alias"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0.01}
                              step="0.01"
                              {...register(`lineItems.${index}.jumlah`, { valueAsNumber: true })}
                              className="text-sm"
                            />
                            {errors.lineItems?.[index]?.jumlah?.message && (
                              <p className="mt-1 text-xs text-destructive">{errors.lineItems[index]?.jumlah?.message}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              {...register(`lineItems.${index}.harga`, { valueAsNumber: true })}
                              className="text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              {...register(`lineItems.${index}.diskon`, { valueAsNumber: true })}
                              className="text-sm"
                            />
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            {row.net.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="size-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {errors.lineItems?.message && (
              <p className="text-xs text-destructive">{errors.lineItems.message}</p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground">Gross</span>
                  <span className="tabular-nums">{totals.gross.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="tabular-nums">{totals.discount.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground">VAT</span>
                  <span className="tabular-nums">{totals.vat.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between gap-8 font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{totals.valueAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={createReturn.isPending || fields.length === 0}>
            <Save className="mr-1.5 size-4" />
            {createReturn.isPending ? "Creating..." : "Create Return"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowCancel(true)}>
            <X className="mr-1.5 size-4" />Cancel
          </Button>
        </div>
      </form>
      <ConfirmDialog
        open={showCancel}
        onOpenChange={setShowCancel}
        title="Discard changes?"
        description="Any unsaved data will be lost."
        confirmLabel="Leave"
        onConfirm={() => navigate({ to: "/returns" })}
      />
    </div>
  );
}
