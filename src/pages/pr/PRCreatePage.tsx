import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useDepartments, useInventory, useWarehouses } from "@/lib/use-master-data";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface PRLineItem {
  kode_Brg: string;
  jumlah: number;
  unit: string;
  available: number;
  onOrder: number;
  memo: string;
  description: string;
}

export function PRCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: departments } = useDepartments();
  const { data: inventory } = useInventory();
  const { data: warehouses } = useWarehouses();

  const [doku, setDoku] = useState("");
  const [kode_Dept, setKode_Dept] = useState("");
  const [tgl, setTgl] = useState(new Date().toISOString().split("T")[0]);
  const [kode_Sales, setKode_Sales] = useState("");
  const [memo, setMemo] = useState("");
  const [description, setDescription] = useState("");
  const [notIncrement, setNotIncrement] = useState(false);
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
      toast.success("Purchase requisition created successfully");
      navigate({ to: "/pr" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addLineItem = () => setLineItems([...lineItems, { kode_Brg: "", jumlah: 1, unit: "PC", available: 0, onOrder: 0, memo: "", description: "" }]);
  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index));

  const updateLineItem = (index: number, field: keyof PRLineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "kode_Brg") {
      const inv = inventory?.find((i) => i.kode === value);
      if (inv) updated[index].description = inv.nama;
    }
    setLineItems(updated);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createPR.mutate({
      doku: doku || null,
      kode_Dept,
      tgl: new Date(tgl).toISOString(),
      kode_Sales: kode_Sales || null,
      memo: memo || null,
      description: description || null,
      lineItems: lineItems.map((item) => ({
        kode_Brg: item.kode_Brg,
        jumlah: item.jumlah,
        kode_Gudang: warehouses?.[0]?.kode ?? null,
        alias: item.description || null,
      })),
    });
  };

  const deptItems = departments?.map((d) => ({ code: d.kode, label: `${d.kode} - ${d.nama}` })) ?? [];
  const inventoryItems = inventory?.map((i) => ({ code: i.kode, label: `${i.kode} - ${i.nama}` })) ?? [];
  const total = lineItems.reduce((sum, item) => sum + item.jumlah * 0, 0);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Purchase Requisition (SPB)</h1>
        <p className="mt-1 text-sm text-muted-foreground">Surat Permintaan Barang</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2">
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><FilePlus className="size-4" />New</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Pencil className="size-4" />Edit</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Trash className="size-4" />Delete</Button>
          <Button type="submit" variant="ghost" size="sm" className="gap-1.5" disabled={createPR.isPending}><Save className="size-4" />Save</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Printer className="size-4" />Preview</Button>
          <div className="ml-auto">
            <Badge variant="outline" className="text-destructive">Approval Required</Badge>
          </div>
        </div>

        {/* Header */}
        <div className="rounded-md border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Header</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">PR Number</label>
              <div className="flex items-center gap-2">
                <Input value={doku} onChange={(e) => setDoku(e.target.value)} placeholder="Auto-generated" />
                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <input type="checkbox" checked={notIncrement} onChange={(e) => setNotIncrement(e.target.checked)} />
                  Not Increment
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Date</label>
              <Input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Department</label>
              <DataSelect items={deptItems} value={kode_Dept} onValueChange={setKode_Dept} placeholder="Select department" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Salesman</label>
              <Input value={kode_Sales} onChange={(e) => setKode_Sales(e.target.value)} placeholder="Sales code" />
            </div>
          </div>
        </div>

        {/* Line Items */}
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
                  <TableHead className="w-[60px]">Qty</TableHead>
                  <TableHead className="w-[60px]">Unit</TableHead>
                  <TableHead className="w-[80px]">Available</TableHead>
                  <TableHead className="w-[80px]">OnOrder</TableHead>
                  <TableHead>Memo</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-sm text-muted-foreground">
                      No line items. Click "Add Item" to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <DataSelect items={inventoryItems} value={item.kode_Brg} onValueChange={(v) => updateLineItem(index, "kode_Brg", v)} placeholder="Select item" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="1" value={item.jumlah} onChange={(e) => updateLineItem(index, "jumlah", Number(e.target.value))} className="h-8" required />
                      </TableCell>
                      <TableCell>
                        <Input value={item.unit} onChange={(e) => updateLineItem(index, "unit", e.target.value)} className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={item.available} onChange={(e) => updateLineItem(index, "available", Number(e.target.value))} className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={item.onOrder} onChange={(e) => updateLineItem(index, "onOrder", Number(e.target.value))} className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input value={item.memo} onChange={(e) => updateLineItem(index, "memo", e.target.value)} className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input value={item.description} onChange={(e) => updateLineItem(index, "description", e.target.value)} className="h-8" />
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
          </div>
        </div>

        {/* Description & Log */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Full description..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Memo / Notes</label>
            <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} placeholder="Internal notes..." />
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
