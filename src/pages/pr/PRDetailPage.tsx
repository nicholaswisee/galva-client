import { Link, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function PRDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">PR {id}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Purchase Requisition Details</p>
        </div>
        <Link to="/purchase-requisitions">
          <Button variant="outline">Back to List</Button>
        </Link>
      </div>
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          PR details will be displayed here once the detail view is implemented.
        </p>
      </div>
    </div>
  );
}
