import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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
import { api } from "@/lib/api";
import type { GRListItem } from "@/types";
import { useState } from "react";

const PAGE_SIZE = 10;

export function GRListPage() {
  const [page, setPage] = useState(1);
  const { data: grs, isLoading } = useQuery<GRListItem[]>({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const res = await api.get("/api/goods-receipts");
      if (!res.ok) throw new Error("Failed to fetch goods receipts");
      return res.json();
    },
  });

  const total = grs?.length ?? 0;
  const paginated = grs?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goods Receipts (LPB)</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lembar Penerimaan Barang</p>
        </div>
        <Link to="/gr/new">
          <Button><Plus className="mr-1.5 size-4" />New GR</Button>
        </Link>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doku</TableHead>
              <TableHead>PO Ref</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Nilai</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                </TableRow>
              ))
            ) : !paginated || paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                  No goods receipts yet. Click "New GR" to create one.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((gr) => (
                <TableRow key={gr.doku} className="cursor-pointer" onClick={() => window.location.href = `/gr/${gr.doku}`}>
                  <TableCell className="font-medium">{gr.doku}</TableCell>
                  <TableCell className="text-sm">{gr.doku_PO ?? "-"}</TableCell>
                  <TableCell className="text-sm">{gr.supplierName ?? gr.kode_Supplier ?? "-"}</TableCell>
                  <TableCell className="text-sm">{gr.tgl?.split("T")[0] ?? "-"}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{gr.nilai?.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }) ?? "-"}</TableCell>
                  <TableCell><StatusBadge status={gr.status} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
