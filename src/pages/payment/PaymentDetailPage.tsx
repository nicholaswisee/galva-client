import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, FilePlus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DataSelect } from "@/components/data-select";
import { useBanks } from "@/lib/use-master-data";
import {
  buildUpdatePaymentPayload,
  usePaymentDetail,
  useUpdatePayment,
} from "@/api/payment";
import { paymentStatusLabel } from "@/schemas/payment";
import type { PaymentDetail } from "@/types";

const STS_OPTIONS = [
  { code: "0", label: "Pending" },
  { code: "1", label: "Active" },
  { code: "2", label: "Closed" },
];

export function PaymentDetailPage() {
  const { doku } = useParams({ strict: false }) as { doku: string };
  const navigate = useNavigate();
  const { data: banks } = useBanks();
  const updatePayment = useUpdatePayment();

  const { data: detail, isLoading, refetch } = usePaymentDetail(doku);

  const payment = detail?.data;
  const eTag = detail?.eTag ?? "";

  // Editable draft state, seeded from the detail (same pattern as InvoiceDetailPage).
  const [sts, setSts] = useState("0");
  const [kode_BankSupplier, setKode_BankSupplier] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [nilaiKas, setNilaiKas] = useState(0);
  const [nilaiGiro, setNilaiGiro] = useState(0);

  // Seed the editable form state when the fetched detail arrives.
  const [prevPayment, setPrevPayment] = useState<PaymentDetail | null>(null);
  if (payment && payment !== prevPayment) {
    setPrevPayment(payment);
    setSts(payment.sts ?? "0");
    setKode_BankSupplier(payment.kode_BankSupplier ?? "");
    setKeterangan(payment.keterangan ?? "");
    setNilaiKas(payment.nilaiKas ?? 0);
    setNilaiGiro(payment.nilaiGiro ?? 0);
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!payment || !eTag) return;
    updatePayment.mutate(
      {
        doku: payment.doku,
        eTag,
        body: buildUpdatePaymentPayload({ sts, keterangan, kode_BankSupplier, nilaiKas, nilaiGiro }),
      },
      { onSuccess: () => refetch() },
    );
  };

  const bankItems = banks?.map((b) => ({ code: b.kode, label: `${b.kode} - ${b.nama}` })) ?? [];

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Link to="/payments">
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payment {doku}</h1>
          <p className="text-sm text-muted-foreground">Payment detail and edit</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !payment ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">Payment not found.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate({ to: "/payments/new" })}
            >
              <FilePlus className="size-4" />New
            </Button>
            <Button type="submit" variant="ghost" size="sm" className="gap-1.5" disabled={updatePayment.isPending}>
              <Save className="size-4" />Save
            </Button>
            <div className="ml-auto">
              <StatusBadge status={paymentStatusLabel(payment.sts)} />
            </div>
          </div>

          {/* Header */}
          <div className="rounded-md border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Header</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Document No</label>
                <Input value={payment.doku} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Date</label>
                <Input value={payment.tgl?.split("T")[0] ?? "-"} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Vendor</label>
                <Input value={payment.supplierName ?? payment.kode_Supplier ?? "-"} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Bank</label>
                <DataSelect
                  items={bankItems}
                  value={kode_BankSupplier}
                  onValueChange={setKode_BankSupplier}
                  placeholder="Select bank"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Currency</label>
                <Input value={payment.kode_Valas ?? "-"} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Rate</label>
                <Input value={payment.kurs.toString()} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Status</label>
                <Select value={sts} onValueChange={setSts}>
                  <SelectTrigger aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STS_OPTIONS.map((o) => (
                      <SelectItem key={o.code} value={o.code}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-medium">Description</label>
              <Textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                rows={3}
                placeholder="Description / notes..."
              />
            </div>
          </div>

          {/* Allocation lines, read-only */}
          <div className="rounded-md border bg-card">
            <h2 className="border-b p-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Invoice Allocations
            </h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>GR Ref</TableHead>
                    <TableHead className="text-right">Original</TableHead>
                    <TableHead className="text-right">Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payment.lineItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                        No allocations.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payment.lineItems.map((line) => (
                      <TableRow key={line.pkbas}>
                        <TableCell className="text-sm">{line.doku_Faktur ?? "-"}</TableCell>
                        <TableCell className="text-sm">{line.doku_LPB ?? "-"}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {line.nilai?.toLocaleString("id-ID") ?? "-"}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {line.totalNilai?.toLocaleString("id-ID") ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-md border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Summary</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label className="text-muted-foreground">Cash Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nilaiKas}
                  onChange={(e) => setNilaiKas(Number(e.target.value))}
                  className="h-7 w-32 text-right"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="text-muted-foreground">Giro Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nilaiGiro}
                  onChange={(e) => setNilaiGiro(Number(e.target.value))}
                  className="h-7 w-32 text-right"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Down Payment</span>
                <span className="tabular-nums">{payment.nilMuka?.toLocaleString("id-ID") ?? "-"}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{(nilaiKas + nilaiGiro).toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
