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
import { useVendors, useDepartments, useBanks } from "@/lib/use-master-data";
import { api } from "@/lib/api";
import type { GRListItem } from "@/types";

interface GRLink {
  doku_LPB: string;
  nilaiLPB: number;
}

export function InvoiceCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: vendors } = useVendors();
  const { data: departments } = useDepartments();
  const { data: banks } = useBanks();

  const [kode_Supplier, setKode_Supplier] = useState("");
  const [tgl, setTgl] = useState(new Date().toISOString().split("T")[0]);
  const [kode_Dept, setKode_Dept] = useState("");
  const [kode_Bank, setKode_Bank] = useState("");
  const [nilai, setNilai] = useState(0);
  const [ppn, setPpn] = useState(0);
  const [diskon, setDiskon] = useState(0);
  const [misc, setMisc] = useState(0);
  const [keterangan, setKeterangan] = useState("");
  const [grLinks, setGrLinks] = useState<GRLink[]>([]);

  const { data: grs } = useQuery<GRListItem[]>({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const res = await api.get("/api/goods-receipts");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const availableGRs = (grs ?? []).map((gr) => ({
    code: gr.doku ?? "",
    label: `${gr.doku} - ${gr.supplierName ?? ""} - ${(gr.nilai ?? 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}`,
  }));

  const createInvoice = useMutation({
    mutationFn: async (payload: unknown) => {
      const res = await api.post("/api/invoices", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? err?.error ?? "Failed to create voucher");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      navigate({ to: "/invoices" });
    },
  });

  const addGRLink = () => setGrLinks([...grLinks, { doku_LPB: "", nilaiLPB: 0 }]);
  const removeGRLink = (index: number) => setGrLinks(grLinks.filter((_, i) => i !== index));

  const updateGRLink = (index: number, doku_LPB: string) => {
    const updated = [...grLinks];
    const gr = grs?.find((g) => g.doku === doku_LPB);
    updated[index] = { doku_LPB, nilaiLPB: gr?.nilai ?? 0 };
    setGrLinks(updated);
  };

  const aggregatedGRTotal = grLinks.reduce((sum, link) => sum + link.nilaiLPB, 0);
  const mismatch = Math.abs(nilai - aggregatedGRTotal) > 0.01;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createInvoice.mutate({
      kode_Supplier,
      tgl: new Date(tgl).toISOString(),
      kode_Dept: kode_Dept || null,
      kode_Bank: kode_Bank || null,
      nilai,
      ppn,
      diskon,
      misc,
      keterangan: keterangan || null,
      gRLinks: grLinks.map((link) => ({
        doku_LPB: link.doku_LPB,
        nilaiLPB: link.nilaiLPB,
      })),
    });
  };

  const vendorItems = vendors?.map((v) => ({ code: v.kode, label: `${v.kode} - ${v.nama}` })) ?? [];
  const deptItems = departments?.map((d) => ({ code: d.kode, label: `${d.kode} - ${d.nama}` })) ?? [];
  const bankItems = banks?.map((b) => ({ code: b.kode, label: `${b.kode} - ${b.nama}` })) ?? [];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New AP Voucher</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create an AP voucher linked to goods receipts (3-way match)</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-md border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold">Voucher Header</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Supplier</label>
              <DataSelect items={vendorItems} value={kode_Supplier} onValueChange={setKode_Supplier} placeholder="Select supplier" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <DataSelect items={deptItems} value={kode_Dept} onValueChange={setKode_Dept} placeholder="Select dept" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bank</label>
              <DataSelect items={bankItems} value={kode_Bank} onValueChange={setKode_Bank} placeholder="Select bank" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Keterangan</label>
            <Textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={2} placeholder="Description" />
          </div>
        </div>
        <div className="rounded-md border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-base font-semibold">Linked Goods Receipts</h2>
            <Button type="button" variant="outline" size="sm" onClick={addGRLink}>
              <Plus className="mr-1.5 size-3.5" />Add GR Link
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GR Doku</TableHead>
                <TableHead className="w-[180px] text-right">GR Nilai</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grLinks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                    No GR links. Click "Add GR Link" to link goods receipts.
                  </TableCell>
                </TableRow>
              ) : (
                grLinks.map((link, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <DataSelect items={availableGRs} value={link.doku_LPB} onValueChange={(v) => updateGRLink(index, v)} placeholder="Select GR" />
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {link.nilaiLPB.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => removeGRLink(index)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {grLinks.length > 0 && (
            <div className="flex justify-end border-t p-4">
              <div className="text-sm font-medium">Aggregated GR Total: <span className="tabular-nums">{aggregatedGRTotal.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}</span></div>
            </div>
          )}
        </div>
        <div className="rounded-md border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold">Voucher Amounts</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nilai (Amount)</label>
              <Input type="number" min="0" step="0.01" value={nilai} onChange={(e) => setNilai(Number(e.target.value))} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PPn</label>
              <Input type="number" min="0" step="0.01" value={ppn} onChange={(e) => setPpn(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Diskon</label>
              <Input type="number" min="0" step="0.01" value={diskon} onChange={(e) => setDiskon(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Misc</label>
              <Input type="number" min="0" step="0.01" value={misc} onChange={(e) => setMisc(Number(e.target.value))} />
            </div>
          </div>
          {mismatch && grLinks.length > 0 && (
            <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
              3-way match warning: Voucher amount ({nilai.toLocaleString("id-ID")}) does not match aggregated GR total ({aggregatedGRTotal.toLocaleString("id-ID")}).
            </div>
          )}
        </div>
        {createInvoice.isError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{createInvoice.error.message}</div>
        )}
        <div className="flex gap-3">
          <Button type="submit" disabled={createInvoice.isPending || grLinks.length === 0 || !kode_Supplier}>
            {createInvoice.isPending ? "Saving..." : "Save Voucher"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/invoices" })}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
