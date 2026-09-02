import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { useReturnDetail, useUpdateReturn, useDeleteReturn } from "@/api/return";
import type { ReturnLineItem } from "@/types";

function formatDate(iso?: string | null) {
  return iso ? iso.split("T")[0] : "-";
}

export function ReturnDetailPage() {
  const { doku } = useParams({ strict: false }) as { doku: string };
  const navigate = useNavigate();
  const { data: detail, isLoading, refetch } = useReturnDetail(doku);
  const updateReturn = useUpdateReturn();
  const deleteReturn = useDeleteReturn();
  const [isEditing, setIsEditing] = useState(false);
  const [memo, setMemo] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const ret = detail?.data;
  const eTag = detail?.eTag ?? "";

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!ret) {
    return (
      <div className="p-4 lg:p-6">
        <Button variant="outline" onClick={() => navigate({ to: "/returns" })}>
          <ArrowLeft className="mr-1.5 size-4" />Back
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">Return not found.</p>
      </div>
    );
  }

  const handleSave = () => {
    if (!eTag) return;
    updateReturn.mutate(
      {
        doku: ret.doku,
        sts: ret.sts,
        memo,
        validasi: ret.validasi,
        statusGL: ret.statusGL,
        eTag,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("Return updated");
          refetch();
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update return");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!eTag) return;
    deleteReturn.mutate(
      { doku: ret.doku, eTag },
      {
        onSuccess: () => {
          toast.success("Return deleted");
          navigate({ to: "/returns" });
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to delete return");
        },
      }
    );
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: "/returns" })}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{ret.doku}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Vendor Return</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={updateReturn.isPending}>
                <Save className="mr-1.5 size-4" />Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                <X className="mr-1.5 size-4" />Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => { setMemo(ret.memo ?? ""); setIsEditing(true); }}>
              <Pencil className="mr-1.5 size-4" />Edit
            </Button>
          )}
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setShowDelete(true)}>
            <Trash2 className="mr-1.5 size-4" />Delete
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
          <CardContent>
            <StatusBadge status={ret.sts ?? "0"} />
            <p className="mt-2 text-xs text-muted-foreground">Sync: {ret.syncToCMG ? "Synced" : "Not synced"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Source Invoice</CardTitle></CardHeader>
          <CardContent>
            <p className="font-medium">{ret.doku_Faktur ?? "-"}</p>
            <p className="text-sm text-muted-foreground">Date: {formatDate(ret.tgl)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Total Value</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-semibold tabular-nums">{ret.nilai.toLocaleString("id-ID")}</p>
            <p className="text-sm text-muted-foreground">{ret.kode_Valas ?? "IDR"}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Notes</label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={4}
              />
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm">{ret.memo || "No notes"}</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Return Lines</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Item</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-[80px]">Alias</TableHead>
                  <TableHead className="w-[80px]">Qty</TableHead>
                  <TableHead className="w-[100px]">Price</TableHead>
                  <TableHead className="w-[70px]">Disc</TableHead>
                  <TableHead className="w-[70px]">PPN</TableHead>
                  <TableHead className="w-[100px]">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ret.lineItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                      No lines found.
                    </TableCell>
                  </TableRow>
                ) : (
                  ret.lineItems.map((line: ReturnLineItem, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="text-sm">{idx + 1}</TableCell>
                      <TableCell className="text-sm">{line.kode_Brg ?? "-"}</TableCell>
                      <TableCell className="text-sm">{line.alias ?? "-"}</TableCell>
                      <TableCell className="text-sm">{line.jumlah}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{line.harga.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right text-sm">{line.diskon}</TableCell>
                      <TableCell className="text-right text-sm">{line.ppn}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{line.nilai.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete vendor return?"
        description={`This will permanently remove ${ret.doku}. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteReturn.isPending}
      />
    </div>
  );
}
