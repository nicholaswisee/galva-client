import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useDepartments, useInventory, useWarehouses } from "@/lib/use-master-data";
import { api } from "@/lib/api";

interface PRLineItem {
  kode_Brg: string;
  jumlah: number;
  harga: number;
  kode_Gudang: string;
  alias: string;
}

export function PRCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: departments } = useDepartments();
  const { data: inventory } = useInventory();
  const { data: warehouses } = useWarehouses();

  const [kode_Dept, setKode_Dept] = useState("");
  const [tgl, setTgl] = useState(new Date().toISOString().split("T")[0]);
  const [kode_Sales, setKode_Sales] = useState("");
  const [memo, setMemo] = useState("");
  const [lineItems, setLineItems] = useState<PRLineItem[]>([]);

  const createPR = useMutation({
    mutationFn: async (payload: unknown) => {
      const res = await api.post("/api/purchase-requisitions", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? err?.error ?? "Failed to create SPB");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      navigate({ to: "/purchase-requisitions" });
    },
  });

  const addLineItem = () => setLineItems([...lineItems, { kode_Brg: "", jumlah: 1, harga: 0, kode_Gudang: "", alias: "" }]);
  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index));

  const updateLineItem = (index: number, field: keyof PRLineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "kode_Brg") {
      const inv = inventory?.find((i) => i.kode === value);
      if (inv) updated[index].alias = inv.nama;
    }
    setLineItems(updated);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createPR.mutate({
      kode_Dept,
      tgl: new Date(tgl).toISOString(),
      kode_Sales: kode_Sales || null,
      memo: memo || null,
      lineItems: lineItems.map((item) => ({
        kode_Brg: item.kode_Brg,
        jumlah: item.jumlah,
        harga: item.harga,
        kode_Gudang: item.kode_Gudang || null,
        alias: item.alias || null,
      })),
    });
  };

  const deptItems = departments?.map((d) => ({ code: d.kode, label: `${d.kode} - ${d.nama}` })) ?? [];
  const inventoryItems = inventory?.map((i) => ({ code: i.kode, label: `${i.kode} - ${i.nama}` })) ?? [];
  const warehouseItems = warehouses?.map((w) => ({ code: w.kode, label: `${w.kode} - ${w.nama}` })) ?? [];
  const total = lineItems.reduce((sum, item) => sum + item.jumlah * item.harga, 0);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Purchase Requisition (SPB)</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create a Surat Permintaan Barang</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-md border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold">Header Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <DataSelect items={deptItems} value={kode_Dept} onValueChange={setKode_Dept} placeholder="Select department" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Salesman</label>
              <Input value={kode_Sales} onChange={(e) => setKode_Sales(e.target.value)} placeholder="Sales code" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Memo</label>
            <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} placeholder="Optional memo" />
          </div>
        </div>
        <div className="rounded-md border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-base font-semibold">Line Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="mr-1.5 size-3.5" />Add Item
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Alias</TableHead>
                <TableHead className="w-[80px]">Qty</TableHead>
                <TableHead className="w-[100px]">Price</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    No line items. Click "Add Item" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                lineItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <DataSelect items={inventoryItems} value={item.kode_Brg} onValueChange={(v) => updateLineItem(index, "kode_Brg", v)} placeholder="Select item" />
                    </TableCell>
                    <TableCell>
                      <Input value={item.alias} onChange={(e) => updateLineItem(index, "alias", e.target.value)} className="h-8" />
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
        {createPR.isError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{createPR.error.message}</div>
        )}
        <div className="flex gap-3">
          <Button type="submit" disabled={createPR.isPending || lineItems.length === 0 || !kode_Dept}>
            {createPR.isPending ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/purchase-requisitions" })}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
