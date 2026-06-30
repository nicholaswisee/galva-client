import { Construction } from "lucide-react";

export function ProjectPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <Construction className="mb-4 size-12 text-muted-foreground/50" />
      <h1 className="text-xl font-semibold">Project</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Project management module — coming soon. This section will handle project budgeting, tracking, and cost allocation.
      </p>
    </div>
  );
}
