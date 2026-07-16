import { useState, useMemo } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Package,
  LogOut,
  Menu,
  X,
  BookOpen,
  ChevronRight,
  FolderKanban,
  Warehouse,
  Factory,
  CreditCard,
  LandmarkIcon,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const MODULE_KEY = "galva_active_module";

type ModuleId = "ap" | "project" | "inventory" | "ar" | "ppic" | "banking";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  match: (path: string) => boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const moduleLabels: Record<ModuleId, string> = {
  ap: "Accounts Payable",
  project: "Project",
  inventory: "Inventory",
  ar: "Account Receivable",
  ppic: "PPIC",
  banking: "Banking",
};

const apSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/ap", match: (p) => p === "/ap" },
    ],
  },
  {
    title: "Procurement",
    items: [
      { label: "Purchase Requisitions", icon: FileText, to: "/pr", match: (p) => p.startsWith("/pr") },
      { label: "Purchase Orders", icon: ShoppingCart, to: "/po", match: (p) => p.startsWith("/po") && !p.startsWith("/po-confirm") },
      { label: "PO Confirmation", icon: CheckCircle, to: "/po-confirm", match: (p) => p.startsWith("/po-confirm") },
      { label: "Goods Receipts", icon: Package, to: "/gr", match: (p) => p.startsWith("/gr") },
    ],
  },
  {
    title: "Accounts Payable",
    items: [
      { label: "Invoices", icon: FileText, to: "/invoices", match: (p) => p.startsWith("/invoices") },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "Master Data", icon: BookOpen, to: "/md", match: (p) => p.startsWith("/md") },
    ],
  },
];

const projectSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/project", match: (p) => p === "/project" },
    ],
  },
  {
    title: "Project",
    items: [
      { label: "Project", icon: FolderKanban, to: "/project", match: (p) => p.startsWith("/project") },
    ],
  },
];

const inventorySections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/inv", match: (p) => p === "/inv" },
    ],
  },
  {
    title: "Inventory",
    items: [
      { label: "Inventory", icon: Warehouse, to: "/inv", match: (p) => p.startsWith("/inv") },
    ],
  },
];

const arSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/ar", match: (p) => p === "/ar" },
    ],
  },
  {
    title: "Account Receivable",
    items: [
      { label: "Account Receivable", icon: CreditCard, to: "/ar", match: (p) => p.startsWith("/ar") },
    ],
  },
];

const ppicSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/ppic", match: (p) => p === "/ppic" },
    ],
  },
  {
    title: "PPIC",
    items: [
      { label: "PPIC", icon: Factory, to: "/ppic", match: (p) => p.startsWith("/ppic") },
    ],
  },
];

const bankingSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/bank", match: (p) => p === "/bank" },
    ],
  },
  {
    title: "Banking",
    items: [
      { label: "Banking", icon: LandmarkIcon, to: "/bank", match: (p) => p.startsWith("/bank") },
    ],
  },
];

function getActiveModuleFromPath(path: string): ModuleId | null {
  if (path.startsWith("/pr") || path.startsWith("/po") || path.startsWith("/gr") || path.startsWith("/ap") || path.startsWith("/po-confirm") || path.startsWith("/md") || path.startsWith("/invoices")) return "ap";
  if (path.startsWith("/project")) return "project";
  if (path.startsWith("/inv")) return "inventory";
  if (path.startsWith("/ar")) return "ar";
  if (path.startsWith("/ppic")) return "ppic";
  if (path.startsWith("/bank")) return "banking";
  return null;
}

function getNavSections(module: ModuleId | null): NavSection[] {
  switch (module) {
    case "ap": return apSections;
    case "project": return projectSections;
    case "inventory": return inventorySections;
    case "ar": return arSections;
    case "ppic": return ppicSections;
    case "banking": return bankingSections;
    default: return [];
  }
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem(MODULE_KEY);
    navigate({ to: "/in", search: { redirect: undefined } });
  };

  const currentPath = location.pathname;
  const activeModule = currentPath === "/" ? null : (getActiveModuleFromPath(currentPath) || (localStorage.getItem(MODULE_KEY) as ModuleId | null));
  const navSections = useMemo(() => getNavSections(activeModule), [activeModule]);

  const handleSwitchModule = () => {
    navigate({ to: "/" });
  };

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r bg-muted/30 transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <img src="/galva.png" alt="Galva ERP" className="h-6 w-auto" />
            <span className="text-base font-semibold tracking-tight">Galva ERP</span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="size-4" />
          </button>
        </div>

        {activeModule && (
          <div className="border-b px-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {moduleLabels[activeModule]}
              </span>
              <button
                onClick={handleSwitchModule}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ArrowLeft className="size-3" />
                Modules
              </button>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-3">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              <h3 className="mb-1 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </h3>
              {section.items.map((item) => {
                const active = item.match(currentPath);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-l-2 border-primary bg-primary/10 text-primary"
                        : "border-l-2 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                    {active && <ChevronRight className="ml-auto size-3.5" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b px-4 lg:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            Galva ERP
          </span>
          {activeModule && (
            <span className="text-xs text-muted-foreground">
              {moduleLabels[activeModule]}
            </span>
          )}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground">admin</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
