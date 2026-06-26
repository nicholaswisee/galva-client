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
import { api } from "@/lib/api";
import type { GRListItem } from "@/types";

export function GRListPage() {
  const { data: grs, isLoading } = useQuery<GRListItem[]>({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const res = await api.get("/api/goods-receipts");
      if (!res.ok) throw new Error("Failed to fetch goods receipts");
      return res.json();
    },
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goods Receipts (LPB)</h1>
          <p className="mt-1 text-sm text-muted-foreground">Laporan Penerimaan Barang</p>
        </div>
        <Link to="/goods-receipts/new">
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
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                </TableRow>
              ))
            ) : !grs || grs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                  No goods receipts yet. Confirm a PO first, then create a GR.
                </TableCell>
              </TableRow>
            ) : (
              grs.map((gr) => (
                <TableRow key={gr.doku}>
                  <TableCell className="font-medium">{gr.doku}</TableCell>
                  <TableCell className="text-sm">{gr.doku_PO ?? "-"}</TableCell>
                  <TableCell className="text-sm">{gr.supplierName ?? gr.kode_Supplier ?? "-"}</TableCell>
                  <TableCell className="text-sm">{gr.tgl?.split("T")[0] ?? "-"}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{gr.nilai?.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }) ?? "-"}</TableCell>
                  <TableCell><StatusBadge status={gr.sts ?? "0"} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
