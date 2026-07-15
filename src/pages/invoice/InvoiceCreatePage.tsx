import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Save, FilePlus, Pencil, Trash, Printer } from "lucide-react";
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
import { useVendors, useDepartments } from "@/lib/use-master-data";
import { api } from "@/lib/api";
import type { GRListItem } from "@/types";
import { toast } from "sonner";

interface GRLink {
  doku_LPB: string;
  nilaiLPB: number;
}

export function InvoiceCreatePage() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const queryClient = useQueryClient();
  const { data: vendors } = useVendors();
  const { data: departments } = useDepartments();

  const [doku, setDoku] = useState("");
  const [tgl, setTgl] = useState(new Date().toISOString().split("T")[0]);
  const [kode_Supplier, setKode_Supplier] = useState("");
  const [kode_Dept, setKode_Dept] = useState("");
  const [kode_Valas, setKode_Valas] = useState("Rp.");
  const [kurs, setKurs] = useState(1.0);
  const [nilai, setNilai] = useState(0);
  const [ppn, setPpn] = useState(0);
  const [diskon] = useState(0);
  const [misc] = useState(0);
  const [keterangan, setKeterangan] = useState("");
  const [grLinks, setGrLinks] = useState<GRLink[]>([]);
  const [fakturPajak, setFakturPajak] = useState("");
  const [tglFp, setTglFp] = useState("");

  const { data: grs } = useQuery<GRListItem[]>({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const res = await api.get("/api/goods-receipts");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const doku_LPB = params.get("doku_LPB");
    if (!doku_LPB || grs === undefined) return;
    if (grLinks.some((l) => l.doku_LPB === doku_LPB)) return;
    const gr = grs.find((g) => g.doku === doku_LPB);
    if (!gr) return;
    const updated = [...grLinks, { doku_LPB, nilaiLPB: gr.nilai ?? 0 }];
    setGrLinks(updated);
    setNilai(updated.reduce((sum, link) => sum + link.nilaiLPB, 0));
  }, [location.search, grs]);

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
      toast.success("AP invoice created successfully");
      navigate({ to: "/invoices", search: { tab: "lpb" } });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addGRLink = () => setGrLinks([...grLinks, { doku_LPB: "", nilaiLPB: 0 }]);
  const removeGRLink = (index: number) => setGrLinks(grLinks.filter((_, i) => i !== index));

  const updateGRLink = (index: number, doku_LPB: string) => {
    const updated = [...grLinks];
    const gr = grs?.find((g) => g.doku === doku_LPB);
    updated[index] = { doku_LPB, nilaiLPB: gr?.nilai ?? 0 };
    setGrLinks(updated);
    setNilai(updated.reduce((sum, link) => sum + link.nilaiLPB, 0));
  };

  const aggregatedGRTotal = grLinks.reduce((sum, link) => sum + link.nilaiLPB, 0);
  const mismatch = Math.abs(nilai - aggregatedGRTotal) > 0.01;
  const totalAmountRp = (nilai + ppn - diskon + misc) * kurs;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createInvoice.mutate({
      doku: doku || null,
      kode_Supplier,
      tgl: new Date(tgl).toISOString(),
      kode_Dept: kode_Dept || null,
      kode_Valas,
      kurs,
      nilai,
      ppn,
      diskon,
      misc,
      doku_FP: fakturPajak || null,
      tgl_FP: tglFp ? new Date(tglFp).toISOString() : null,
      keterangan: keterangan || null,
      gRLinks: grLinks.map((link) => ({
        doku_LPB: link.doku_LPB,
        nilaiLPB: link.nilaiLPB,
      })),
    });
  };

  const vendorItems = vendors?.map((v) => ({ code: v.kode, label: `${v.kode} - ${v.nama}` })) ?? [];
  const deptItems = departments?.map((d) => ({ code: d.kode, label: `${d.kode} - ${d.nama}` })) ?? [];

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AP Invoice</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create AP invoice / voucher linked to goods receipts</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2">
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate({ to: "/invoices/new" })}>
            <FilePlus className="size-4" />New
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" disabled>
            <Pencil className="size-4" />Edit
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" disabled>
            <Trash className="size-4" />Delete
          </Button>
          <Button type="submit" variant="ghost" size="sm" className="gap-1.5" disabled={createInvoice.isPending}>
            <Save className="size-4" />Save
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="size-4" />Print
          </Button>
          <div className="ml-auto">
            <Badge variant="outline">Draft</Badge>
          </div>
        </div>

        {/* Header */}
        <div className="rounded-md border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Header</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Invoice No.</label>
              <Input value={doku} onChange={(e) => setDoku(e.target.value)} placeholder="e.g. 2203JKT999/E/0259" />
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
              <label className="text-xs font-medium">Due Date</label>
              <Input type="date" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Currency / Rate</label>
              <div className="flex items-center gap-2">
                <Input value={kode_Valas} onChange={(e) => setKode_Valas(e.target.value)} className="w-20" />
                <Input type="number" step="0.01" value={kurs} onChange={(e) => setKurs(Number(e.target.value))} className="w-24" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Department</label>
              <DataSelect items={deptItems} value={kode_Dept} onValueChange={setKode_Dept} placeholder="Select dept" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cyan-600">FP# (Faktur Pajak)</label>
              <Input value={fakturPajak} onChange={(e) => setFakturPajak(e.target.value)} placeholder="010.004.22.39895151" className="border-cyan-300" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cyan-600">Tgl. FP</label>
              <Input type="date" value={tglFp} onChange={(e) => setTglFp(e.target.value)} className="border-cyan-300" />
            </div>
          </div>
        </div>

        {/* GR Links */}
        <div className="rounded-md border bg-card">
          <div className="flex items-center justify-between border-b p-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Linked Goods Receipts</h2>
            <Button type="button" variant="outline" size="sm" onClick={addGRLink}>
              <Plus className="mr-1.5 size-3.5" />Add GR Link
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GR No.</TableHead>
                <TableHead className="w-[180px] text-right">GR Total</TableHead>
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
            <div className="flex justify-end border-t p-3">
              <div className="text-sm font-medium">Aggregated GR Total: <span className="tabular-nums">{aggregatedGRTotal.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}</span></div>
            </div>
          )}
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-md border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Keterangan</h2>
            <Textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={4} placeholder="Description / notes..." />
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Logdatabase</label>
              <Button type="button" variant="outline" size="sm" className="w-full">Open Linked Document</Button>
            </div>
          </div>
          <div className="rounded-md border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Amounts</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="tabular-nums font-medium">{nilai.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Disc Amount</span>
                <span className="tabular-nums font-medium">{diskon.toLocaleString("id-ID", { style: "currency", currency: "IDR" })} ({((nilai > 0 ? diskon / nilai * 100 : 0)).toFixed(0)}%)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net. Amount</span>
                <span className="tabular-nums font-medium">{(nilai - diskon).toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">DPP Nilai Lain</span>
                <span className="tabular-nums font-medium">{(nilai - diskon).toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">VAT (PPn)</span>
                <div className="flex items-center gap-2">
                  <Input type="number" value={ppn} onChange={(e) => setPpn(Number(e.target.value))} className="h-7 w-24 text-right" />
                  <span className="tabular-nums font-medium w-[100px] text-right">{ppn.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span>
                </div>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Invoice Amount</span>
                <span className="tabular-nums">{totalAmountRp.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span>
              </div>
              {mismatch && grLinks.length > 0 && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
                  3-way match warning: Voucher amount does not match aggregated GR total.
                </div>
              )}
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
