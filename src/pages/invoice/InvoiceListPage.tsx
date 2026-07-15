import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useInvoiceList, useDeleteInvoice } from "@/api/invoice";
import type { InvoiceListItem } from "@/types";

const PAGE_SIZE = 10;

type TipeBiaya = "LPB" | "PO";

const TITLES: Record<TipeBiaya, { title: string; subtitle: string }> = {
  LPB: {
    title: "AP Invoices (Based on GR)",
    subtitle: "Invoices linked to goods receipts",
  },
  PO: {
    title: "AP Invoices (Based on PO Confirm)",
    subtitle: "Invoices linked to purchase order confirmations",
  },
};

const NEW_PATHS: Record<TipeBiaya, string> = {
  LPB: "/invoices/new",
  PO: "/invoices/po-based/new",
};

export function InvoiceListPage({ tipeBiaya = "LPB" }: { tipeBiaya?: TipeBiaya }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const { data: invoices, isLoading } = useInvoiceList(tipeBiaya);
  const deleteInvoice = useDeleteInvoice();
  const [deleting, setDeleting] = useState<InvoiceListItem | null>(null);

  const { title, subtitle } = TITLES[tipeBiaya];

  const needle = q.trim().toLowerCase();
  const filtered = (invoices ?? []).filter((inv) => {
    if (!needle) return true;
    return (
      inv.doku.toLowerCase().includes(needle) ||
      (inv.supplierName ?? "").toLowerCase().includes(needle) ||
      (inv.kode_Supplier ?? "").toLowerCase().includes(needle)
    );
  });

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const newInvoicePath = NEW_PATHS[tipeBiaya];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search invoices..." />
          <Button onClick={() => navigate({ to: newInvoicePath })}>
            <Plus className="mr-1.5 size-4" />New Invoice
          </Button>
        </div>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doku</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Nilai</TableHead>
              <TableHead className="w-[100px]">STS</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                  {needle ? "No invoices match your search." : "No invoices yet. Click \"New Invoice\" to create one."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((inv) => (
                <TableRow
                  key={inv.doku}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/invoices/$id", params: { id: inv.doku } })}
                >
                  <TableCell className="font-medium">{inv.doku}</TableCell>
                  <TableCell className="text-sm">{inv.supplierName ?? inv.kode_Supplier ?? "-"}</TableCell>
                  <TableCell className="text-sm">{inv.tgl?.split("T")[0] ?? "-"}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {inv.nilai?.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }) ?? "-"}
                  </TableCell>
                  <TableCell><StatusBadge status={inv.sts ?? "0"} /></TableCell>
                  <TableCell>
                    <Badge variant="outline">{inv.tipeBiaya ?? tipeBiaya}</Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleting(inv)}
                      aria-label={`Delete ${inv.doku}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete invoice?"
        description={`This will permanently remove ${deleting?.doku ?? ""}. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleting) return;
          const target = deleting;
          setDeleting(null);
          deleteInvoice.mutate({ doku: target.doku, eTag: target.eTag });
        }}
        isLoading={deleteInvoice.isPending}
      />
    </div>
  );
}
