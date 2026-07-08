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
import { usePOConfirmationList, useDeletePOConfirmation } from "@/api/po-confirm";
import type { POConfirmationListItem } from "@/types";

const PAGE_SIZE = 10;

export function POConfirmListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const { data: items, isLoading } = usePOConfirmationList();
  const deleteConfirm = useDeletePOConfirmation();
  const [deleting, setDeleting] = useState<POConfirmationListItem | null>(null);

  const needle = q.trim().toLowerCase();
  const filtered = (items ?? []).filter((it) => {
    if (!needle) return true;
    return (
      it.doku.toLowerCase().includes(needle) ||
      (it.doku_PO ?? "").toLowerCase().includes(needle) ||
      (it.supplierName ?? "").toLowerCase().includes(needle) ||
      (it.kode_Supplier ?? "").toLowerCase().includes(needle)
    );
  });

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">PO Confirmations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Vendor confirmations and delivery schedules</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search confirmations..." />
          <Button onClick={() => navigate({ to: "/po-confirm/new", search: { mode: "new" } })}>
            <Plus className="mr-1.5 size-4" />New PO Confirmation
          </Button>
        </div>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Confirm #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>PO No.</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Nilai</TableHead>
              <TableHead className="w-[100px]">STS</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                  {needle ? "No confirmations match your search." : "No PO confirmations yet. Click \"New PO Confirmation\" to create one."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((it) => (
                <TableRow
                  key={it.doku}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/po-confirm/$id", params: { id: it.doku }, search: { mode: "edit" } })}
                >
                  <TableCell className="font-medium">{it.doku}</TableCell>
                  <TableCell className="text-sm">{it.tgl?.split("T")[0] ?? "-"}</TableCell>
                  <TableCell className="text-sm">{it.doku_PO ?? "-"}</TableCell>
                  <TableCell className="text-sm">{it.supplierName ?? it.kode_Supplier ?? "-"}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {it.nilai?.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }) ?? "-"}
                  </TableCell>
                  <TableCell><StatusBadge status={it.sts ?? "0"} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleting(it)}
                      aria-label={`Delete ${it.doku}`}
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
        title="Delete PO confirmation?"
        description={`This will permanently remove ${deleting?.doku ?? ""}. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleting) return;
          const target = deleting;
          setDeleting(null);
          deleteConfirm.mutate({ doku: target.doku, eTag: target.eTag });
        }}
        isLoading={deleteConfirm.isPending}
      />
    </div>
  );
}
