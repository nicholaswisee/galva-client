import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useReturnList, useDeleteReturn } from "@/api/return";
import type { ReturnListItem } from "@/types";

const PAGE_SIZE = 10;

export function ReturnListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState<ReturnListItem | null>(null);
  const { data: returns, isLoading } = useReturnList();
  const deleteReturn = useDeleteReturn();

  const needle = q.trim().toLowerCase();
  const filtered = (returns ?? []).filter((r) => {
    if (!needle) return true;
    return (
      r.doku.toLowerCase().includes(needle) ||
      (r.doku_Faktur ?? "").toLowerCase().includes(needle) ||
      (r.supplierName ?? "").toLowerCase().includes(needle) ||
      (r.kode_Supplier ?? "").toLowerCase().includes(needle)
    );
  });

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vendor Returns</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage purchase returns against AP invoices</p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <SearchInput value={q} onChange={setQ} placeholder="Search returns..." />
        <Button onClick={() => navigate({ to: "/returns/new" })}>
          <Plus className="mr-1.5 size-4" />New Return
        </Button>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Source Invoice</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px]">Sync</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-sm text-muted-foreground">
                  {needle ? "No vendor returns match your search." : "No vendor returns yet. Click \"New Return\" to create one."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((r) => (
                <TableRow
                  key={r.doku}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/returns/$doku", params: { doku: r.doku } })}
                >
                  <TableCell className="font-medium">{r.doku}</TableCell>
                  <TableCell className="text-sm">{r.tgl?.split("T")[0] ?? "-"}</TableCell>
                  <TableCell className="text-sm">{r.doku_Faktur ?? "-"}</TableCell>
                  <TableCell className="text-sm">{r.supplierName ?? r.kode_Supplier ?? "-"}</TableCell>
                  <TableCell className="text-sm">{r.kode_Valas ?? "-"}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {r.nilai.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell><StatusBadge status={r.sts ?? "0"} /></TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.syncToCMG ? "Synced" : "Not synced"}</Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleting(r)}
                      aria-label={`Delete ${r.doku}`}
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
        title="Delete vendor return?"
        description={`This will permanently remove ${deleting?.doku ?? ""}. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleting) return;
          const target = deleting;
          setDeleting(null);
          deleteReturn.mutate({ doku: target.doku, eTag: target.eTag });
        }}
        isLoading={deleteReturn.isPending}
      />
    </div>
  );
}
