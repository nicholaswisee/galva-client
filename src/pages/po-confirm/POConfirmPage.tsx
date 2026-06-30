import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Save, Printer, FilePlus, Pencil, Trash } from "lucide-react";
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
import { useVendors, useDepartments, useInventory, useWarehouses } from "@/lib/use-master-data";
import { api } from "@/lib/api";
import type { POListItem } from "@/types";
import { toast } from "sonner";

interface POConfirmLineItem {
  kode_Brg: string;
  doku_PO: string;
  model: string;
  jumlah: number;
  unit: string;
  harga: number;
  discPct: number;
  disc: number;
  total: number;
  kode_Gudang: string;
  schedule: string;
  note: string;
  description: string;
}

export function POConfirmPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: vendors } = useVendors();
  const { data: departments } = useDepartments();
  const { data: inventory } = useInventory();
  const { data: warehouses } = useWarehouses();

  const [doku, setDoku] = useState("");
  const [tgl, setTgl] = useState(new Date().toISOString().split("T")[0]);
  const [kode_Supplier, setKode_Supplier] = useState("");
  const [kode_dept, setKode_dept] = useState("");
  const [kode_Valas, setKode_Valas] = useState("Rp.");
  const [kurs, setKurs] = useState(1.0);
  const [syarat, setSyarat] = useState(30);
  const [contactPr, setContactPr] = useState("");
  const [psd, setPsd] = useState("");
  const [etd, setEtd] = useState("");
  const [memo, setMemo] = useState("");
  const [lineItems, setLineItems] = useState<POConfirmLineItem[]>([]);

  const [grossAmount, setGrossAmount] = useState(0);
  const [discAmount, setDiscAmount] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  const [dppNilaiLain, setDppNilaiLain] = useState(0);
  const [vat, setVat] = useState(0);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [ppnPct, setPpnPct] = useState(10);

  const { data: pos } = useQuery<POListItem[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/api/purchase-orders");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createConfirm = useMutation({
    mutationFn: async (payload: unknown) => {
      const res = await api.post("/api/po-confirmations", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? err?.error ?? "Failed to create PO confirmation");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["po-confirmations"] });
      toast.success("PO confirmation created");
      navigate({ to: "/po" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addLineItem = () => setLineItems([...lineItems, { kode_Brg: "", doku_PO: "", model: "", jumlah: 1, unit: "PC", harga: 0, discPct: 0, disc: 0, total: 0, kode_Gudang: "", schedule: "", note: "", description: "" }]);
  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index));

  const updateLineItem = (index: number, field: keyof POConfirmLineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
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

  const recalcTotals = (items: POConfirmLineItem[]) => {
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createConfirm.mutate({ doku: doku || null, tgl: new Date(tgl).toISOString(), kode_Supplier, kode_dept, kode_Valas, kurs, syarat, contactPr, psd, etd, memo, lineItems });
  };

  const vendorItems = vendors?.map((v) => ({ code: v.kode, label: `${v.kode} - ${v.nama}` })) ?? [];
  const deptItems = departments?.map((d) => ({ code: d.kode, label: `${d.kode} - ${d.nama}` })) ?? [];
  const inventoryItems = inventory?.map((i) => ({ code: i.kode, label: `${i.kode} - ${i.nama}` })) ?? [];
  const warehouseItems = warehouses?.map((w) => ({ code: w.kode, label: `${w.kode} - ${w.nama}` })) ?? [];
  const poItems = (pos ?? []).map((po) => ({ code: po.doku ?? "", label: `${po.doku} - ${po.supplierName ?? ""}` }));

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">PO Confirmation</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vendor confirmation and delivery schedule</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2">
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><FilePlus className="size-4" />New</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Pencil className="size-4" />Edit</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Trash className="size-4" />Delete</Button>
          <Button type="submit" variant="ghost" size="sm" className="gap-1.5" disabled={createConfirm.isPending}><Save className="size-4" />Save</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Printer className="size-4" />Print</Button>
          <div className="ml-auto"><Badge variant="outline">Draft</Badge></div>
        </div>

        <div className="rounded-md border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Header</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><label className="text-xs font-medium">Confirm #</label><Input value={doku} onChange={(e) => setDoku(e.target.value)} placeholder="Auto-generated" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Date</label><Input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} required /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Vendor</label><DataSelect items={vendorItems} value={kode_Supplier} onValueChange={setKode_Supplier} placeholder="Select vendor" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">T.O.P (days)</label><Input type="number" value={syarat} onChange={(e) => setSyarat(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Department</label><DataSelect items={deptItems} value={kode_dept} onValueChange={setKode_dept} placeholder="Select dept" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Currency / Rate</label><div className="flex gap-2"><Input value={kode_Valas} onChange={(e) => setKode_Valas(e.target.value)} className="w-20" /><Input type="number" step="0.01" value={kurs} onChange={(e) => setKurs(Number(e.target.value))} className="w-24" /></div></div>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <div className="flex items-center justify-between border-b p-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Detail Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}><Plus className="mr-1.5 size-3.5" />Add Item</Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Stock Code</TableHead>
                  <TableHead>PO No.</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="w-[60px]">Qty</TableHead>
                  <TableHead className="w-[60px]">Unit</TableHead>
                  <TableHead className="w-[100px]">Price</TableHead>
                  <TableHead className="w-[60px]">Disc %</TableHead>
                  <TableHead className="w-[80px]">Disc</TableHead>
                  <TableHead className="w-[100px]">Total</TableHead>
                  <TableHead className="w-[80px]">WH</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.length === 0 ? (
                  <TableRow><TableCell colSpan={14} className="h-24 text-center text-sm text-muted-foreground">No line items. Click "Add Item" to add one.</TableCell></TableRow>
                ) : (
                  lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell><DataSelect items={inventoryItems} value={item.kode_Brg} onValueChange={(v) => updateLineItem(index, "kode_Brg", v)} placeholder="Item" /></TableCell>
                      <TableCell><DataSelect items={poItems} value={item.doku_PO} onValueChange={(v) => updateLineItem(index, "doku_PO", v)} placeholder="PO" /></TableCell>
                      <TableCell><Input value={item.model} onChange={(e) => updateLineItem(index, "model", e.target.value)} className="h-8" /></TableCell>
                      <TableCell><Input type="number" min="1" value={item.jumlah} onChange={(e) => updateLineItem(index, "jumlah", Number(e.target.value))} className="h-8" /></TableCell>
                      <TableCell><Input value={item.unit} onChange={(e) => updateLineItem(index, "unit", e.target.value)} className="h-8" /></TableCell>
                      <TableCell><Input type="number" min="0" step="0.01" value={item.harga} onChange={(e) => updateLineItem(index, "harga", Number(e.target.value))} className="h-8" /></TableCell>
                      <TableCell><Input type="number" min="0" max="100" value={item.discPct} onChange={(e) => updateLineItem(index, "discPct", Number(e.target.value))} className="h-8" /></TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{item.disc.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right text-xs font-medium tabular-nums">{item.total.toLocaleString("id-ID")}</TableCell>
                      <TableCell><DataSelect items={warehouseItems} value={item.kode_Gudang} onValueChange={(v) => updateLineItem(index, "kode_Gudang", v)} placeholder="WH" /></TableCell>
                      <TableCell><Input type="date" value={item.schedule} onChange={(e) => updateLineItem(index, "schedule", e.target.value)} className="h-8" /></TableCell>
                      <TableCell><Input value={item.note} onChange={(e) => updateLineItem(index, "note", e.target.value)} className="h-8" /></TableCell>
                      <TableCell><Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => removeLineItem(index)}><Trash2 className="size-3.5" /></Button></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-md border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notes & Dates</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><label className="text-xs font-medium">Contact Pr#</label><Input value={contactPr} onChange={(e) => setContactPr(e.target.value)} /></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">PSD</label><Input type="date" value={psd} onChange={(e) => setPsd(e.target.value)} /></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">ETD</label><Input type="date" value={etd} onChange={(e) => setEtd(e.target.value)} /></div>
            </div>
            <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} placeholder="Note, Detail 1, Detail 2..." />
          </div>
          <div className="rounded-md border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Totals</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gross Amount</span><span className="tabular-nums font-medium">{grossAmount.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Disc Amount</span><span className="tabular-nums font-medium">{discAmount.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Net. Amount</span><span className="tabular-nums font-medium">{netAmount.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">DPP Nilai Lain</span><span className="tabular-nums font-medium">{dppNilaiLain.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span></div>
              <div className="flex justify-between text-sm items-center"><span className="text-muted-foreground">VAT (PPn)</span><div className="flex items-center gap-2"><Input type="number" value={ppnPct} onChange={(e) => { setPpnPct(Number(e.target.value)); recalcTotals(lineItems); }} className="h-7 w-16 text-right" /><span className="tabular-nums font-medium w-[120px] text-right">{vat.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span></div></div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Purchase Amount</span><span className="tabular-nums">{purchaseAmount.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span></div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
          <div className="flex gap-4"><span>Last Update by: <span className="font-medium text-foreground">admin</span></span><span>Create by: <span className="font-medium text-foreground">admin</span></span></div>
          <span>Date modified: {new Date().toLocaleString("id-ID")}</span>
        </div>
      </form>
    </div>
  );
}
