import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataSelect } from "@/components/data-select";
import { useVendors, useInventory, useWarehouses } from "@/lib/use-master-data";
import { api } from "@/lib/api";
import type { POListItem } from "@/types";

interface GRLineItem {
  kode_Brg: string;
  jumlah: number;
  harga: number;
  kode_Gudang: string;
}

export function GRCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: inventory } = useInventory();
  const { data: warehouses } = useWarehouses();
  const { data: vendors } = useVendors();

  const [doku_PO, setDoku_PO] = useState("");
  const [tgl, setTgl] = useState(new Date().toISOString().split("T")[0]);
  const [kode_Supplier, setKode_Supplier] = useState("");
  const [suratJalan, setSuratJalan] = useState("");
  const [memo, setMemo] = useState("");
  const [lineItems, setLineItems] = useState<GRLineItem[]>([]);

  const { data: pos } = useQuery<POListItem[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/api/purchase-orders");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const confirmedPOItems = (pos ?? [])
    .filter((po) => po.sts === "1")
    .map((po) => ({ code: po.doku ?? "", label: `${po.doku} - ${po.supplierName ?? po.kode_Supplier ?? ""}` }));

  const createGR = useMutation({
    mutationFn: async (payload: unknown) => {
      const res = await api.post("/api/goods-receipts", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? err?.error ?? "Failed to create GR");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      navigate({ to: "/goods-receipts" });
    },
  });

  const addLineItem = () => setLineItems([...lineItems, { kode_Brg: "", jumlah: 1, harga: 0, kode_Gudang: "" }]);
  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index));

  const updateLineItem = (index: number, field: keyof GRLineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createGR.mutate({
      doku_PO,
      tgl: new Date(tgl).toISOString(),
      kode_Supplier: kode_Supplier || null,
      suratJalan: suratJalan || null,
      memo: memo || null,
      lineItems: lineItems.map((item) => ({
        kode_Brg: item.kode_Brg,
        jumlah: item.jumlah,
        harga: item.harga,
        kode_Gudang: item.kode_Gudang || null,
      })),
    });
  };

  const vendorItems = vendors?.map((v) => ({ code: v.kode, label: `${v.kode} - ${v.nama}` })) ?? [];
  const inventoryItems = inventory?.map((i) => ({ code: i.kode, label: `${i.kode} - ${i.nama}` })) ?? [];
  const warehouseItems = warehouses?.map((w) => ({ code: w.kode, label: `${w.kode} - ${w.nama}` })) ?? [];
  const total = lineItems.reduce((sum, item) => sum + item.jumlah * item.harga, 0);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Goods Receipt (LPB)</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acknowledge receipt of items from a confirmed PO</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-md border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold">Header Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Purchase Order</label>
              <DataSelect items={confirmedPOItems} value={doku_PO} onValueChange={(v) => {
                setDoku_PO(v);
                const po = pos?.find((p) => p.doku === v);
                if (po?.kode_Supplier) setKode_Supplier(po.kode_Supplier);
              }} placeholder="Select confirmed PO" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Supplier</label>
              <DataSelect items={vendorItems} value={kode_Supplier} onValueChange={setKode_Supplier} placeholder="Select supplier" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Surat Jalan</label>
              <Input value={suratJalan} onChange={(e) => setSuratJalan(e.target.value)} placeholder="Delivery note ref" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Memo</label>
            <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} placeholder="Optional memo" />
          </div>
        </div>
        <div className="rounded-md border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-base font-semibold">Received Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem} disabled={!doku_PO}>
              <Plus className="mr-1.5 size-3.5" />Add Item
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-[80px]">Qty</TableHead>
                <TableHead className="w-[100px]">Price</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    {doku_PO ? 'Click "Add Item" to add received items.' : "Select a PO first."}
                  </TableCell>
                </TableRow>
              ) : (
                lineItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <DataSelect items={inventoryItems} value={item.kode_Brg} onValueChange={(v) => updateLineItem(index, "kode_Brg", v)} placeholder="Select item" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" min="1" value={item.jumlah} onChange={(e) => updateLineItem(index, "jumlah", Number(e.target.value))} className="h-8" required />
                    </TableCell>
                    <TableCell>
                      <Input type="number" min="0" step="0.01" value={item.harga} onChange={(e) => updateLineItem(index, "harga", Number(e.target.value))} className="h-8" required />
                    </TableCell>
                    <TableCell>
                      <DataSelect items={warehouseItems} value={item.kode_Gudang} onValueChange={(v) => updateLineItem(index, "kode_Gudang", v)} placeholder="Select WH" />
                    </TableCell>
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
          {lineItems.length > 0 && (
            <div className="flex justify-end border-t p-4">
              <div className="text-sm font-medium">Total: <span className="tabular-nums">{total.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}</span></div>
            </div>
          )}
        </div>
        {createGR.isError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{createGR.error.message}</div>
        )}
        <div className="flex gap-3">
          <Button type="submit" disabled={createGR.isPending || lineItems.length === 0 || !doku_PO}>
            {createGR.isPending ? "Saving..." : "Save Goods Receipt"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/goods-receipts" })}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
