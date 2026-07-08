import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { POConfirmationDetail, POConfirmationListItem } from "@/types";
import { toast } from "sonner";

function extractETag(res: Response): string | null {
  const etag = res.headers.get("ETag");
  if (!etag) return null;
  return etag.replace(/^W\//, "").replace(/^"|"$/g, "");
}

export function usePOConfirmationList() {
  return useQuery<POConfirmationListItem[]>({
    queryKey: ["po-confirmations"],
    queryFn: async () => {
      const res = await api.get("/api/po-confirmations");
      if (!res.ok) throw new Error("Failed to fetch PO confirmations");
      return res.json();
    },
  });
}

export function usePOConfirmationDetail(doku: string | null) {
  return useQuery<{ data: POConfirmationDetail; eTag: string }>({
    queryKey: ["po-confirmations", doku],
    queryFn: async () => {
      if (!doku) throw new Error("Doku is required");
      const res = await api.get(`/api/po-confirmations/${encodeURIComponent(doku)}`);
      if (!res.ok) throw new Error("Failed to fetch PO confirmation");
      const data: POConfirmationDetail = await res.json();
      const eTag = extractETag(res) ?? data.eTag;
      return { data, eTag };
    },
    enabled: !!doku,
  });
}

interface POConfirmationLineBody {
  id_sub_po: number;
  kode_Brg: string;
  jumlah: number;
  harga: number;
  total: number;
  kode_Gudang?: string | null;
  note?: string | null;
}

interface CreatePOConfirmBody {
  doku?: string | null;
  doku_PO: string;
  tgl: string;
  contactPr?: string | null;
  psd?: string | null;
  etd?: string | null;
  memo?: string | null;
  lineItems: POConfirmationLineBody[];
}

type UpdatePOConfirmBody = CreatePOConfirmBody;

export function useCreatePOConfirmation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreatePOConfirmBody) => {
      const res = await api.post("/api/po-confirmations", body);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? err?.detail ?? "Failed to create PO confirmation");
      }
      return res.json() as Promise<POConfirmationDetail>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["po-confirmations"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("PO confirmation created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdatePOConfirmation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ doku, eTag, body }: { doku: string; eTag: string; body: UpdatePOConfirmBody }) => {
      const res = await api.put(`/api/po-confirmations/${encodeURIComponent(doku)}`, body, { ifMatch: eTag });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw Object.assign(new Error(err?.error ?? err?.detail ?? "Failed to update PO confirmation"), {
          status: res.status,
        });
      }
      const data: POConfirmationDetail = await res.json();
      const newETag = extractETag(res) ?? data.eTag;
      return { data, eTag: newETag };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["po-confirmations"] });
      queryClient.invalidateQueries({ queryKey: ["po-confirmations", variables.doku] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("PO confirmation updated");
    },
    onError: (error: Error & { status?: number }) => toast.error(error.message),
  });
}

export function useDeletePOConfirmation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ doku, eTag }: { doku: string; eTag: string }) => {
      const res = await api.del(`/api/po-confirmations/${encodeURIComponent(doku)}`, { ifMatch: eTag });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw Object.assign(new Error(err?.error ?? err?.detail ?? "Failed to delete PO confirmation"), {
          status: res.status,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["po-confirmations"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("PO confirmation deleted");
    },
    onError: (error: Error & { status?: number }) => toast.error(error.message),
  });
}
