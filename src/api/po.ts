import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PODetail, POListItem } from "@/types";
import { toast } from "sonner";

function extractETag(res: Response): string | null {
  const etag = res.headers.get("ETag");
  if (!etag) return null;
  return etag.replace(/^W\//, "").replace(/^"|"$/g, "");
}

export function usePOList() {
  return useQuery<POListItem[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/api/purchase-orders");
      if (!res.ok) throw new Error("Failed to fetch purchase orders");
      return res.json();
    },
  });
}

export function usePODetail(doku: string | null) {
  return useQuery<{ data: PODetail; eTag: string }>({
    queryKey: ["purchase-orders", doku],
    queryFn: async () => {
      if (!doku) throw new Error("Doku is required");
      const res = await api.get(`/api/purchase-orders/${encodeURIComponent(doku)}`);
      if (!res.ok) throw new Error("Failed to fetch purchase order");
      const data: PODetail = await res.json();
      const eTag = extractETag(res) ?? data.eTag;
      return { data, eTag };
    },
    enabled: !!doku,
  });
}

interface CreatePOBody {
  doku?: string | null;
  kode_Supplier: string;
  kode_dept: string;
  tgl: string;
  kode_Valas: string;
  kurs: number;
  syarat: number;
  ppn: number;
  diskon: number;
  dppNilaiLain: number;
  ppnTunai: number;
  memo?: string | null;
  lineItems: unknown[];
}

type UpdatePOBody = CreatePOBody;

export function useCreatePO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreatePOBody) => {
      const res = await api.post("/api/purchase-orders", body);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? err?.detail ?? "Failed to create PO");
      }
      return res.json() as Promise<{ doku: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdatePO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ doku, eTag, body }: { doku: string; eTag: string; body: UpdatePOBody }) => {
      const res = await api.put(`/api/purchase-orders/${encodeURIComponent(doku)}`, body, { ifMatch: eTag });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw Object.assign(new Error(err?.error ?? err?.detail ?? "Failed to update PO"), {
          status: res.status,
        });
      }
      const data: PODetail = await res.json();
      const newETag = extractETag(res) ?? data.eTag;
      return { data, eTag: newETag };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", variables.doku] });
      toast.success("Purchase order updated");
    },
    onError: (error: Error & { status?: number }) => toast.error(error.message),
  });
}

export function useDeletePO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ doku, eTag }: { doku: string; eTag: string }) => {
      const res = await api.del(`/api/purchase-orders/${encodeURIComponent(doku)}`, { ifMatch: eTag });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw Object.assign(new Error(err?.error ?? err?.detail ?? "Failed to delete PO"), {
          status: res.status,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order deleted");
    },
    onError: (error: Error & { status?: number }) => toast.error(error.message),
  });
}
