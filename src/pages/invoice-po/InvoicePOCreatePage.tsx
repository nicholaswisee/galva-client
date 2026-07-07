import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Save, FilePlus, Pencil, Trash, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useVendors } from "@/lib/use-master-data";
import { api } from "@/lib/api";
import type { GRListItem, POListItem } from "@/types";
import { toast } from "sonner";

interface POLink {
  doku_PO: string;
  tgl: string;
  amount: number;
  tax: number;
  basedOn: string;
}

interface InvoiceLine {
  apRef: string;
  invoiceNo: string;
  tgl: string;
  term: number;
  amount: number;
  kurs: string;
  rate: number;
  amountRp: number;
  fakturPajak: string;
  tglFp: string;
  ppnPct: number;
  ppnRp: number;
  totalRp: number;
}

export function InvoicePOCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: vendors } = useVendors();

  const [doku, setDoku] = useState("");
  const [tgl, setTgl] = useState(new Date().toISOString().split("T")[0]);
  const [nopen, setNopen] = useState("");
  const [tglNopen, setTglNopen] = useState("");
  const [awbBl, setAwbBl] = useState("");
  const [kode_Supplier, setKode_Supplier] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [term, setTerm] = useState(30);
  const [amount, setAmount] = useState(0);
  const [kurs, setKurs] = useState("Rp.");
  const [rate, setRate] = useState(1.0);
  const [amountRp, setAmountRp] = useState(0);
  const [fakturPajak, setFakturPajak] = useState("");
  const [tglFp, setTglFp] = useState("");
  const [ppnPct, setPpnPct] = useState(10);
  const [ppnRp, setPpnRp] = useState(0);
  const [totalRp, setTotalRp] = useState(0);

  const [poLinks, setPoLinks] = useState<POLink[]>([]);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([]);
  const [lc1, setLc1] = useState("");
  const [lc2, setLc2] = useState("");
  const [lc3, setLc3] = useState("");
  const [insurance, setInsurance] = useState(0);
  const [interest, setInterest] = useState(0);
  const [expCom1, setExpCom1] = useState(0);
  const [expCom2, setExpCom2] = useState(0);
  const [impHand, setImpHand] = useState(0);
  const [other, setOther] = useState(0);

  const { data: pos } = useQuery<POListItem[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/api/purchase-orders");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: grs } = useQuery<GRListItem[]>({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const res = await api.get("/api/goods-receipts");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createInvoice = useMutation({
    mutationFn: async (payload: unknown) => {
      const res = await api.post("/api/invoices/po-based", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? err?.error ?? "Failed to create invoice");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice AP (PO-based) created");
      navigate({ to: "/ap" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addPOLink = () => setPoLinks([...poLinks, { doku_PO: "", tgl: "", amount: 0, tax: 0, basedOn: "" }]);
  const removePOLink = (index: number) => setPoLinks(poLinks.filter((_, i) => i !== index));

  const addInvoiceLine = () => setInvoiceLines([...invoiceLines, { apRef: "", invoiceNo: "", tgl: "", term: 0, amount: 0, kurs: "Rp.", rate: 1, amountRp: 0, fakturPajak: "", tglFp: "", ppnPct: 10, ppnRp: 0, totalRp: 0 }]);
  const removeInvoiceLine = (index: number) => setInvoiceLines(invoiceLines.filter((_, i) => i !== index));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createInvoice.mutate({ doku: doku || null, tgl: new Date(tgl).toISOString(), kode_Supplier, nopen, awbBl, amount, ppn: ppnRp, totalRp, poLinks, invoiceLines });
  };

  const vendorItems = vendors?.map((v) => ({ code: v.kode, label: `${v.kode} - ${v.nama}` })) ?? [];
  const poItems = (pos ?? []).map((po) => ({ code: po.doku ?? "", label: `${po.doku} - ${po.supplierName ?? ""}` }));
  const grItems = (grs ?? []).map((gr) => ({ code: gr.doku ?? "", label: `${gr.doku} - ${gr.supplierName ?? ""}` }));

  const extraCharges = insurance + interest + expCom1 + expCom2 + impHand + other;
  const finalTotal = totalRp + extraCharges;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoice AP (Based on PO)</h1>
        <p className="mt-1 text-sm text-muted-foreground">AP invoice tied to PO/GR with LC and import charges</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2">
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><FilePlus className="size-4" />New</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Pencil className="size-4" />Edit</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Trash className="size-4" />Delete</Button>
          <Button type="submit" variant="ghost" size="sm" className="gap-1.5" disabled={createInvoice.isPending}><Save className="size-4" />Save</Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5"><Eye className="size-4" />Preview</Button>
          <div className="ml-auto"><Badge variant="outline">Draft</Badge></div>
        </div>

        <div className="rounded-md border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Header</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><label className="text-xs font-medium">Invoice AP #</label><Input value={doku} onChange={(e) => setDoku(e.target.value)} placeholder="Auto-generated" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Date</label><Input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} required /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">NOPEN</label><Input value={nopen} onChange={(e) => setNopen(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Nopen Date</label><Input type="date" value={tglNopen} onChange={(e) => setTglNopen(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">AWB/BL</label><Input value={awbBl} onChange={(e) => setAwbBl(e.target.value)} /></div>
          </div>
        </div>

        <div className="rounded-md border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Vendor & Amount</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><label className="text-xs font-medium">Vendor</label><DataSelect items={vendorItems} value={kode_Supplier} onValueChange={(v) => { setKode_Supplier(v); const ven = vendors?.find((x) => x.kode === v); if (ven) setVendorName(ven.nama); }} placeholder="Select vendor" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Vendor Name</label><Input value={vendorName} readOnly className="bg-muted/30" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Term</label><Input type="number" value={term} onChange={(e) => setTerm(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Amount</label><Input type="number" step="0.01" value={amount} onChange={(e) => { const a = Number(e.target.value); setAmount(a); setAmountRp(a * rate); setPpnRp(a * rate * (ppnPct / 100)); setTotalRp(a * rate * (1 + ppnPct / 100)); }} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Kurs</label><Input value={kurs} onChange={(e) => setKurs(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Rate</label><Input type="number" step="0.01" value={rate} onChange={(e) => { const r = Number(e.target.value); setRate(r); setAmountRp(amount * r); setPpnRp(amount * r * (ppnPct / 100)); setTotalRp(amount * r * (1 + ppnPct / 100)); }} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Amount in Rp.</label><Input type="number" step="0.01" value={amountRp} readOnly className="bg-muted/30" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-cyan-600">Faktur Pajak</label><Input value={fakturPajak} onChange={(e) => setFakturPajak(e.target.value)} className="border-cyan-300" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-cyan-600">Tgl. FP</label><Input type="date" value={tglFp} onChange={(e) => setTglFp(e.target.value)} className="border-cyan-300" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">PPn %</label><Input type="number" value={ppnPct} onChange={(e) => { const p = Number(e.target.value); setPpnPct(p); setPpnRp(amountRp * (p / 100)); setTotalRp(amountRp * (1 + p / 100)); }} /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">PPn Rp.</label><Input type="number" step="0.01" value={ppnRp} readOnly className="bg-muted/30" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium">Tot. Amount Rp.</label><Input type="number" step="0.01" value={totalRp} readOnly className="bg-muted/30 font-semibold" /></div>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <div className="flex items-center justify-between border-b p-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Linked PO</h2>
            <Button type="button" variant="outline" size="sm" onClick={addPOLink}><Plus className="mr-1.5 size-3.5" />Add PO</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Confirmation #</TableHead>
                <TableHead>Trans. Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead>Based On</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {poLinks.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">No linked POs.</TableCell></TableRow>
              ) : (
                poLinks.map((link, index) => (
                  <TableRow key={index}>
                    <TableCell><DataSelect items={poItems} value={link.doku_PO} onValueChange={(v) => { const updated = [...poLinks]; const po = pos?.find((p) => p.doku === v); updated[index] = { ...updated[index], doku_PO: v, tgl: po?.tgl?.split("T")[0] ?? "", amount: po?.nilai ?? 0 }; setPoLinks(updated); }} placeholder="Select PO" /></TableCell>
                    <TableCell className="text-sm">{link.tgl}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{link.amount.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{link.tax.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</TableCell>
                    <TableCell><DataSelect items={grItems} value={link.basedOn} onValueChange={(v) => { const updated = [...poLinks]; updated[index] = { ...updated[index], basedOn: v }; setPoLinks(updated); }} placeholder="GR/DO" /></TableCell>
                    <TableCell><Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => removePOLink(index)}><Trash2 className="size-3.5" /></Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-md border bg-card">
          <div className="flex items-center justify-between border-b p-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Detail Invoice</h2>
            <Button type="button" variant="outline" size="sm" onClick={addInvoiceLine}><Plus className="mr-1.5 size-3.5" />Add Line</Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>AP.Ref</TableHead>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Kurs</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="text-right">Amount Rp.</TableHead>
                  <TableHead>FP#</TableHead>
                  <TableHead>Tgl. FP</TableHead>
                  <TableHead>PPn %</TableHead>
                  <TableHead className="text-right">PPn Rp.</TableHead>
                  <TableHead className="text-right">Tot. Rp.</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceLines.length === 0 ? (
                  <TableRow><TableCell colSpan={14} className="h-24 text-center text-sm text-muted-foreground">No invoice lines.</TableCell></TableRow>
                ) : (
                  invoiceLines.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell><Input value={line.apRef} onChange={(e) => { const u = [...invoiceLines]; u[index].apRef = e.target.value; setInvoiceLines(u); }} className="h-8" /></TableCell>
                      <TableCell><Input value={line.invoiceNo} onChange={(e) => { const u = [...invoiceLines]; u[index].invoiceNo = e.target.value; setInvoiceLines(u); }} className="h-8" /></TableCell>
                      <TableCell><Input type="date" value={line.tgl} onChange={(e) => { const u = [...invoiceLines]; u[index].tgl = e.target.value; setInvoiceLines(u); }} className="h-8" /></TableCell>
                      <TableCell><Input type="number" value={line.term} onChange={(e) => { const u = [...invoiceLines]; u[index].term = Number(e.target.value); setInvoiceLines(u); }} className="h-8" /></TableCell>
                      <TableCell><Input type="number" step="0.01" value={line.amount} onChange={(e) => { const u = [...invoiceLines]; u[index].amount = Number(e.target.value); u[index].amountRp = u[index].amount * u[index].rate; u[index].ppnRp = u[index].amountRp * (u[index].ppnPct / 100); u[index].totalRp = u[index].amountRp + u[index].ppnRp; setInvoiceLines(u); }} className="h-8" /></TableCell>
                      <TableCell><Input value={line.kurs} onChange={(e) => { const u = [...invoiceLines]; u[index].kurs = e.target.value; setInvoiceLines(u); }} className="h-8 w-16" /></TableCell>
                      <TableCell><Input type="number" step="0.01" value={line.rate} onChange={(e) => { const u = [...invoiceLines]; u[index].rate = Number(e.target.value); u[index].amountRp = u[index].amount * u[index].rate; u[index].ppnRp = u[index].amountRp * (u[index].ppnPct / 100); u[index].totalRp = u[index].amountRp + u[index].ppnRp; setInvoiceLines(u); }} className="h-8 w-16" /></TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{line.amountRp.toLocaleString("id-ID")}</TableCell>
                      <TableCell><Input value={line.fakturPajak} onChange={(e) => { const u = [...invoiceLines]; u[index].fakturPajak = e.target.value; setInvoiceLines(u); }} className="h-8" /></TableCell>
                      <TableCell><Input type="date" value={line.tglFp} onChange={(e) => { const u = [...invoiceLines]; u[index].tglFp = e.target.value; setInvoiceLines(u); }} className="h-8" /></TableCell>
                      <TableCell><Input type="number" value={line.ppnPct} onChange={(e) => { const u = [...invoiceLines]; u[index].ppnPct = Number(e.target.value); u[index].ppnRp = u[index].amountRp * (u[index].ppnPct / 100); u[index].totalRp = u[index].amountRp + u[index].ppnRp; setInvoiceLines(u); }} className="h-8 w-16" /></TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{line.ppnRp.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right text-xs font-medium tabular-nums">{line.totalRp.toLocaleString("id-ID")}</TableCell>
                      <TableCell><Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => removeInvoiceLine(index)}><Trash2 className="size-3.5" /></Button></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-md border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">LC & Additional Charges</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><label className="text-xs font-medium">LC</label><Input value={lc1} onChange={(e) => setLc1(e.target.value)} /></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">LC 2</label><Input value={lc2} onChange={(e) => setLc2(e.target.value)} /></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">LC 3</label><Input value={lc3} onChange={(e) => setLc3(e.target.value)} /></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Insurance</label><Input type="number" step="0.01" value={insurance} onChange={(e) => setInsurance(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Interest</label><Input type="number" step="0.01" value={interest} onChange={(e) => setInterest(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Exp.Com1</label><Input type="number" step="0.01" value={expCom1} onChange={(e) => setExpCom1(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Exp.Com2</label><Input type="number" step="0.01" value={expCom2} onChange={(e) => setExpCom2(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Imp.Hand</label><Input type="number" step="0.01" value={impHand} onChange={(e) => setImpHand(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Other</label><Input type="number" step="0.01" value={other} onChange={(e) => setOther(Number(e.target.value))} /></div>
            </div>
          </div>
          <div className="rounded-md border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Totals</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Amount (Rp.)</span><span className="tabular-nums font-medium">{totalRp.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Extra Charges</span><span className="tabular-nums font-medium">{extraCharges.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span></div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Amount in Rp.</span><span className="tabular-nums">{finalTotal.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</span></div>
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
