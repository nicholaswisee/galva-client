import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FilePlus, Save, Trash, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { useDeleteGoodsReceipt, useUpdateGoodsReceipt } from "@/api/goods-receipt";
import type { GRDetail } from "@/types";

export function GRDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const updateGR = useUpdateGoodsReceipt();
  const deleteGR = useDeleteGoodsReceipt();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: detail, isLoading, refetch } = useQuery<{ data: GRDetail; eTag: string }>({
    queryKey: ["goods-receipts", id],
    queryFn: async () => {
      const res = await api.get(`/api/goods-receipts/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Failed to fetch goods receipt");
      const data: GRDetail = await res.json();
      const eTag = res.headers.get("ETag")?.replace(/^W\//, "").replace(/^"|"$/g, "") ?? data.eTag;
      return { data, eTag };
    },
    enabled: !!id,
  });

  const gr = detail?.data;
  const eTag = detail?.eTag ?? "";

  const [sts, setSts] = useState("");
  const [status, setStatus] = useState("");
  const [memo, setMemo] = useState("");
  const [ppn, setPpn] = useState<number | null>(null);

  // Seed the editable form state when the fetched detail arrives.
  const [prevGr, setPrevGr] = useState<GRDetail | null>(null);
  if (gr && gr !== prevGr) {
    setPrevGr(gr);
    setSts(gr.sts ?? "");
    setStatus(gr.status ?? "");
    setMemo(gr.memo ?? "");
    setPpn(null);
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!gr || !eTag) return;
    updateGR.mutate(
      { doku: gr.doku, sts, status, memo: memo || null, ppn, eTag },
      { onSuccess: () => refetch() },
    );
  };

  const onDelete = () => {
    if (!gr || !eTag) return;
    deleteGR.mutate(
      { doku: gr.doku, eTag },
      { onSuccess: () => navigate({ to: "/gr", search: { tab: "receipts" } }) },
    );
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/gr" search={{ tab: "receipts" }}>
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Goods Receipt {id}</h1>
            <p className="text-sm text-muted-foreground">Edit goods receipt</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !gr ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">Goods receipt not found.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate({ to: "/gr/new" })}
            >
              <FilePlus className="size-4" />New
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash className="size-4" />Delete
            </Button>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              disabled={updateGR.isPending}
            >
              <Save className="size-4" />Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => window.print()}
            >
              <Printer className="size-4" />Print
            </Button>
            <Link to="/invoices/new" search={{ doku_LPB: gr.doku }} className="ml-auto">
              <Button size="sm" variant="outline">
                <FilePlus className="mr-1.5 size-4" />
                Create Invoice
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="rounded-md border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Header</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Document No</label>
                <Input value={gr.doku} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Date</label>
                <Input value={gr.tgl?.split("T")[0] ?? ""} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">PO Confirm</label>
                <Input value={gr.doku_PCF ?? "-"} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">PO Reference</label>
                <Input value={gr.doku_PO ?? "-"} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Supplier</label>
                <Input value={gr.supplierName ?? gr.kode_Supplier ?? "-"} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Currency</label>
                <Input value={gr.kode_Valas ?? "-"} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Rate</label>
                <Input value={gr.kurs ?? "-"} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Nilai</label>
                <Input
                  value={gr.nilai?.toLocaleString("id-ID", { style: "currency", currency: "IDR" }) ?? ""}
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">STS</label>
                <Input value={sts} onChange={(e) => setSts(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Status</label>
                <Input value={status} onChange={(e) => setStatus(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">PPN (%)</label>
                <Input
                  type="number"
                  value={ppn ?? ""}
                  onChange={(e) => setPpn(e.target.value === "" ? null : Number(e.target.value))}
                />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-medium">Memo</label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                placeholder="Notes..."
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-md border bg-card p-4">
            <h2 className="mb-4 text-base font-semibold">Line Items</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Stock Code</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>WH</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(gr.lineItems ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                        No line items.
                      </TableCell>
                    </TableRow>
                  ) : (
                    gr.lineItems!.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="text-sm">{item.kode_Brg}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{item.jumlah.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{item.harga.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{item.nilai.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-sm">{item.kode_Gudang ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete goods receipt?"
        description={`This will permanently remove ${id}. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={onDelete}
        isLoading={deleteGR.isPending}
      />
    </div>
  );
}
