import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  FileText,
  ShoppingCart,
  Package,
  Receipt,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import type { PRListItem, POListItem, GRListItem, InvoiceListItem } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({
  label,
  count,
  icon: Icon,
  to,
}: {
  label: string;
  count: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <Icon className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {count === undefined ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-semibold tabular-nums">{count}</div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function PipelineStage({
  label,
  count,
  to,
}: {
  label: string;
  count: number | undefined;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-1 flex-col items-center gap-1 rounded-md border p-4 transition-colors hover:bg-muted/50"
    >
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {count === undefined ? (
        <Skeleton className="h-7 w-12" />
      ) : (
        <span className="text-xl font-semibold tabular-nums">{count}</span>
      )}
    </Link>
  );
}

export function DashboardPage() {
  const { data: prs } = useQuery<PRListItem[]>({
    queryKey: ["purchase-requisitions"],
    queryFn: async () => {
      const res = await api.get("/api/purchase-requisitions");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  const { data: pos } = useQuery<POListItem[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/api/purchase-orders");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  const { data: grs } = useQuery<GRListItem[]>({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const res = await api.get("/api/goods-receipts");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  const { data: invoices } = useQuery<InvoiceListItem[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await api.get("/api/invoices");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const totalInvoiceAmount = invoices?.reduce((sum, inv) => sum + inv.nilai, 0) ?? 0;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Procure-to-Pay overview
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Purchase Requisitions" count={prs?.length} icon={FileText} to="/purchase-requisitions" />
        <StatCard label="Purchase Orders" count={pos?.length} icon={ShoppingCart} to="/purchase-orders" />
        <StatCard label="Goods Receipts" count={grs?.length} icon={Package} to="/goods-receipts" />
        <StatCard label="AP Vouchers" count={invoices?.length} icon={Receipt} to="/invoices" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Procure-to-Pay Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <PipelineStage label="PR (SPB)" count={prs?.length} to="/purchase-requisitions" />
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            <PipelineStage label="PO" count={pos?.length} to="/purchase-orders" />
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            <PipelineStage label="GR (LPB)" count={grs?.length} to="/goods-receipts" />
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            <PipelineStage label="Voucher" count={invoices?.length} to="/invoices" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent AP Vouchers</CardTitle>
            <Link to="/invoices" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!invoices || invoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No AP vouchers yet. Complete the procure-to-pay flow to generate vouchers.
            </p>
          ) : (
            <div className="space-y-2">
              {invoices.slice(0, 5).map((inv) => (
                <div key={inv.doku} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{inv.doku}</span>
                    <span className="text-sm text-muted-foreground">{inv.supplierName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums">
                      {inv.nilai.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}
                    </span>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Outstanding Payables</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tabular-nums">
            {totalInvoiceAmount.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Total open AP voucher amount
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
