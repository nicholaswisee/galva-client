import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, FilePlus, Pencil, Trash, Eye, RotateCcw } from "lucide-react";
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
import { useVendors, useDepartments, useInventory, useWarehouses, useCurrencies } from "@/lib/use-master-data";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface POLineItem {
  kode_Brg: string;
  merk: string;
  model: string;
  jumlah: number;
  satuan: string;
  harga: number;
  discPct: number;
  disc: number;
  total: number;
  kode_Gudang: string;
  schedule: string;
  description: string;
  note: string;
}

export function POCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: vendors } = useVendors();
  const { data: departments } = useDepartments();
  const { data: inventory } = useInventory();
  const { data: warehouses } = useWarehouses();
  const { data: currencies } = useCurrencies();

  const [doku, setDoku] = useState("");
  const [tgl, setTgl] = useState(new Date().toISOString().split("T")[0]);
  const [kode_Supplier, setKode_Supplier] = useState("");
  const [kode_dept, setKode_dept] = useState("");
  const [kode_Valas, setKode_Valas] = useState("Rp.");
  const [kurs, setKurs] = useState(1.0);
  const [syarat, setSyarat] = useState(30);
  const [copyNote, setCopyNote] = useState(false);
  const [memo, setMemo] = useState("");
  const [lineItems, setLineItems] = useState<POLineItem[]>([]);

  const [grossAmount, setGrossAmount] = useState(0);
  const [discAmount, setDiscAmount] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  const [dppNilaiLain, setDppNilaiLain] = useState(0);
  const [vat, setVat] = useState(0);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [ppnPct, setPpnPct] = useState(12);

  const createPO = useMutation({
    mutationFn: async (payload: unknown) => {
      const res = await api.post("/api/purchase-orders", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const detail =
          err?.detail ?? err?.error ?? err?.message ?? "Failed to create PO";
        let message: string;
        if (typeof detail === "string") {
          message = detail;
        } else if (Array.isArray(detail)) {
          message = detail
            .map((e: { path?: unknown; message?: string }) => {
              const path = Array.isArray(e?.path) ? e.path.join(".") : String(e?.path ?? "");
              return path ? `${path}: ${e?.message ?? "invalid"}` : (e?.message ?? "invalid");
            })
            .join("; ");
        } else if (detail && typeof detail === "object") {
          message = JSON.stringify(detail);
        } else {
          message = "Failed to create PO";
        }
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order created successfully");
      navigate({ to: "/po" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addLineItem = () => setLineItems([...lineItems, { kode_Brg: "", merk: "", model: "", jumlah: 1, satuan: "PC", harga: 0, discPct: 0, disc: 0, total: 0, kode_Gudang: "", schedule: "", description: "", note: "" }]);
  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index));

  const updateLineItem = (index: number, field: keyof POLineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "kode_Brg") {
      const inv = inventory?.find((i) => i.kode === value);
      if (inv) {
        updated[index].description = inv.nama;
        updated[index].merk = inv.merk ?? "";
        updated[index].satuan = inv.satuan ?? "PC";
        updated[index].harga = inv.harga ?? 0;
      }
    }
    if (field === "jumlah" || field === "harga" || field === "discPct") {
      const item = updated[index];
      const gross = item.jumlah * item.harga;
      const disc = gross * (item.discPct / 100);
      item.disc = disc;
      item.total = gross - disc;
    }
    setLineItems(updated);
    recalcTotals(updated);
  };

  const recalcTotals = (items: POLineItem[]) => {
    const gross = items.reduce((s, i) => s + i.jumlah * i.harga, 0);
    const disc = items.reduce((s, i) => s + i.disc, 0);
    const net = gross - disc;
    const dpp = net;
    const vatAmt = dpp * (ppnPct / 100);
    const total = dpp + vatAmt;
    setGrossAmount(gross);
    setDiscAmount(disc);
    setNetAmount(net);
    setDppNilaiLain(dpp);
    setVat(vatAmt);
    setPurchaseAmount(total);
  };

  const handleCurrencyChange = (code: string) => {
    setKode_Valas(code);
    const currency = currencies?.find((c) => c.kode === code);
    setKurs(currency?.kurs ?? 1);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!kode_Supplier) {
      toast.error("Please select a vendor");
      return;
    }
    if (!kode_dept) {
      toast.error("Please select a department");
      return;
    }
    if (lineItems.length === 0) {
      toast.error("Add at least one line item");
      return;
    }
    for (let i = 0; i < lineItems.length; i++) {
      const li = lineItems[i];
      if (!li.kode_Brg) {
        toast.error(`Line ${i + 1}: missing stock code`);
        return;
      }
      if (!li.jumlah || li.jumlah <= 0) {
        toast.error(`Line ${i + 1}: quantity must be greater than 0`);
        return;
      }
    }
    createPO.mutate({
      doku: doku || null,
      kode_Supplier,
      kode_dept,
      tgl: new Date(tgl).toISOString(),
      kode_Valas,
      kurs,
      syarat,
      ppn: ppnPct,
      diskon: discAmount,
      dppNilaiLain,
      ppnTunai: 0,
      memo: memo || null,
      lineItems: lineItems.map((item) => ({
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
        alias: item.description || null,
        note: item.note || null,
        schedule: item.schedule || null,
        kode_Valas,
        kurs,
        ppn: item.total * (ppnPct / 100),
      })),
    });
  };

  const vendorItems = vendors?.map((v) => ({ code: v.kode, label: `${v.kode} - ${v.nama}` })) ?? [];
  const deptItems = departments?.map((d) => ({ code: d.kode, label: `${d.kode} - ${d.nama}` })) ?? [];
  const inventoryItems = inventory?.map((i) => ({ code: i.kode, label: `${i.kode} - ${i.nama}` })) ?? [];
  const warehouseItems = warehouses?.map((w) => ({ code: w.kode, label: `${w.kode} - ${w.nama}` })) ?? [];
  const currencyItems = currencies?.map((c) => ({ code: c.kode, label: `${c.kode} - ${c.nama}` })) ?? [];

  const selectedVendor = vendors?.find((v) => v.kode === kode_Supplier);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Purchase Order (PO)</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create purchase order from approved PR</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2">
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><FilePlus className="size-4" />New</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Pencil className="size-4" />Edit</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Trash className="size-4" />Delete</Button>
          <Button type="submit" variant="ghost" size="sm" className="gap-1.5" disabled={createPO.isPending}><Save className="size-4" />Save</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Eye className="size-4" />Preview</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><RotateCcw className="size-4" />Repeat</Button>
          <div className="ml-auto">
            <Badge variant="outline">Draft</Badge>
          </div>
        </div>

        {/* Header */}
        <div className="rounded-md border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Header</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Order No.</label>
              <Input value={doku} onChange={(e) => setDoku(e.target.value)} placeholder="Auto-generated" readOnly />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Date</label>
              <Input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Vendor</label>
              <DataSelect items={vendorItems} value={kode_Supplier} onValueChange={setKode_Supplier} placeholder="Select vendor" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">T.O.P (days)</label>
              <div className="flex items-center gap-2">
                <Input type="number" value={syarat} onChange={(e) => setSyarat(Number(e.target.value))} />
                {selectedVendor?.syarat && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Default: {selectedVendor.syarat}d</span>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Department</label>
              <DataSelect items={deptItems} value={kode_dept} onValueChange={setKode_dept} placeholder="Select dept" />
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-medium">Currency / Rate</label>
              <div className="flex items-center gap-2">
                <DataSelect items={currencyItems} value={kode_Valas} onValueChange={handleCurrencyChange} placeholder="Currency" />
                <Input type="number" step="0.01" value={kurs} readOnly className="w-32" />
                {kode_Valas !== "Rp." && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">1 {kode_Valas} = {kurs.toLocaleString("id-ID")} Rp.</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={copyNote} onChange={(e) => setCopyNote(e.target.checked)} />
                Copy Note
              </label>
            </div>
          </div>
        </div>

        {/* Detail Tab */}
        <div className="rounded-md border bg-card">
          <div className="flex items-center justify-between border-b p-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Detail Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
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
                {lineItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="h-24 text-center text-sm text-muted-foreground">
                      No line items. Click "Add Item" to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <DataSelect items={inventoryItems} value={item.kode_Brg} onValueChange={(v) => updateLineItem(index, "kode_Brg", v)} placeholder="Item" />
                      </TableCell>
                      <TableCell><Input value={item.merk} onChange={(e) => updateLineItem(index, "merk", e.target.value)} className="h-8 min-w-[100px]" /></TableCell>
                      <TableCell><Input value={item.model} onChange={(e) => updateLineItem(index, "model", e.target.value)} className="h-8 min-w-[100px]" /></TableCell>
                      <TableCell><Input type="number" min="1" value={item.jumlah} onChange={(e) => updateLineItem(index, "jumlah", Number(e.target.value))} className="h-8 w-full min-w-[70px]" /></TableCell>
                      <TableCell><Input value={item.satuan} onChange={(e) => updateLineItem(index, "satuan", e.target.value)} className="h-8 w-full min-w-[70px]" /></TableCell>
                      <TableCell><Input type="number" min="0" step="0.01" value={item.harga} onChange={(e) => updateLineItem(index, "harga", Number(e.target.value))} className="h-8 w-full min-w-[90px]" /></TableCell>
                      <TableCell><Input type="number" min="0" max="100" value={item.discPct} onChange={(e) => updateLineItem(index, "discPct", Number(e.target.value))} className="h-8 w-full min-w-[70px]" /></TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{item.disc.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right text-xs font-medium tabular-nums">{item.total.toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        <DataSelect items={warehouseItems} value={item.kode_Gudang} onValueChange={(v) => updateLineItem(index, "kode_Gudang", v)} placeholder="WH" />
                      </TableCell>
                      <TableCell><Input type="date" value={item.schedule} onChange={(e) => updateLineItem(index, "schedule", e.target.value)} className="h-8 min-w-[120px]" /></TableCell>
                      <TableCell><Input value={item.description} onChange={(e) => updateLineItem(index, "description", e.target.value)} className="h-8 min-w-[120px]" /></TableCell>
                      <TableCell><Input value={item.note} onChange={(e) => updateLineItem(index, "note", e.target.value)} className="h-8 min-w-[100px]" /></TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => removeLineItem(index)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Totals Block */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-1.5 rounded-md border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notes & References</h2>
            <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={4} placeholder="Note, Detail_1, Detail2, Detail3, Ship To, Acer Report, Partner PO, Project Name..." />
          </div>
          <div className="rounded-md border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Totals</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gross Amount</span>
                <span className="tabular-nums font-medium">{grossAmount.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Disc Amount</span>
                <span className="tabular-nums font-medium">{discAmount.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net. Amount</span>
                <span className="tabular-nums font-medium">{netAmount.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">DPP Nilai Lain</span>
                <span className="tabular-nums font-medium">{dppNilaiLain.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">VAT (PPn)</span>
                <div className="flex items-center gap-2">
                  <Input type="number" value={ppnPct} onChange={(e) => { setPpnPct(Number(e.target.value)); recalcTotals(lineItems); }} className="h-7 w-16 text-right" />
                  <span className="tabular-nums font-medium w-[120px] text-right">{vat.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span>
                </div>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Purchase Amount</span>
                <span className="tabular-nums">{purchaseAmount.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Grand Total in Rupiah</span>
                <span className="tabular-nums italic">{purchaseAmount > 0 ? (purchaseAmount * kurs).toLocaleString("id-ID", { style: "currency", currency: "IDR" }) : "# Zero - Rupiah #"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Footer */}
        <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
          <div className="flex gap-4">
            <span>Last Update by: <span className="font-medium text-foreground">admin</span></span>
            <span>Create by: <span className="font-medium text-foreground">admin</span></span>
          </div>
          <span>Date modified: {new Date().toLocaleString("id-ID")}</span>
        </div>
      </form>
    </div>
  );
}
