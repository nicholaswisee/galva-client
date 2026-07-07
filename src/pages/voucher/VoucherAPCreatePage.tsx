import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, FilePlus, Pencil, Trash, Eye } from "lucide-react";
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
import { toast } from "sonner";

interface JournalLine {
  accountGL: string;
  reference: string;
  docVendor: string;
  keterangan: string;
  total: number;
}

export function VoucherAPCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: vendors } = useVendors();
  const { data: departments } = useDepartments();

  const [doku, setDoku] = useState("");
  const [tgl, setTgl] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [kode_dept, setKode_dept] = useState("");
  const [kode_Valas, setKode_Valas] = useState("Rp.");
  const [kurs, setKurs] = useState(1.0);
  const [kode_Supplier, setKode_Supplier] = useState("");
  const [fakturPajak, setFakturPajak] = useState("");
  const [memo, setMemo] = useState("");
  const [journalLines, setJournalLines] = useState<JournalLine[]>([]);

  const createVoucher = useMutation({
    mutationFn: async (payload: unknown) => {
      const res = await api.post("/api/vouchers", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? err?.error ?? "Failed to create voucher");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast.success("AP Voucher created successfully");
      navigate({ to: "/ap" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addJournalLine = () => setJournalLines([...journalLines, { accountGL: "", reference: "", docVendor: "", keterangan: "", total: 0 }]);
  const removeJournalLine = (index: number) => setJournalLines(journalLines.filter((_, i) => i !== index));

  const updateJournalLine = (index: number, field: keyof JournalLine, value: string | number) => {
    const updated = [...journalLines];
    updated[index] = { ...updated[index], [field]: value };
    setJournalLines(updated);
  };

  const totalAmount = journalLines.reduce((s, l) => s + l.total, 0);
  const totalAmountRp = totalAmount * kurs;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createVoucher.mutate({
      doku: doku || null,
      tgl: new Date(tgl).toISOString(),
      dueDate: dueDate || null,
      kode_dept,
      kode_Valas,
      kurs,
      kode_Supplier,
      memo: memo || null,
      journalLines: journalLines.map((l) => ({ ...l })),
    });
  };

  const vendorItems = vendors?.map((v) => ({ code: v.kode, label: `${v.kode} - ${v.nama}` })) ?? [];
  const deptItems = departments?.map((d) => ({ code: d.kode, label: `${d.kode} - ${d.nama}` })) ?? [];

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AP Voucher</h1>
        <p className="mt-1 text-sm text-muted-foreground">Payment voucher with journal-entry lines</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2">
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><FilePlus className="size-4" />New</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Pencil className="size-4" />Edit</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Trash className="size-4" />Delete</Button>
          <Button type="submit" variant="ghost" size="sm" className="gap-1.5" disabled={createVoucher.isPending}><Save className="size-4" />Save</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Eye className="size-4" />Preview</Button>
          <div className="ml-auto"><Badge variant="outline">Draft</Badge></div>
        </div>

        <div className="rounded-md border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Header</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><label className="text-xs font-medium">Voucher No.</label><Input value={doku} onChange={(e) => setDoku(e.target.value)} placeholder="Auto-generated" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Date</label><Input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} required /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Due Date</label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Department</label><DataSelect items={deptItems} value={kode_dept} onValueChange={setKode_dept} placeholder="Select dept" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Currency / Rate</label><div className="flex gap-2"><Input value={kode_Valas} onChange={(e) => setKode_Valas(e.target.value)} className="w-20" /><Input type="number" step="0.01" value={kurs} onChange={(e) => setKurs(Number(e.target.value))} className="w-24" /></div></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Vendor</label><DataSelect items={vendorItems} value={kode_Supplier} onValueChange={setKode_Supplier} placeholder="Select vendor" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-cyan-600">FP#</label><Input value={fakturPajak} onChange={(e) => setFakturPajak(e.target.value)} className="border-cyan-300" /></div>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <div className="flex items-center justify-between border-b p-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Journal Entry</h2>
            <Button type="button" variant="outline" size="sm" onClick={addJournalLine}><Plus className="mr-1.5 size-3.5" />Add Line</Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Account GL</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Doc. Vendor</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalLines.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">No journal lines. Click "Add Line" to add one.</TableCell></TableRow>
                ) : (
                  journalLines.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell><Input value={line.accountGL} onChange={(e) => updateJournalLine(index, "accountGL", e.target.value)} className="h-8" placeholder="Account" /></TableCell>
                      <TableCell><Input value={line.reference} onChange={(e) => updateJournalLine(index, "reference", e.target.value)} className="h-8" placeholder="Ref" /></TableCell>
                      <TableCell><Input value={line.docVendor} onChange={(e) => updateJournalLine(index, "docVendor", e.target.value)} className="h-8" placeholder="Doc" /></TableCell>
                      <TableCell><Input value={line.keterangan} onChange={(e) => updateJournalLine(index, "keterangan", e.target.value)} className="h-8" placeholder="Description" /></TableCell>
                      <TableCell><Input type="number" step="0.01" value={line.total} onChange={(e) => updateJournalLine(index, "total", Number(e.target.value))} className="h-8 text-right" /></TableCell>
                      <TableCell><Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => removeJournalLine(index)}><Trash2 className="size-3.5" /></Button></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-md border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notes</h2>
            <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} placeholder="Memo / notes..." />
            <Button type="button" variant="outline" size="sm" className="w-full">Logdatabase</Button>
          </div>
          <div className="rounded-md border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Totals</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Amount</span><span className="tabular-nums font-medium">{totalAmount.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span></div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Total Amount (Rp.)</span><span className="tabular-nums">{totalAmountRp.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span></div>
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
