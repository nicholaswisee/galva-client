import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InvoiceDetail, InvoiceListItem } from "@/types";
import { toast } from "sonner";

function extractETag(res: Response): string | null {
  const etag = res.headers.get("ETag");
  if (!etag) return null;
  return etag.replace(/^W\//, "").replace(/^"|"$/g, "");
}

export function useInvoiceList(tipeBiaya?: "LPB" | "PO") {
  return useQuery<InvoiceListItem[]>({
    queryKey: ["invoices", tipeBiaya ?? "all"],
    queryFn: async () => {
      const url = tipeBiaya
        ? `/api/invoices?tipeBiaya=${encodeURIComponent(tipeBiaya)}`
        : "/api/invoices";
      const res = await api.get(url);
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
  });
}

export function useInvoiceDetail(doku: string | null) {
  return useQuery<{ data: InvoiceDetail; eTag: string }>({
    queryKey: ["invoices", doku],
    queryFn: async () => {
      if (!doku) throw new Error("Doku is required");
      const res = await api.get(`/api/invoices/${encodeURIComponent(doku)}`);
      if (!res.ok) throw new Error("Failed to fetch invoice");
      const data: InvoiceDetail = await res.json();
      const eTag = extractETag(res) ?? data.eTag;
      return { data, eTag };
    },
    enabled: !!doku,
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      doku: string;
      sts: string;
      keterangan: string | null;
      eTag: string;
    }) => {
      const res = await api.put(
        `/api/invoices/${encodeURIComponent(payload.doku)}`,
        {
          doku: payload.doku,
          sts: payload.sts,
          keterangan: payload.keterangan,
          eTag: payload.eTag,
        },
        { ifMatch: payload.eTag },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw Object.assign(
          new Error(err?.error ?? err?.detail ?? "Failed to update invoice"),
          { status: res.status },
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice updated");
    },
    onError: (error: Error & { status?: number }) => toast.error(error.message),
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ doku, eTag }: { doku: string; eTag: string }) => {
      const res = await api.del(`/api/invoices/${encodeURIComponent(doku)}`, { ifMatch: eTag });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw Object.assign(new Error(err?.error ?? err?.detail ?? "Failed to delete invoice"), {
          status: res.status,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted");
    },
    onError: (error: Error & { status?: number }) => toast.error(error.message),
  });
}
