import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Controller, useFieldArray, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FilePlus,
  Trash,
  Save,
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
  useWarehouses,
  useCurrencies,
} from "@/lib/use-master-data";
import { usePODetail, usePOList } from "@/api/po";
import {
  usePOConfirmationDetail,
  useCreatePOConfirmation,
  useUpdatePOConfirmation,
  useDeletePOConfirmation,
} from "@/api/po-confirm";
import {
  poConfirmFormSchema,
  type POConfirmFormInput,
} from "@/schemas/po-confirm";

interface POConfirmFormPageProps {
  mode: "new" | "edit" | "print";
  doku?: string;
}

const idr = (n: number) =>
  n.toLocaleString("id-ID", { style: "currency", currency: "IDR" });

function emptyDefaults(): POConfirmFormInput {
  return {
    doku: null,
    tgl: new Date().toISOString().split("T")[0],
    doku_PO: "",
    contactPr: "",
    psd: "",
    etd: "",
    memo: "",
    lineItems: [],
  };
}

export function POConfirmFormPage({ mode, doku }: POConfirmFormPageProps) {
  const navigate = useNavigate();
  const isReadOnly = mode === "print";
  const activeDoku = mode === "new" ? null : doku ?? null;

  const { data: vendors } = useVendors();
  const { data: departments } = useDepartments();
  const { data: warehouses } = useWarehouses();
  const { data: currencies } = useCurrencies();
  const { data: poList } = usePOList();
  const detailQuery = usePOConfirmationDetail(activeDoku);

  const createPOConfirm = useCreatePOConfirmation();
  const updatePOConfirm = useUpdatePOConfirmation();
  const deletePOConfirm = useDeletePOConfirmation();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [ppnPct, setPpnPct] = useState(12);

  const form = useForm<POConfirmFormInput>({
    resolver: zodResolver(poConfirmFormSchema) as Resolver<POConfirmFormInput>,
    mode: "onBlur",
    defaultValues: emptyDefaults(),
  });

  const { control, register, handleSubmit, reset, watch, setValue, getValues } =
    form;
  const { fields, replace } = useFieldArray({
    control,
    name: "lineItems",
  });

  const watchedDokuPO = watch("doku_PO");
  const watchedLineItems = watch("lineItems");
  const watchedDoku = watch("doku");

  // Fetch PO detail:
  //   - in new mode: from the picked PO in the dropdown
  //   - in edit/print mode: from the PO that the confirmation references
  const linkedPODoku =
    mode === "new"
      ? watchedDokuPO || null
      : detailQuery.data?.data.doku_PO ?? null;
  const { data: linkedPOQuery } = usePODetail(linkedPODoku);

  // Map PO lines to confirm lines when a PO is picked in new mode
  useEffect(() => {
    if (mode !== "new") return;
    if (!watchedDokuPO) return;
    if (!linkedPOQuery?.data) return;
    const po = linkedPOQuery.data;
    const mapped = po.lines.map((line) => {
      const confirmed = line.jumlahKonfirm ?? 0;
      const remaining = Math.max(0, line.jumlah - confirmed);
      return {
        id_sub_po: line.id_sub_po,
        kode_Brg: line.kode_Brg,
        merk: line.merk ?? null,
        model: line.model ?? null,
        satuan: line.satuan ?? null,
        poQty: line.jumlah,
        confirmedQty: confirmed,
        confirmQty: remaining,
        remainingQty: remaining,
        harga: line.harga,
        total: remaining * line.harga,
        kode_Gudang: line.kode_Gudang ?? null,
        note: line.note ?? "",
      };
    });
    replace(mapped);
  }, [linkedPOQuery, mode, watchedDokuPO, replace]);

  // Load detail on edit/print mode
  useEffect(() => {
    if (mode === "new") return;
    if (!detailQuery.data) return;
    const conf = detailQuery.data.data;
    const po = linkedPOQuery?.data;
    const lines = conf.lines.map((line) => {
      const matchingPOLine = po?.lines.find(
        (l) => l.id_sub_po === line.id_sub_po,
      );
      const poQty = matchingPOLine?.jumlah ?? line.jumlah;
      const confirmedQty = matchingPOLine?.jumlahKonfirm ?? 0;
      return {
        id_sub_po: line.id_sub_po,
        kode_Brg: line.kode_Brg,
        merk: matchingPOLine?.merk ?? null,
        model: matchingPOLine?.model ?? null,
        satuan: matchingPOLine?.satuan ?? null,
        poQty,
        confirmedQty,
        confirmQty: line.jumlah,
        remainingQty: Math.max(0, poQty - confirmedQty),
        harga: line.harga,
        total: line.total,
        kode_Gudang: line.kode_Gudang ?? null,
        note: line.note ?? "",
      };
    });
    reset({
      doku: conf.doku,
      tgl: conf.tgl ? conf.tgl.split("T")[0] : new Date().toISOString().split("T")[0],
      doku_PO: conf.doku_PO ?? "",
      contactPr: conf.contactPr ?? "",
      psd: conf.psd ? conf.psd.split("T")[0] : "",
      etd: conf.etd ? conf.etd.split("T")[0] : "",
      memo: conf.memo ?? "",
      lineItems: lines,
    });
    setPpnPct(12);
  }, [mode, detailQuery.data, linkedPOQuery, reset]);

  // Recalculate line total & totals when confirmQty / harga changes
  const grossAmount = (watchedLineItems ?? []).reduce(
    (s, i) => s + (Number(i.confirmQty) || 0) * (Number(i.harga) || 0),
    0,
  );
  const dppNilaiLain = grossAmount;
  const vat = dppNilaiLain * ((Number(ppnPct) || 0) / 100);
  const purchaseAmount = dppNilaiLain + vat;

  const recalcLine = (index: number) => {
    const item = getValues(`lineItems.${index}`);
    const confirmQty = Number(item.confirmQty) || 0;
    const harga = Number(item.harga) || 0;
    setValue(`lineItems.${index}.total`, confirmQty * harga, {
      shouldDirty: true,
    });
  };

  const vendorItems = vendors?.map((v) => ({
    code: v.kode,
    label: `${v.kode} - ${v.nama}`,
  })) ?? [];
  const deptItems = departments?.map((d) => ({
    code: d.kode,
    label: `${d.kode} - ${d.nama}`,
  })) ?? [];
  const warehouseItems = warehouses?.map((w) => ({
    code: w.kode,
    label: `${w.kode} - ${w.nama}`,
  })) ?? [];
  const currencyItems = currencies?.map((c) => ({
    code: c.kode,
    label: `${c.kode} - ${c.nama}`,
  })) ?? [];
  const poItems = (poList ?? [])
    .filter((po) => po.sts === "0")
    .map((po) => ({ code: po.doku ?? "", label: `${po.doku} - ${po.supplierName ?? ""}` }));

  // Header fields for the linked PO (read-only, shown in new mode)
  const headerPO = linkedPOQuery?.data;
  const headerKodeSupplier = headerPO?.kode_Supplier ?? "";
  const headerKodeDept = headerPO?.kode_dept ?? "";
  const headerKodeValas = headerPO?.kode_Valas ?? "Rp.";
  const headerKurs = headerPO?.kurs ?? 1;
  const headerCurrency = currencies?.find((c) => c.kode === headerKodeValas);

  const onNew = () => {
    reset(emptyDefaults());
    setPpnPct(12);
    navigate({ to: "/po-confirm/new", search: { mode: "new" } });
  };

  const onRepeat = () => {
    const current = getValues();
    reset({
      ...current,
      doku: null,
    });
    setPpnPct(12);
    navigate({ to: "/po-confirm/new", search: { mode: "new" } });
  };

  const onPrint = () => {
    if (!activeDoku) return;
    window.open(`/po-confirm/${activeDoku}/print`, "_blank");
  };

  const onDelete = () => {
    if (!activeDoku || !detailQuery.data) return;
    deletePOConfirm.mutate(
      { doku: activeDoku, eTag: detailQuery.data.eTag },
      {
        onSuccess: () => navigate({ to: "/po-confirm" }),
      },
    );
  };

  const onSubmit = (data: POConfirmFormInput) => {
    const payload = {
      doku: null,
      doku_PO: data.doku_PO,
      tgl: new Date(data.tgl).toISOString(),
      contactPr: data.contactPr || null,
      psd: data.psd || null,
      etd: data.etd || null,
      memo: data.memo || null,
      lineItems: data.lineItems
        .filter((item) => item.confirmQty > 0)
        .map((item) => ({
          id_sub_po: item.id_sub_po,
          kode_Brg: item.kode_Brg,
          jumlah: item.confirmQty,
          harga: item.harga,
          total: item.confirmQty * item.harga,
          kode_Gudang: item.kode_Gudang ?? null,
          note: item.note || null,
        })),
    };

    if (mode === "new") {
      createPOConfirm.mutate(payload, {
        onSuccess: (result) => {
          if (result?.doku) {
            navigate({ to: "/po-confirm/$id", params: { id: result.doku }, search: { mode: "edit" } });
          } else {
            navigate({ to: "/po-confirm" });
          }
        },
      });
    } else if (mode === "edit" && activeDoku && detailQuery.data) {
      updatePOConfirm.mutate(
        {
          doku: activeDoku,
          eTag: detailQuery.data.eTag,
          body: payload,
        },
        {
          onSuccess: () => {
            detailQuery.refetch();
          },
        },
      );
    }
  };

  const isSaving = createPOConfirm.isPending || updatePOConfirm.isPending;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          PO Confirmation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "new"
            ? "Create PO confirmation from an open purchase order"
            : mode === "print"
              ? "Print PO confirmation"
              : "Edit PO confirmation"}
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
              <label className="text-xs font-medium">Confirm #</label>
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
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-medium">PO No.</label>
              <Controller
                control={control}
                name="doku_PO"
                render={({ field }) => (
                  <DataSelect
                    items={poItems}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder="Select PO"
                    disabled={isReadOnly || mode === "edit"}
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Vendor</label>
              <DataSelect
                items={vendorItems}
                value={headerKodeSupplier}
                onValueChange={() => undefined}
                placeholder="Select vendor"
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">T.O.P (days)</label>
              <Input
                type="number"
                value={headerPO?.syarat ?? 0}
                readOnly
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Department</label>
              <DataSelect
                items={deptItems}
                value={headerKodeDept}
                onValueChange={() => undefined}
                placeholder="Select dept"
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Currency / Rate</label>
              <div className="flex items-center gap-2">
                <DataSelect
                  items={currencyItems}
                  value={headerKodeValas}
                  onValueChange={() => undefined}
                  placeholder="Currency"
                  disabled
                />
                <Input
                  type="number"
                  step="0.01"
                  value={headerKurs}
                  readOnly
                  className="w-24"
                />
                {headerCurrency && headerKodeValas !== "Rp." && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    1 {headerKodeValas} = {headerCurrency.kurs.toLocaleString("id-ID")} Rp.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-md border bg-card">
          <div className="flex items-center justify-between border-b p-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Detail Items
            </h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Stock Code</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="w-[80px]">PO Qty</TableHead>
                  <TableHead className="w-[80px]">Confirmed</TableHead>
                  <TableHead className="w-[90px]">Confirm</TableHead>
                  <TableHead className="w-[70px]">Unit</TableHead>
                  <TableHead className="w-[110px]">Price</TableHead>
                  <TableHead className="w-[110px]">Total</TableHead>
                  <TableHead className="w-[90px]">WH</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      Select a PO to load items.
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
                        <TableCell className="text-xs">
                          {lineItem?.kode_Brg ?? ""}
                        </TableCell>
                        <TableCell className="text-xs">
                          {lineItem?.merk ?? ""}
                        </TableCell>
                        <TableCell className="text-xs">
                          {lineItem?.model ?? ""}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {(Number(lineItem?.poQty) || 0).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {(Number(lineItem?.confirmedQty) || 0).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={Number(lineItem?.remainingQty) || 0}
                            {...register(`lineItems.${index}.confirmQty`, {
                              valueAsNumber: true,
                              onChange: () => recalcLine(index),
                            })}
                            className="h-8 w-full min-w-[80px]"
                            readOnly={isReadOnly}
                          />
                        </TableCell>
                        <TableCell className="text-xs">
                          {lineItem?.satuan ?? ""}
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
                        <TableCell className="text-right text-xs font-medium tabular-nums">
                          {idr(Number(lineItem?.confirmQty ?? 0) * Number(lineItem?.harga ?? 0))}
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
                            {...register(`lineItems.${index}.note`)}
                            className="h-8 min-w-[100px]"
                            readOnly={isReadOnly}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Totals + Notes */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-md border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Notes & Dates
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Contact Pr#</label>
                <Input
                  {...register("contactPr")}
                  readOnly={isReadOnly}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">PSD</label>
                <Input
                  type="date"
                  {...register("psd")}
                  readOnly={isReadOnly}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">ETD</label>
                <Input
                  type="date"
                  {...register("etd")}
                  readOnly={isReadOnly}
                />
              </div>
            </div>
            <Textarea
              {...register("memo")}
              rows={3}
              placeholder="Note, Detail 1, Detail 2..."
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
                <span className="text-muted-foreground">DPP Nilai Lain</span>
                <span className="tabular-nums font-medium">{idr(dppNilaiLain)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">VAT (PPn)</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={ppnPct}
                    onChange={(e) => setPpnPct(Number(e.target.value) || 0)}
                    className="h-7 w-16 text-right"
                    readOnly={isReadOnly}
                  />
                  <span className="w-[140px] text-right tabular-nums font-medium">
                    {idr(vat)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Purchase Amount</span>
                <span className="tabular-nums">{idr(purchaseAmount)}</span>
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
        title="Delete PO confirmation?"
        description="This will permanently delete the PO confirmation. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          setDeleteOpen(false);
          onDelete();
        }}
        isLoading={deletePOConfirm.isPending}
      />
    </div>
  );
}
