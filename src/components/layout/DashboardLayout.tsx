import { useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Package,
  Receipt,
  LogOut,
  Menu,
  X,
  BookOpen,
  ChevronRight,
  FolderKanban,
  Warehouse,
  Landmark,
  Factory,
  CreditCard,
  LandmarkIcon,
  CheckCircle,
  FileSpreadsheet,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

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

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/", match: (p) => p === "/" },
    ],
  },
  {
    title: "Procurement",
    items: [
      { label: "Purchase Requisitions", icon: FileText, to: "/pr", match: (p) => p.startsWith("/pr") },
      { label: "Purchase Orders", icon: ShoppingCart, to: "/po", match: (p) => p.startsWith("/po") },
      { label: "PO Confirmation", icon: CheckCircle, to: "/po-confirm", match: (p) => p.startsWith("/po-confirm") },
      { label: "Goods Receipts", icon: Package, to: "/gr", match: (p) => p.startsWith("/gr") },
    ],
  },
  {
    title: "Account Payable",
    items: [
      { label: "AP Invoices", icon: Receipt, to: "/ap", match: (p) => p.startsWith("/ap") && !p.includes("po-based") && !p.includes("voucher") },
      { label: "Invoice AP (PO)", icon: FileSpreadsheet, to: "/ap/po-based/new", match: (p) => p.startsWith("/ap/po-based") },
      { label: "AP Voucher", icon: Wallet, to: "/ap/voucher/new", match: (p) => p.startsWith("/ap/voucher") },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Project", icon: FolderKanban, to: "/project", match: (p) => p.startsWith("/project") },
      { label: "Inventory", icon: Warehouse, to: "/inv", match: (p) => p.startsWith("/inv") },
      { label: "Account Receivable", icon: CreditCard, to: "/ar", match: (p) => p.startsWith("/ar") },
      { label: "PPIC", icon: Factory, to: "/ppic", match: (p) => p.startsWith("/ppic") },
      { label: "Banking", icon: LandmarkIcon, to: "/bank", match: (p) => p.startsWith("/bank") },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "Master Data", icon: BookOpen, to: "/md", match: (p) => p.startsWith("/md") },
    ],
  },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/in" });
  };

  const currentPath = location.pathname;

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
          <span className="text-base font-semibold tracking-tight">Galva ERP</span>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="size-4" />
          </button>
        </div>

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
