import { useNavigate } from "@tanstack/react-router";
import {
  Receipt,
  FolderKanban,
  Warehouse,
  CreditCard,
  Factory,
  Landmark,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const MODULE_KEY = "galva_active_module";

type ModuleId = "ap" | "project" | "inventory" | "ar" | "ppic" | "banking";

const modules: {
  id: ModuleId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}[] = [
  {
    id: "ap",
    label: "Accounts Payable",
    description: "Procurement, goods receipt, and AP invoice management",
    icon: Receipt,
    to: "/ap",
  },
  {
    id: "project",
    label: "Project",
    description: "Project management and tracking",
    icon: FolderKanban,
    to: "/project",
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Inventory and stock management",
    icon: Warehouse,
    to: "/inv",
  },
  {
    id: "ar",
    label: "Account Receivable",
    description: "Customer invoices and receivables",
    icon: CreditCard,
    to: "/ar",
  },
  {
    id: "ppic",
    label: "PPIC",
    description: "Production planning and inventory control",
    icon: Factory,
    to: "/ppic",
  },
  {
    id: "banking",
    label: "Banking",
    description: "Bank transactions and reconciliation",
    icon: Landmark,
    to: "/bank",
  },
];

export function DashboardPage() {
  const navigate = useNavigate();

  const handleSelect = (module: (typeof modules)[number]) => {
    localStorage.setItem(MODULE_KEY, module.id);
    navigate({ to: module.to });
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Galva ERP</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a module to get started
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Card
              key={module.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => handleSelect(module)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{module.label}</CardTitle>
                    <CardDescription className="text-xs">
                      {module.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-muted-foreground">
                  Click to open {module.label}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
