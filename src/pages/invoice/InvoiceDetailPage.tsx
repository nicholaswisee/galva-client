import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FilePlus, Save, Trash, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { api } from "@/lib/api";
import { useDeleteInvoice, useUpdateInvoice } from "@/api/invoice";
import type { InvoiceDetail } from "@/types";

export function InvoiceDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: detail, isLoading, refetch } = useQuery<{ data: InvoiceDetail; eTag: string }>({
    queryKey: ["invoices", id],
    queryFn: async () => {
      const res = await api.get(`/api/invoices/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Failed to fetch invoice");
      const data: InvoiceDetail = await res.json();
      const eTag = res.headers.get("ETag")?.replace(/^W\//, "").replace(/^"|"$/g, "") ?? data.eTag;
      return { data, eTag };
    },
    enabled: !!id,
  });

  const inv = detail?.data;
  const eTag = detail?.eTag ?? "";

  const [sts, setSts] = useState("");
  const [keterangan, setKeterangan] = useState("");

  useEffect(() => {
    if (!inv) return;
    setSts(inv.sts ?? "");
    setKeterangan(inv.keterangan ?? "");
  }, [inv]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inv || !eTag) return;
    updateInvoice.mutate(
      { doku: inv.doku, sts, keterangan: keterangan || null, eTag },
      { onSuccess: () => refetch() },
    );
  };

  const onDelete = () => {
    if (!inv || !eTag) return;
    deleteInvoice.mutate(
      { doku: inv.doku, eTag },
      { onSuccess: () => navigate({ to: "/invoices", search: { tab: inv.tipeBiaya === "PO" ? "po" : "lpb" } }) },
    );
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/invoices"
            search={{ tab: inv?.tipeBiaya === "PO" ? "po" : "lpb" }}
          >
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">AP Invoice {id}</h1>
            <p className="text-sm text-muted-foreground">Edit invoice</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !inv ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">AP invoice not found.</p>
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
              onClick={() => navigate({ to: "/invoices/new" })}
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
              disabled={updateInvoice.isPending}
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
            <div className="ml-auto flex items-center gap-2">
              <StatusBadge status={inv.sts ?? "0"} />
            </div>
          </div>

          {/* Header */}
          <div className="rounded-md border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Header</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Document No</label>
                <Input value={inv.doku} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Date</label>
                <Input value={inv.tgl?.split("T")[0] ?? ""} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Supplier</label>
                <Input value={inv.supplierName ?? inv.kode_Supplier ?? "-"} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Department</label>
                <Input value={inv.kode_Dept ?? "-"} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Nilai</label>
                <Input
                  value={inv.nilai?.toLocaleString("id-ID", { style: "currency", currency: "IDR" }) ?? ""}
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">PPN</label>
                <Input
                  value={inv.ppn?.toLocaleString("id-ID", { style: "currency", currency: "IDR" }) ?? ""}
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Diskon</label>
                <Input
                  value={inv.diskon?.toLocaleString("id-ID", { style: "currency", currency: "IDR" }) ?? ""}
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Misc</label>
                <Input
                  value={inv.misc?.toLocaleString("id-ID", { style: "currency", currency: "IDR" }) ?? ""}
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">STS</label>
                <Input value={sts} onChange={(e) => setSts(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Type</label>
                <Input value={inv.tipeBiaya ?? "-"} disabled />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-medium">Keterangan</label>
              <Textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                rows={3}
                placeholder="Description / notes..."
              />
            </div>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete invoice?"
        description={`This will permanently remove ${id}. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={onDelete}
        isLoading={deleteInvoice.isPending}
      />
    </div>
  );
}
