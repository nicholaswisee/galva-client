import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import type { GRDetail } from "@/types";

export function GRDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { data: gr, isLoading } = useQuery<GRDetail>({
    queryKey: ["goods-receipts", id],
    queryFn: async () => {
      const res = await api.get(`/api/goods-receipts/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Failed to fetch GR");
      return res.json();
    },
    enabled: !!id,
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/gr" search={{ tab: "receipts" }}>
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">GR {id}</h1>
            <p className="text-sm text-muted-foreground">Goods Receipt Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {gr && (
            <Link to="/gr/invoices/new" search={{ doku_LPB: gr.doku }}>
              <Button size="sm" variant="outline">
                <FilePlus className="mr-1.5 size-4" />
                Create Invoice
              </Button>
            </Link>
          )}
          {gr && <StatusBadge status={gr.status} />}
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
        <div className="space-y-6">
          <div className="rounded-md border bg-card p-6">
            <h2 className="mb-4 text-base font-semibold">Header Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Document No</div>
                <div className="text-sm font-medium">{gr.doku}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Date</div>
                <div className="text-sm font-medium">{gr.tgl?.split("T")[0] ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">PO Confirm</div>
                <div className="text-sm font-medium">{gr.doku_PCF ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">PO Reference</div>
                <div className="text-sm font-medium">{gr.doku_PO ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Supplier</div>
                <div className="text-sm font-medium">{gr.supplierName ?? gr.kode_Supplier ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Surat Jalan</div>
                <div className="text-sm font-medium">{gr.suratJalan ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Nilai</div>
                <div className="text-sm font-medium tabular-nums">{gr.nilai?.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm font-medium">{gr.status}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">STS</div>
                <div className="text-sm font-medium">{gr.sts}</div>
              </div>
            </div>
            {gr.memo && (
              <div className="mt-4">
                <div className="text-xs text-muted-foreground">Memo</div>
                <div className="mt-1 text-sm">{gr.memo}</div>
              </div>
            )}
          </div>

          <div className="rounded-md border bg-card p-6">
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
        </div>
      )}
    </div>
  );
}
