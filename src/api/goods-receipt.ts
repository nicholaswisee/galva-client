import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GRDetail, GRListItem } from "@/types";
import { toast } from "sonner";

function extractETag(res: Response): string | null {
  const etag = res.headers.get("ETag");
  if (!etag) return null;
  return etag.replace(/^W\//, "").replace(/^"|"$/g, "");
}

export function useGoodsReceiptList() {
  return useQuery<GRListItem[]>({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const res = await api.get("/api/goods-receipts");
      if (!res.ok) throw new Error("Failed to fetch goods receipts");
      return res.json();
    },
  });
}

export function useGoodsReceiptDetail(doku: string | null) {
  return useQuery<{ data: GRDetail; eTag: string }>({
    queryKey: ["goods-receipts", doku],
    queryFn: async () => {
      if (!doku) throw new Error("Doku is required");
      const res = await api.get(`/api/goods-receipts/${encodeURIComponent(doku)}`);
      if (!res.ok) throw new Error("Failed to fetch goods receipt");
      const data: GRDetail = await res.json();
      const eTag = extractETag(res) ?? data.eTag;
      return { data, eTag };
    },
    enabled: !!doku,
  });
}

export function useUpdateGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      doku: string;
      sts: string;
      status: string;
      memo: string | null;
      ppn: number | null;
      eTag: string;
    }) => {
      const res = await api.put(
        `/api/goods-receipts/${encodeURIComponent(payload.doku)}`,
        {
          doku: payload.doku,
          sts: payload.sts,
          status: payload.status,
          memo: payload.memo,
          ppn: payload.ppn,
          eTag: payload.eTag,
        },
        { ifMatch: payload.eTag },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw Object.assign(
          new Error(err?.error ?? err?.detail ?? "Failed to update goods receipt"),
          { status: res.status },
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      toast.success("Goods receipt updated");
    },
    onError: (error: Error & { status?: number }) => toast.error(error.message),
  });
}

export function useDeleteGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ doku, eTag }: { doku: string; eTag: string }) => {
      const res = await api.del(`/api/goods-receipts/${encodeURIComponent(doku)}`, { ifMatch: eTag });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw Object.assign(new Error(err?.error ?? err?.detail ?? "Failed to delete goods receipt"), {
          status: res.status,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      toast.success("Goods receipt deleted");
    },
    onError: (error: Error & { status?: number }) => toast.error(error.message),
  });
}
