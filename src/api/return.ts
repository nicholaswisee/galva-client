import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ReturnDetail,
  ReturnEligibleLine,
  ReturnListItem,
} from "@/types";
import type { ReturnFormInput } from "@/schemas/return";
import { toast } from "sonner";

function extractETag(res: Response): string | null {
  const etag = res.headers.get("ETag");
  if (!etag) return null;
  return etag.replace(/^W\//, "").replace(/^"|"$/g, "");
}

export type ReturnCreatePayload = {
  tgl: string;
  doku_Faktur: string;
  kode_Dept?: string;
  kode_Valas: string;
  kurs: number;
  doku_FP?: string | null;
  tgl_FP?: string | null;
  memo?: string;
  ppn: number;
  type?: string | null;
  tipeRetur?: string | null;
  lineItems: Array<{
    doku_Faktur: string;
    doku_LPB?: string | null;
    npo?: string | null;
    kode_Brg: string;
    kode_Gudang?: string | null;
    jumlah: number;
    diskon: number;
    noUrut: number;
  }>;
};

export function buildCreateReturnPayload(form: ReturnFormInput): ReturnCreatePayload {
  return {
    tgl: new Date(`${form.tgl}T00:00:00Z`).toISOString(),
    doku_Faktur: form.doku_Faktur,
    kode_Dept: form.kode_Dept || undefined,
    kode_Valas: form.kode_Valas === "Rp." ? "Rp." : form.kode_Valas,
    kurs: form.kode_Valas === "Rp." ? 1 : form.kurs,
    memo: form.memo || undefined,
    ppn: form.ppn,
    type: form.type ?? null,
    tipeRetur: form.tipeRetur ?? null,
    // ponytail: server derives price, unit, HPP, per-line VAT, luxury tax, and line
    // value from the source data; the client submits source identifiers, quantity,
    // discount, and header metadata only.
    lineItems: form.lineItems.map((line) => ({
      doku_Faktur: line.doku_Faktur,
      doku_LPB: line.doku_LPB ?? null,
      npo: line.npo ?? null,
      kode_Brg: line.kode_Brg,
      kode_Gudang: line.kode_Gudang ?? null,
      jumlah: line.jumlah,
      diskon: line.diskon,
      noUrut: line.noUrut,
    })),
  };
}

export function useReturnList() {
  return useQuery<ReturnListItem[]>({
    queryKey: ["purchase-returns"],
    queryFn: async () => {
      const res = await api.get("/api/purchase-returns");
      if (!res.ok) throw new Error("Failed to fetch vendor returns");
      return res.json();
    },
  });
}

export function useReturnDetail(doku: string | null) {
  return useQuery<{ data: ReturnDetail; eTag: string }>({
    queryKey: ["purchase-returns", doku],
    queryFn: async () => {
      if (!doku) throw new Error("Doku is required");
      const res = await api.get(`/api/purchase-returns/${encodeURIComponent(doku)}`);
      if (!res.ok) throw new Error("Failed to fetch vendor return");
      const data: ReturnDetail = await res.json();
      const eTag = extractETag(res) ?? data.eTag;
      return { data, eTag };
    },
    enabled: !!doku,
  });
}

export function useReturnEligibleLines(dokuFaktur: string | null) {
  return useQuery<ReturnEligibleLine[]>({
    queryKey: ["purchase-returns", "eligible-lines", dokuFaktur],
    queryFn: async () => {
      if (!dokuFaktur) throw new Error("Source invoice is required");
      const res = await api.get(
        `/api/purchase-returns/eligible-lines?doku_Faktur=${encodeURIComponent(dokuFaktur)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch eligible lines");
      return res.json();
    },
    enabled: !!dokuFaktur,
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReturnCreatePayload) => {
      const res = await api.post("/api/purchase-returns", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw Object.assign(
          new Error(err?.detail ?? err?.error ?? "Failed to create vendor return"),
          { status: res.status },
        );
      }
      return res.json() as Promise<{ doku: string }>;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["master-data", "inventory"] });
      toast.success(`Vendor return ${result.doku} created successfully`);
    },
    onError: (error: Error & { status?: number }) => toast.error(error.message),
  });
}

export type ReturnUpdatePayload = {
  doku: string;
  sts: string;
  memo: string | null;
  validasi: boolean;
  statusGL: string | null;
  eTag: string;
};

export function useUpdateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReturnUpdatePayload) => {
      const res = await api.put(
        `/api/purchase-returns/${encodeURIComponent(payload.doku)}`,
        {
          doku: payload.doku,
          sts: payload.sts,
          memo: payload.memo,
          validasi: payload.validasi,
          statusGL: payload.statusGL,
          // ponytail: UpdateReturnCommand excludes eTag from the body; the
          // RowVersion travels only in the If-Match header below.
        },
        { ifMatch: payload.eTag },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw Object.assign(
          new Error(err?.error ?? err?.detail ?? "Failed to update vendor return"),
          { status: res.status },
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
      toast.success("Vendor return updated");
    },
    onError: (error: Error & { status?: number }) => toast.error(error.message),
  });
}

export function useDeleteReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ doku, eTag }: { doku: string; eTag: string }) => {
      const res = await api.del(`/api/purchase-returns/${encodeURIComponent(doku)}`, {
        ifMatch: eTag,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw Object.assign(
          new Error(err?.error ?? err?.detail ?? "Failed to delete vendor return"),
          { status: res.status },
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
      toast.success("Vendor return deleted");
    },
    onError: (error: Error & { status?: number }) => toast.error(error.message),
  });
}
