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
import type { PRListItem } from "@/types";
import { useState } from "react";

const PAGE_SIZE = 10;

export function PRListPage() {
  const [page, setPage] = useState(1);
  const { data: prs, isLoading } = useQuery<PRListItem[]>({
    queryKey: ["purchase-requisitions"],
    queryFn: async () => {
      const res = await api.get("/api/purchase-requisitions");
      if (!res.ok) throw new Error("Failed to fetch purchase requisitions");
      return res.json();
    },
  });

  const total = prs?.length ?? 0;
  const paginated = prs?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchase Requisitions (SPB)</h1>
          <p className="mt-1 text-sm text-muted-foreground">Surat Permintaan Barang</p>
        </div>
        <Link to="/pr/new">
          <Button><Plus className="mr-1.5 size-4" />New SPB</Button>
        </Link>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doku</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                </TableRow>
              ))
            ) : !paginated || paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">
                  No purchase requisitions yet. Click "New SPB" to create one.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((pr) => (
                <TableRow key={pr.doku} className="cursor-pointer" onClick={() => window.location.href = `/pr/${pr.doku}`}>
                  <TableCell className="font-medium">{pr.doku}</TableCell>
                  <TableCell className="text-sm">{pr.tgl?.split("T")[0] ?? "-"}</TableCell>
                  <TableCell className="text-sm">{pr.kode_Dept ?? "-"}</TableCell>
                  <TableCell><StatusBadge status={pr.status} /></TableCell>
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
