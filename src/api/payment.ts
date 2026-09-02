import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaymentDetail, PaymentListItem } from "@/types";
import type { PaymentFormInput } from "@/schemas/payment";
import { toast } from "sonner";

function extractETag(res: Response): string | null {
  const etag = res.headers.get("ETag");
  if (!etag) return null;
  return etag.replace(/^W\//, "").replace(/^"|"$/g, "");
}

export interface PaymentLinePayload {
  doku_Faktur: string;
  doku_LPB: string | null;
  nilai: number;
  totalNilai: number;
}

export interface CreatePaymentPayload {
  kode_Supplier: string;
  tgl: string;
  kode_BankSupplier: string | null;
  keterangan: string | null;
  nilaiKas: number;
  nilaiGiro: number;
  kode_Valas: string;
  kurs: number;
  lineItems: PaymentLinePayload[];
}

export interface UpdatePaymentPayload {
  sts: string;
  keterangan: string | null;
  kode_BankSupplier: string | null;
  nilaiKas: number;
  nilaiGiro: number;
}

export function buildCreatePaymentPayload(form: PaymentFormInput): CreatePaymentPayload {
  return {
    kode_Supplier: form.kode_Supplier,
    tgl: new Date(form.tgl).toISOString(),
    kode_BankSupplier: form.kode_BankSupplier || null,
    keterangan: form.keterangan || null,
    nilaiKas: form.nilaiKas,
    nilaiGiro: form.nilaiGiro,
    kode_Valas: form.kode_Valas,
    kurs: form.kurs,
    lineItems: form.lineItems.map((line) => ({
      doku_Faktur: line.doku_Faktur,
      doku_LPB: line.doku_LPB || null,
      nilai: line.nilai,
      totalNilai: line.totalNilai,
    })),
  };
}

export function buildUpdatePaymentPayload(form: {
  sts: string;
  keterangan: string | null;
  kode_BankSupplier: string | null;
  nilaiKas: number;
  nilaiGiro: number;
}): UpdatePaymentPayload {
  return {
    sts: form.sts,
    keterangan: form.keterangan || null,
    kode_BankSupplier: form.kode_BankSupplier || null,
    nilaiKas: form.nilaiKas,
    nilaiGiro: form.nilaiGiro,
  };
}

export function aggregatePaidByInvoice(details: PaymentDetail[]): Record<string, number> {
  const paid: Record<string, number> = {};
  for (const detail of details) {
    for (const line of detail.lineItems) {
      if (!line.doku_Faktur) continue;
      paid[line.doku_Faktur] = (paid[line.doku_Faktur] ?? 0) + (line.totalNilai ?? 0);
    }
  }
  return paid;
}

export function usePaymentList() {
  return useQuery<PaymentListItem[]>({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await api.get("/api/payments");
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
  });
}

export function usePaymentDetail(doku: string | null) {
  return useQuery<{ data: PaymentDetail; eTag: string }>({
    queryKey: ["payments", doku],
    queryFn: async () => {
      if (!doku) throw new Error("Doku is required");
      const res = await api.get(`/api/payments/${encodeURIComponent(doku)}`);
      if (!res.ok) throw new Error("Failed to fetch payment");
      const data: PaymentDetail = await res.json();
      const eTag = extractETag(res) ?? data.eTag;
      return { data, eTag };
    },
    enabled: !!doku,
  });
}

// ponytail: N+1 over payment details to derive per-invoice paid totals; the current API exposes
// no outstanding endpoint. Replace with a server aggregation endpoint when payment volume grows.
export function usePaidByVendor(kode_Supplier: string | null) {
  return useQuery<Record<string, number>>({
    queryKey: ["payments", "paid-by-vendor", kode_Supplier],
    queryFn: async () => {
      if (!kode_Supplier) return {};
      const listRes = await api.get("/api/payments");
      if (!listRes.ok) throw new Error("Failed to fetch payments");
      const list: PaymentListItem[] = await listRes.json();
      const vendorPayments = list.filter(
        (p) => (p.kode_Supplier ?? "").toLowerCase() === kode_Supplier.toLowerCase(),
      );
      const details = await Promise.all(
        vendorPayments.map(async (p) => {
          const res = await api.get(`/api/payments/${encodeURIComponent(p.doku)}`);
          return res.ok ? (res.json() as Promise<PaymentDetail>) : null;
        }),
      );
      return aggregatePaidByInvoice(details.filter((d): d is PaymentDetail => d !== null));
    },
    enabled: !!kode_Supplier,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePaymentPayload) => {
      const res = await api.post("/api/payments", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? err?.error ?? "Failed to create payment");
      }
      return res.json() as Promise<{ doku: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      doku,
      eTag,
      body,
    }: {
      doku: string;
      eTag: string;
      body: UpdatePaymentPayload;
    }) => {
      const res = await api.put(`/api/payments/${encodeURIComponent(doku)}`, body, {
        ifMatch: eTag,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw Object.assign(
          new Error(err?.error ?? err?.detail ?? "Failed to update payment"),
          { status: res.status },
        );
      }
      const data: PaymentDetail = await res.json();
      const newETag = extractETag(res) ?? data.eTag;
      return { data, eTag: newETag };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments", variables.doku] });
      queryClient.invalidateQueries({ queryKey: ["payments", "paid-by-vendor"] });
      toast.success("Payment updated");
    },
    onError: (error: Error & { status?: number }) => {
      if (error.status === 412) toast.error("Payment was changed by another user. Reload and retry.");
      else toast.error(error.message);
    },
  });
}
