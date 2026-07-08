import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Controller, useFieldArray, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  Save,
  FilePlus,
  Trash,
  Printer,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataSelect } from "@/components/data-select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  useVendors,
  useDepartments,
  useInventory,
  useWarehouses,
  useCurrencies,
} from "@/lib/use-master-data";
import { useCreatePO, useDeletePO, usePODetail, useUpdatePO } from "@/api/po";
import { poFormSchema, type POFormInput } from "@/schemas/po";
import type { PODetail } from "@/types";

interface POFormPageProps {
  mode: "new" | "edit" | "print";
  doku?: string;
}

const idr = (n: number) =>
  n.toLocaleString("id-ID", { style: "currency", currency: "IDR" });

function emptyDefaults(): POFormInput {
  return {
    doku: null,
    tgl: new Date().toISOString().split("T")[0],
    kode_Supplier: "",
    kode_dept: "",
    kode_Valas: "Rp.",
    kurs: 1,
    syarat: 30,
    ppn: 12,
    diskon: 0,
    dppNilaiLain: 0,
    ppnTunai: 0,
    memo: "",
    lineItems: [],
  };
}

export function POFormPage({ mode, doku }: POFormPageProps) {
  const navigate = useNavigate();
  const isReadOnly = mode === "print";
  const activeDoku = mode === "new" ? null : doku ?? null;

  const { data: vendors } = useVendors();
  const { data: departments } = useDepartments();
  const { data: inventory } = useInventory();
  const { data: warehouses } = useWarehouses();
  const { data: currencies } = useCurrencies();

  const detailQuery = usePODetail(activeDoku);
  const createPO = useCreatePO();
  const updatePO = useUpdatePO();
  const deletePO = useDeletePO();

  const mapDetailToForm = (po: PODetail): POFormInput => ({
    doku: po.doku,
    tgl: po.tgl ? po.tgl.split("T")[0] : new Date().toISOString().split("T")[0],
    kode_Supplier: po.kode_Supplier ?? "",
    kode_dept: po.kode_dept ?? "",
    kode_Valas: po.kode_Valas ?? "Rp.",
    kurs: po.kurs ?? 1,
    syarat: po.syarat ?? 30,
    ppn: po.ppn ?? 12,
    diskon: po.diskon ?? 0,
    dppNilaiLain: po.dppNilaiLain ?? 0,
    ppnTunai: po.ppnTunai ?? 0,
    memo: po.memo ?? "",
    lineItems: po.lines.map((l) => ({
      id_sub_po: l.id_sub_po,
      kode_Brg: l.kode_Brg,
      merk: l.merk ?? "",
      model: l.model ?? "",
      satuan: l.satuan ?? "PC",
      jumlah: l.jumlah,
      harga: l.harga,
      discPct: l.discPct,
      disc: l.disc,
      total: l.total,
      kode_Gudang: l.kode_Gudang ?? "",
      alias: l.alias ?? "",
      note: l.note ?? "",
      schedule: l.schedule ? l.schedule.split("T")[0] : "",
      kode_Valas: po.kode_Valas ?? "Rp.",
      kurs: po.kurs ?? 1,
      ppn: 0,
    })),
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copyNote, setCopyNote] = useState(false);

  const form = useForm<POFormInput>({
    resolver: zodResolver(poFormSchema) as Resolver<POFormInput>,
    mode: "onBlur",
    defaultValues: emptyDefaults(),
  });

  const { control, register, handleSubmit, reset, watch, setValue, getValues } =
    form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const watchedLineItems = watch("lineItems");
  const watchedKodeValas = watch("kode_Valas");
  const watchedPpn = watch("ppn");
  const watchedKodeSupplier = watch("kode_Supplier");

  // Load detail into form on edit/print mode
  useEffect(() => {
    if (mode === "new") return;
    if (!detailQuery.data) return;
    reset(mapDetailToForm(detailQuery.data.data));
  }, [mode, detailQuery.data, reset]);

  // Update kurs when currency changes
  useEffect(() => {
    const cur = currencies?.find((c) => c.kode === watchedKodeValas);
    if (cur) setValue("kurs", cur.kurs);
  }, [watchedKodeValas, currencies, setValue]);

  // Recalculate totals when lines or ppn change
  const grossAmount = (watchedLineItems ?? []).reduce(
    (s, i) => s + (Number(i.jumlah) || 0) * (Number(i.harga) || 0),
    0,
  );
  const discAmount = (watchedLineItems ?? []).reduce(
    (s, i) => s + (Number(i.disc) || 0),
    0,
  );
  const netAmount = grossAmount - discAmount;
  const formDppNilaiLain = Number(watch("dppNilaiLain")) || 0;
  const dppNilaiLainCalc = formDppNilaiLain > 0 ? formDppNilaiLain : netAmount;
  const vat = dppNilaiLainCalc * ((Number(watchedPpn) || 0) / 100);
  const purchaseAmount = dppNilaiLainCalc + vat;
  const watchedKurs = Number(watch("kurs")) || 1;
  const grandTotal = purchaseAmount * watchedKurs;

  const recalcLine = (index: number) => {
    const item = getValues(`lineItems.${index}`);
    const jumlah = Number(item.jumlah) || 0;
    const harga = Number(item.harga) || 0;
    const discPct = Number(item.discPct) || 0;
    const gross = jumlah * harga;
    const disc = gross * (discPct / 100);
    const total = gross - disc;
    setValue(`lineItems.${index}.disc`, disc, { shouldDirty: true });
    setValue(`lineItems.${index}.total`, total, { shouldDirty: true });
  };

  const handleStockCodeChange = (index: number, value: string) => {
    setValue(`lineItems.${index}.kode_Brg`, value, { shouldDirty: true });
    const inv = inventory?.find((i) => i.kode === value);
    if (inv) {
      setValue(`lineItems.${index}.alias`, inv.nama, { shouldDirty: true });
      setValue(`lineItems.${index}.merk`, inv.merk ?? "", { shouldDirty: true });
      setValue(
        `lineItems.${index}.satuan`,
        inv.satuan ?? "PC",
        { shouldDirty: true },
      );
      setValue(
        `lineItems.${index}.harga`,
        Number(inv.harga ?? 0),
        { shouldDirty: true },
      );
      recalcLine(index);
    }
  };

  const selectedVendor = vendors?.find((v) => v.kode === watchedKodeSupplier);

  const vendorItems = vendors?.map((v) => ({
    code: v.kode,
    label: `${v.kode} - ${v.nama}`,
  })) ?? [];
  const deptItems = departments?.map((d) => ({
    code: d.kode,
    label: `${d.kode} - ${d.nama}`,
  })) ?? [];
  const inventoryItems = inventory?.map((i) => ({
    code: i.kode,
    label: `${i.kode} - ${i.nama}`,
  })) ?? [];
  const warehouseItems = warehouses?.map((w) => ({
    code: w.kode,
    label: `${w.kode} - ${w.nama}`,
  })) ?? [];
  const currencyItems = currencies?.map((c) => ({
    code: c.kode,
    label: `${c.kode} - ${c.nama}`,
  })) ?? [];

  const onAddLine = () => {
    append({
      kode_Brg: "",
      merk: "",
      model: "",
      satuan: "PC",
      jumlah: 1,
      harga: 0,
      discPct: 0,
      disc: 0,
      total: 0,
      kode_Gudang: "",
      alias: "",
      note: "",
      schedule: "",
      kode_Valas: watchedKodeValas,
      kurs: watchedKurs,
      ppn: 0,
    });
  };

  const onNew = () => {
    reset(emptyDefaults());
    setCopyNote(false);
    navigate({ to: "/po/new", search: { mode: "new" } });
  };

  const onRepeat = () => {
    const current = getValues();
    reset({
      ...current,
      doku: null,
    });
    setCopyNote(false);
    navigate({ to: "/po/new", search: { mode: "new" } });
  };

  const onPrint = () => {
    if (!activeDoku) return;
    window.open(`/po/${activeDoku}/print`, "_blank");
  };

  const onDelete = () => {
    if (!activeDoku || !detailQuery.data) return;
    deletePO.mutate(
      { doku: activeDoku, eTag: detailQuery.data.eTag },
      {
        onSuccess: () => navigate({ to: "/po" }),
      },
    );
  };

  const onSubmit = (data: POFormInput) => {
    if (mode === "new") {
      createPO.mutate(
        {
          doku: data.doku ?? null,
          kode_Supplier: data.kode_Supplier,
          kode_dept: data.kode_dept,
          tgl: new Date(data.tgl).toISOString(),
          kode_Valas: data.kode_Valas,
          kurs: data.kurs,
          syarat: data.syarat,
          ppn: data.ppn,
          diskon: data.diskon ?? 0,
          dppNilaiLain: data.dppNilaiLain ?? 0,
          ppnTunai: data.ppnTunai ?? 0,
          memo: data.memo || null,
          lineItems: data.lineItems.map((item) => ({
            kode_Brg: item.kode_Brg,
            merk: item.merk || null,
            model: item.model || null,
            satuan: item.satuan || null,
            jumlah: item.jumlah,
            harga: item.harga,
            discPct: item.discPct,
            disc: item.disc,
            total: item.total,
            kode_Gudang: item.kode_Gudang || null,
            alias: item.alias || null,
            note: item.note || null,
            schedule: item.schedule || null,
            kode_Valas: data.kode_Valas,
            kurs: data.kurs,
            ppn: item.total * (data.ppn / 100),
          })),
        },
        {
          onSuccess: (result) => {
            if (result?.doku) {
              navigate({ to: "/po/$id", params: { id: result.doku }, search: { mode: "edit" } });
            } else {
              navigate({ to: "/po" });
            }
          },
        },
      );
    } else if (mode === "edit" && activeDoku && detailQuery.data) {
      updatePO.mutate(
        {
          doku: activeDoku,
          eTag: detailQuery.data.eTag,
          body: {
            doku: data.doku ?? null,
            kode_Supplier: data.kode_Supplier,
            kode_dept: data.kode_dept,
            tgl: new Date(data.tgl).toISOString(),
            kode_Valas: data.kode_Valas,
            kurs: data.kurs,
            syarat: data.syarat,
            ppn: data.ppn,
            diskon: data.diskon ?? 0,
            dppNilaiLain: data.dppNilaiLain ?? 0,
            ppnTunai: data.ppnTunai ?? 0,
            memo: data.memo || null,
            lineItems: data.lineItems.map((item) => ({
              kode_Brg: item.kode_Brg,
              merk: item.merk || null,
              model: item.model || null,
              satuan: item.satuan || null,
              jumlah: item.jumlah,
              harga: item.harga,
              discPct: item.discPct,
              disc: item.disc,
              total: item.total,
              kode_Gudang: item.kode_Gudang || null,
              alias: item.alias || null,
              note: item.note || null,
              schedule: item.schedule || null,
              kode_Valas: data.kode_Valas,
              kurs: data.kurs,
              ppn: item.total * (data.ppn / 100),
            })),
          },
        },
        {
          onSuccess: (result) => {
            reset(mapDetailToForm(result.data));
          },
        },
      );
    }
  };

  const watchedDoku = watch("doku");
  const isSaving = createPO.isPending || updatePO.isPending;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Purchase Order (PO)
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "new"
            ? "Create purchase order from approved PR"
            : mode === "print"
              ? "Print purchase order"
              : "Edit purchase order"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={onNew}
            disabled={isReadOnly}
          >
            <FilePlus className="size-4" />New
          </Button>
          {!isReadOnly && mode === "edit" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={onRepeat}
            >
              <RotateCcw className="size-4" />Repeat
            </Button>
          )}
          {mode !== "new" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setDeleteOpen(true)}
              disabled={isReadOnly}
            >
              <Trash className="size-4" />Delete
            </Button>
          )}
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            disabled={isSaving || isReadOnly}
          >
            <Save className="size-4" />Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={onPrint}
            disabled={mode === "new" || !activeDoku}
          >
            <Printer className="size-4" />Print
          </Button>
          <div className="ml-auto">
            <Badge variant="outline">Draft</Badge>
          </div>
        </div>

        {/* Header */}
        <div className="rounded-md border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Header
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Order No.</label>
              <Input
                value={watchedDoku ?? ""}
                placeholder="Auto-generated"
                readOnly
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Date</label>
              <Input
                type="date"
                {...register("tgl")}
                readOnly={isReadOnly}
                required
              />
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
                    onValueChange={field.onChange}
                    placeholder="Select vendor"
                    disabled={isReadOnly}
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">T.O.P (days)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  {...register("syarat", { valueAsNumber: true })}
                  readOnly={isReadOnly}
                />
                {selectedVendor?.syarat != null && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Default: {selectedVendor.syarat}d
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Department</label>
              <Controller
                control={control}
                name="kode_dept"
                render={({ field }) => (
                  <DataSelect
                    items={deptItems}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select dept"
                    disabled={isReadOnly}
                  />
                )}
              />
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-medium">Currency / Rate</label>
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name="kode_Valas"
                  render={({ field }) => (
                    <DataSelect
                      items={currencyItems}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Currency"
                      disabled={isReadOnly}
                    />
                  )}
                />
                <Input
                  type="number"
                  step="0.01"
                  {...register("kurs", { valueAsNumber: true })}
                  readOnly
                  className="w-32"
                />
                {watchedKodeValas !== "Rp." && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    1 {watchedKodeValas} = {watchedKurs.toLocaleString("id-ID")} Rp.
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={copyNote}
                  onChange={(e) => setCopyNote(e.target.checked)}
                  disabled={isReadOnly}
                />
                Copy Note
              </label>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-md border bg-card">
          <div className="flex items-center justify-between border-b p-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Detail Items
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddLine}
              disabled={isReadOnly}
            >
              <Plus className="mr-1.5 size-3.5" />Add Item
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Stock Code</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="w-[90px]">Qty</TableHead>
                  <TableHead className="w-[90px]">Unit</TableHead>
                  <TableHead className="w-[110px]">Price</TableHead>
                  <TableHead className="w-[90px]">Disc %</TableHead>
                  <TableHead className="w-[90px]">Disc</TableHead>
                  <TableHead className="w-[110px]">Total</TableHead>
                  <TableHead className="w-[80px]">WH</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={15}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      No line items. Click "Add Item" to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((row, index) => {
                    const lineItem = watchedLineItems?.[index];
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Controller
                            control={control}
                            name={`lineItems.${index}.kode_Brg`}
                            render={({ field }) => (
                              <DataSelect
                                items={inventoryItems}
                                value={field.value}
                                onValueChange={(v) =>
                                  handleStockCodeChange(index, v)
                                }
                                placeholder="Item"
                                disabled={isReadOnly}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`lineItems.${index}.merk`)}
                            className="h-8 min-w-[100px]"
                            readOnly={isReadOnly}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`lineItems.${index}.model`)}
                            className="h-8 min-w-[100px]"
                            readOnly={isReadOnly}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            {...register(`lineItems.${index}.jumlah`, {
                              valueAsNumber: true,
                              onChange: () => recalcLine(index),
                            })}
                            className="h-8 w-full min-w-[70px]"
                            readOnly={isReadOnly}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`lineItems.${index}.satuan`)}
                            className="h-8 w-full min-w-[70px]"
                            readOnly={isReadOnly}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register(`lineItems.${index}.harga`, {
                              valueAsNumber: true,
                              onChange: () => recalcLine(index),
                            })}
                            className="h-8 w-full min-w-[90px]"
                            readOnly={isReadOnly}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...register(`lineItems.${index}.discPct`, {
                              valueAsNumber: true,
                              onChange: () => recalcLine(index),
                            })}
                            className="h-8 w-full min-w-[70px]"
                            readOnly={isReadOnly}
                          />
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {idr(Number(lineItem?.disc ?? 0))}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium tabular-nums">
                          {idr(Number(lineItem?.total ?? 0))}
                        </TableCell>
                        <TableCell>
                          <Controller
                            control={control}
                            name={`lineItems.${index}.kode_Gudang`}
                            render={({ field }) => (
                              <DataSelect
                                items={warehouseItems}
                                value={field.value ?? ""}
                                onValueChange={field.onChange}
                                placeholder="WH"
                                disabled={isReadOnly}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            {...register(`lineItems.${index}.schedule`)}
                            className="h-8 min-w-[120px]"
                            readOnly={isReadOnly}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`lineItems.${index}.alias`)}
                            className="h-8 min-w-[120px]"
                            readOnly={isReadOnly}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`lineItems.${index}.note`)}
                            className="h-8 min-w-[100px]"
                            readOnly={isReadOnly}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => {
                              if (isReadOnly) return;
                              remove(index);
                            }}
                            disabled={isReadOnly}
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

        {/* Totals Block */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-1.5 rounded-md border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Notes & References
            </h2>
            <Textarea
              {...register("memo")}
              rows={4}
              placeholder="Note, Detail_1, Detail2, Detail3, Ship To, Acer Report, Partner PO, Project Name..."
              readOnly={isReadOnly}
            />
          </div>
          <div className="rounded-md border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Totals
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gross Amount</span>
                <span className="tabular-nums font-medium">{idr(grossAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Disc Amount</span>
                <span className="tabular-nums font-medium">{idr(discAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net. Amount</span>
                <span className="tabular-nums font-medium">{idr(netAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">DPP Nilai Lain</span>
                <span className="tabular-nums font-medium">
                  {idr(dppNilaiLainCalc)}
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">VAT (PPn)</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    {...register("ppn", { valueAsNumber: true })}
                    className="h-7 w-16 text-right"
                    readOnly={isReadOnly}
                  />
                  <span className="tabular-nums font-medium w-[120px] text-right">
                    {idr(vat)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Purchase Amount</span>
                <span className="tabular-nums">{idr(purchaseAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Grand Total in Rupiah</span>
                <span className="tabular-nums italic">
                  {purchaseAmount > 0 ? idr(grandTotal) : "# Zero - Rupiah #"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Footer */}
        <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
          <div className="flex gap-4">
            <span>
              Last Update by:{" "}
              <span className="font-medium text-foreground">admin</span>
            </span>
            <span>
              Create by:{" "}
              <span className="font-medium text-foreground">admin</span>
            </span>
          </div>
          <span>Date modified: {new Date().toLocaleString("id-ID")}</span>
        </div>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete purchase order?"
        description="This will permanently delete the purchase order. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          setDeleteOpen(false);
          onDelete();
        }}
        isLoading={deletePO.isPending}
      />
    </div>
  );
}
