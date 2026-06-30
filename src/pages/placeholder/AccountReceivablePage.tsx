import { Construction } from "lucide-react";

export function AccountReceivablePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <Construction className="mb-4 size-12 text-muted-foreground/50" />
      <h1 className="text-xl font-semibold">Account Receivable</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        AR management module — coming soon. This section will handle customer invoices, collections, and aging reports.
      </p>
    </div>
  );
}
