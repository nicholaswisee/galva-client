import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { DataSelect } from "@/components/data-select";
import { usePaymentList } from "@/api/payment";
import { PAYMENT_STATUS_LABELS, paymentStatusLabel } from "@/schemas/payment";

const PAGE_SIZE = 10;
const STATUS_FILTERS = ["", ...Object.keys(PAYMENT_STATUS_LABELS)];

export function PaymentListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const { data: payments, isLoading } = usePaymentList();

  const needle = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    return (payments ?? []).filter((p) => {
      if (needle && !`${p.doku} ${p.supplierName ?? ""} ${p.kode_Supplier ?? ""}`.toLowerCase().includes(needle)) return false;
      if (status && p.sts !== status) return false;
      return true;
    });
  }, [payments, needle, status]);

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const statusItems = STATUS_FILTERS.map((s) => ({
    code: s,
    label: s === "" ? "All statuses" : (PAYMENT_STATUS_LABELS[s] ?? s),
  }));

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage AP payments and allocations</p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search payments by document or vendor..." />
          <DataSelect items={statusItems} value={status} onValueChange={setStatus} placeholder="All statuses" />
        </div>
        <Button onClick={() => navigate({ to: "/payments/new" })}>
          <Plus className="mr-1.5 size-4" />New Payment
        </Button>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Cash</TableHead>
              <TableHead className="text-right">Giro</TableHead>
              <TableHead className="text-right">Total</TableHead>
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
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                  {needle || status ? "No payments match your filters." : "No payments yet. Click \"New Payment\" to create one."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((p) => (
                <TableRow
                  key={p.doku}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/payments/$doku", params: { doku: p.doku } })}
                >
                  <TableCell className="font-medium">{p.doku}</TableCell>
                  <TableCell className="text-sm">{p.tgl?.split("T")[0] ?? "-"}</TableCell>
                  <TableCell className="text-sm">{p.supplierName ?? p.kode_Supplier ?? "-"}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{p.nilaiKas?.toLocaleString("id-ID") ?? "-"}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{p.nilaiGiro?.toLocaleString("id-ID") ?? "-"}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{(p.nilaiKas ?? 0) + (p.nilaiGiro ?? 0)}</TableCell>
                  <TableCell><StatusBadge status={paymentStatusLabel(p.sts)} /></TableCell>
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
