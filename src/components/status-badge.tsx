import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label?: string }> = {
  "0": { variant: "outline", label: "Pending" },
  "1": { variant: "default", label: "Confirmed" },
  "2": { variant: "destructive", label: "Cancelled" },
  Pending: { variant: "outline" },
  Confirmed: { variant: "default" },
  Cancelled: { variant: "destructive" },
  Approved: { variant: "default" },
  RCVD: { variant: "secondary", label: "Received" },
  Received: { variant: "secondary" },
  Open: { variant: "outline" },
  "Partially Paid": { variant: "secondary" },
  Paid: { variant: "default" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { variant: "outline" };
  return <Badge variant={config.variant}>{config.label ?? status}</Badge>;
}
