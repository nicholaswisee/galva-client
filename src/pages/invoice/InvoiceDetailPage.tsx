import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";
import type { InvoiceDetail } from "@/types";

export function InvoiceDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { data: inv, isLoading } = useQuery<InvoiceDetail>({
    queryKey: ["invoices", id],
    queryFn: async () => {
      const res = await api.get(`/api/invoices/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Failed to fetch invoice");
      return res.json();
    },
    enabled: !!id,
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/ap">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Invoice {id}</h1>
            <p className="text-sm text-muted-foreground">AP Invoice Details</p>
          </div>
        </div>
        {inv && <StatusBadge status={inv.status} />}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !inv ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">AP invoice not found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-md border bg-card p-6">
            <h2 className="mb-4 text-base font-semibold">Header Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Document No</div>
                <div className="text-sm font-medium">{inv.doku}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Date</div>
                <div className="text-sm font-medium">{inv.tgl?.split("T")[0] ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Supplier</div>
                <div className="text-sm font-medium">{inv.supplierName ?? inv.kode_Supplier ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Department</div>
                <div className="text-sm font-medium">{inv.kode_Dept ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Bank</div>
                <div className="text-sm font-medium">{inv.kode_Bank ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Nilai</div>
                <div className="text-sm font-medium tabular-nums">{inv.nilai?.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">PPN</div>
                <div className="text-sm font-medium tabular-nums">{inv.ppn?.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Diskon</div>
                <div className="text-sm font-medium tabular-nums">{inv.diskon?.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Misc</div>
                <div className="text-sm font-medium tabular-nums">{inv.misc?.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm font-medium">{inv.status}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">STS</div>
                <div className="text-sm font-medium">{inv.sts}</div>
              </div>
            </div>
            {inv.keterangan && (
              <div className="mt-4">
                <div className="text-xs text-muted-foreground">Keterangan</div>
                <div className="mt-1 text-sm">{inv.keterangan}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
