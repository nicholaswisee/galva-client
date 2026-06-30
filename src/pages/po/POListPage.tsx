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
import type { POListItem } from "@/types";
import { useState } from "react";

const PAGE_SIZE = 10;

export function POListPage() {
  const [page, setPage] = useState(1);
  const { data: pos, isLoading } = useQuery<POListItem[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/api/purchase-orders");
      if (!res.ok) throw new Error("Failed to fetch purchase orders");
      return res.json();
    },
  });

  const total = pos?.length ?? 0;
  const paginated = pos?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchase Orders (PO)</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage purchase orders</p>
        </div>
        <Link to="/po/new">
          <Button><Plus className="mr-1.5 size-4" />New PO</Button>
        </Link>
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
                </TableRow>
              ))
            ) : !paginated || paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                  No purchase orders yet. Click "New PO" to create one.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((po) => (
                <TableRow key={po.doku} className="cursor-pointer" onClick={() => window.location.href = `/po/${po.doku}`}>
                  <TableCell className="font-medium">{po.doku}</TableCell>
                  <TableCell className="text-sm">{po.supplierName ?? po.kode_Supplier ?? "-"}</TableCell>
                  <TableCell className="text-sm">{po.tgl?.split("T")[0] ?? "-"}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{po.nilai?.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }) ?? "-"}</TableCell>
                  <TableCell><StatusBadge status={po.sts ?? "0"} /></TableCell>
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
