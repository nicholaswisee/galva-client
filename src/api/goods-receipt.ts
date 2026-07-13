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
