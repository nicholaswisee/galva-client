import { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Save, Printer, FilePlus, Pencil, Trash } from "lucide-react";
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
import { useVendors, useDepartments, useWarehouses, useCurrencies, usePODetail } from "@/lib/use-master-data";
import { api } from "@/lib/api";
import type { POListItem, PODetailLine } from "@/types";
import { toast } from "sonner";

interface ConfirmLineItem {
  id_sub_po: number;
  kode_Brg: string;
  merk: string | null;
  model: string | null;
  satuan: string | null;
  poQty: number;
  confirmedQty: number;
  confirmQty: number;
  remainingQty: number;
  harga: number;
  total: number;
  kode_Gudang: string | null;
  note: string;
}

export function POConfirmPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: vendors } = useVendors();
  const { data: departments } = useDepartments();
  const { data: warehouses } = useWarehouses();
  const { data: currencies } = useCurrencies();

  const [doku, setDoku] = useState("");
  const [tgl, setTgl] = useState(new Date().toISOString().split("T")[0]);
  const [doku_PO, setDoku_PO] = useState("");
  const [kode_Supplier, setKode_Supplier] = useState("");
  const [kode_dept, setKode_dept] = useState("");
  const [kode_Valas, setKode_Valas] = useState("Rp.");
  const [kurs, setKurs] = useState(1.0);
  const [syarat, setSyarat] = useState(30);
  const [contactPr, setContactPr] = useState("");
  const [psd, setPsd] = useState("");
  const [etd, setEtd] = useState("");
  const [memo, setMemo] = useState("");
  const [lineItems, setLineItems] = useState<ConfirmLineItem[]>([]);

  const [grossAmount, setGrossAmount] = useState(0);
  const [dppNilaiLain, setDppNilaiLain] = useState(0);
  const [vat, setVat] = useState(0);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [ppnPct, setPpnPct] = useState(12);

  const { data: pos } = useQuery<POListItem[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/api/purchase-orders");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: poDetail } = usePODetail(doku_PO || null);

  useEffect(() => {
    if (poDetail) {
      setKode_Supplier(poDetail.kode_Supplier ?? "");
      setKode_dept(poDetail.kode_dept ?? "");
      setKode_Valas(poDetail.kode_Valas ?? "Rp.");
      setKurs(poDetail.kurs ?? 1);
      setSyarat(poDetail.syarat ?? 30);
      setMemo(poDetail.memo ?? "");
      setPpnPct(12);

      const mapped = poDetail.lines.map((line: PODetailLine) => ({
        id_sub_po: line.id_sub_po,
        kode_Brg: line.kode_Brg,
        merk: line.merk,
        model: line.model,
        satuan: line.satuan,
        poQty: line.jumlah,
        confirmedQty: line.jumlahKonfirm ?? 0,
        confirmQty: line.jumlah - (line.jumlahKonfirm ?? 0),
        remainingQty: line.jumlah - (line.jumlahKonfirm ?? 0),
        harga: line.harga,
        total: (line.jumlah - (line.jumlahKonfirm ?? 0)) * line.harga,
        kode_Gudang: line.kode_Gudang,
        note: line.note ?? "",
      }));
      setLineItems(mapped);
      recalcTotals(mapped);
    }
  }, [poDetail]);

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
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["po-confirmations"] });
      toast.success("PO confirmation created");
      navigate({ to: "/po" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateLineItem = (index: number, field: keyof ConfirmLineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "confirmQty" || field === "harga") {
      const item = updated[index];
      item.total = item.confirmQty * item.harga;
    }
    setLineItems(updated);
    recalcTotals(updated);
  };

  const recalcTotals = (items: ConfirmLineItem[]) => {
    const gross = items.reduce((s, i) => s + i.confirmQty * i.harga, 0);
    const dpp = gross;
    const vatAmt = dpp * (ppnPct / 100);
    const total = dpp + vatAmt;
    setGrossAmount(gross);
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

    const invalid = lineItems.filter((i) => i.confirmQty > i.remainingQty + 0.0001 || i.confirmQty <= 0);
    if (invalid.length > 0) {
      toast.error("Confirm quantity must be greater than 0 and not exceed remaining quantity.");
      return;
    }

    createConfirm.mutate({
      doku: doku || null,
      doku_PO,
      tgl: new Date(tgl).toISOString(),
      kode_Supplier,
      kode_dept,
      kode_Valas,
      kurs,
      syarat,
      contactPr,
      psd: psd || null,
      etd: etd || null,
      memo: memo || null,
      lineItems: lineItems
        .filter((item) => item.confirmQty > 0)
        .map((item) => ({
          id_sub_po: item.id_sub_po,
          kode_Brg: item.kode_Brg,
          jumlah: item.confirmQty,
          harga: item.harga,
          total: item.total,
          kode_Gudang: item.kode_Gudang,
          note: item.note || null,
        })),
    });
  };

  const vendorItems = vendors?.map((v) => ({ code: v.kode, label: `${v.kode} - ${v.nama}` })) ?? [];
  const deptItems = departments?.map((d) => ({ code: d.kode, label: `${d.kode} - ${d.nama}` })) ?? [];
  const warehouseItems = warehouses?.map((w) => ({ code: w.kode, label: `${w.kode} - ${w.nama}` })) ?? [];
  const currencyItems = currencies?.map((c) => ({ code: c.kode, label: `${c.kode} - ${c.nama}` })) ?? [];
  const poItems = (pos ?? [])
    .filter((po) => po.sts === "0")
    .map((po) => ({ code: po.doku ?? "", label: `${po.doku} - ${po.supplierName ?? ""}` }));

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
            <div className="space-y-1.5"><label className="text-xs font-medium">Confirm #</label><Input value={doku} onChange={(e) => setDoku(e.target.value)} placeholder="Auto-generated" readOnly /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Date</label><Input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} required /></div>
            <div className="space-y-1.5 lg:col-span-2"><label className="text-xs font-medium">PO No.</label><DataSelect items={poItems} value={doku_PO} onValueChange={setDoku_PO} placeholder="Select PO" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Vendor</label><DataSelect items={vendorItems} value={kode_Supplier} onValueChange={setKode_Supplier} placeholder="Select vendor" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">T.O.P (days)</label><Input type="number" value={syarat} onChange={(e) => setSyarat(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Department</label><DataSelect items={deptItems} value={kode_dept} onValueChange={setKode_dept} placeholder="Select dept" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Currency / Rate</label><div className="flex gap-2"><DataSelect items={currencyItems} value={kode_Valas} onValueChange={handleCurrencyChange} placeholder="Currency" /><Input type="number" step="0.01" value={kurs} readOnly className="w-24" /></div></div>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <div className="flex items-center justify-between border-b p-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Detail Items</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Stock Code</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="w-[60px]">PO Qty</TableHead>
                  <TableHead className="w-[60px]">Confirmed</TableHead>
                  <TableHead className="w-[60px]">Confirm</TableHead>
                  <TableHead className="w-[60px]">Unit</TableHead>
                  <TableHead className="w-[100px]">Price</TableHead>
                  <TableHead className="w-[100px]">Total</TableHead>
                  <TableHead className="w-[80px]">WH</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.length === 0 ? (
                  <TableRow><TableCell colSpan={12} className="h-24 text-center text-sm text-muted-foreground">Select a PO to load items.</TableCell></TableRow>
                ) : (
                  lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="text-xs">{item.kode_Brg}</TableCell>
                      <TableCell className="text-xs">{item.merk}</TableCell>
                      <TableCell className="text-xs">{item.model}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{item.poQty.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{item.confirmedQty.toLocaleString("id-ID")}</TableCell>
                      <TableCell><Input type="number" min="0" max={item.remainingQty} value={item.confirmQty} onChange={(e) => updateLineItem(index, "confirmQty", Number(e.target.value))} className="h-8" /></TableCell>
                      <TableCell className="text-xs">{item.satuan}</TableCell>
                      <TableCell><Input type="number" min="0" step="0.01" value={item.harga} onChange={(e) => updateLineItem(index, "harga", Number(e.target.value))} className="h-8" /></TableCell>
                      <TableCell className="text-right text-xs font-medium tabular-nums">{item.total.toLocaleString("id-ID")}</TableCell>
                      <TableCell><DataSelect items={warehouseItems} value={item.kode_Gudang ?? ""} onValueChange={(v) => updateLineItem(index, "kode_Gudang", v)} placeholder="WH" /></TableCell>
                      <TableCell><Input value={item.note} onChange={(e) => updateLineItem(index, "note", e.target.value)} className="h-8" /></TableCell>
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
