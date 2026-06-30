import { Construction } from "lucide-react";

export function PPICPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <Construction className="mb-4 size-12 text-muted-foreground/50" />
      <h1 className="text-xl font-semibold">PPIC</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Production Planning & Inventory Control — coming soon. This section will handle production orders, MRP, and scheduling.
      </p>
    </div>
  );
}
