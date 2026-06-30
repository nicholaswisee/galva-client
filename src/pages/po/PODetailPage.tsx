import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";
import type { PODetail } from "@/types";

export function PODetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { data: po, isLoading } = useQuery<PODetail>({
    queryKey: ["purchase-orders", id],
    queryFn: async () => {
      const res = await api.get(`/api/purchase-orders/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Failed to fetch PO");
      return res.json();
    },
    enabled: !!id,
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/po">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">PO {id}</h1>
            <p className="text-sm text-muted-foreground">Purchase Order Details</p>
          </div>
        </div>
        {po && <StatusBadge status={po.sts ?? "0"} />}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !po ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">Purchase order not found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-md border bg-card p-6">
            <h2 className="mb-4 text-base font-semibold">Header Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Document No</div>
                <div className="text-sm font-medium">{po.doku}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Date</div>
                <div className="text-sm font-medium">{po.tgl?.split("T")[0] ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Supplier</div>
                <div className="text-sm font-medium">{po.supplierName ?? po.kode_Supplier ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Department</div>
                <div className="text-sm font-medium">{po.kode_dept ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Nilai</div>
                <div className="text-sm font-medium tabular-nums">{po.nilai?.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">PPN</div>
                <div className="text-sm font-medium tabular-nums">{po.ppn?.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Diskon</div>
                <div className="text-sm font-medium tabular-nums">{po.diskon?.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm font-medium">{po.sts}</div>
              </div>
            </div>
            {po.memo && (
              <div className="mt-4">
                <div className="text-xs text-muted-foreground">Memo</div>
                <div className="mt-1 text-sm">{po.memo}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
