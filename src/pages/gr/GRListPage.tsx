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
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useGoodsReceiptList, useDeleteGoodsReceipt } from "@/api/goods-receipt";
import type { GRListItem } from "@/types";

const PAGE_SIZE = 10;

export function GRListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const { data: grs, isLoading } = useGoodsReceiptList();
  const deleteGR = useDeleteGoodsReceipt();
  const [deleting, setDeleting] = useState<GRListItem | null>(null);

  const needle = q.trim().toLowerCase();
  const filtered = (grs ?? []).filter((gr) => {
    if (!needle) return true;
    return (
      gr.doku.toLowerCase().includes(needle) ||
      (gr.doku_PCF ?? "").toLowerCase().includes(needle) ||
      (gr.doku_PO ?? "").toLowerCase().includes(needle) ||
      (gr.supplierName ?? "").toLowerCase().includes(needle) ||
      (gr.kode_Supplier ?? "").toLowerCase().includes(needle)
    );
  });

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goods Receipts (LPB)</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lembar Penerimaan Barang</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search goods receipts..." />
          <Button onClick={() => navigate({ to: "/gr/new" })}>
            <Plus className="mr-1.5 size-4" />New GR
          </Button>
        </div>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doku</TableHead>
              <TableHead>PO Confirm</TableHead>
              <TableHead>PO Ref</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Nilai</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                  {needle ? "No goods receipts match your search." : "No goods receipts yet. Click \"New GR\" to create one."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((gr) => (
                <TableRow
                  key={gr.doku}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/gr/$id", params: { id: gr.doku } })}
                >
                  <TableCell className="font-medium">{gr.doku}</TableCell>
                  <TableCell className="text-sm">{gr.doku_PCF ?? "-"}</TableCell>
                  <TableCell className="text-sm">{gr.doku_PO ?? "-"}</TableCell>
                  <TableCell className="text-sm">{gr.supplierName ?? gr.kode_Supplier ?? "-"}</TableCell>
                  <TableCell className="text-sm">{gr.tgl?.split("T")[0] ?? "-"}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {gr.nilai?.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }) ?? "-"}
                  </TableCell>
                  <TableCell><StatusBadge status={gr.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleting(gr)}
                      aria-label={`Delete ${gr.doku}`}
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
        title="Delete goods receipt?"
        description={`This will permanently remove ${deleting?.doku ?? ""}. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleting) return;
          const target = deleting;
          setDeleting(null);
          deleteGR.mutate({ doku: target.doku, eTag: target.eTag });
        }}
        isLoading={deleteGR.isPending}
      />
    </div>
  );
}
