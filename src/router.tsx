import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Navigate,
  useRouterState,
} from "@tanstack/react-router";
import { useAuth } from "./lib/auth";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PRListPage } from "./pages/pr/PRListPage";
import { PRCreatePage } from "./pages/pr/PRCreatePage";
import { PRDetailPage } from "./pages/pr/PRDetailPage";
import { POListPage } from "./pages/po/POListPage";
import { POCreatePage } from "./pages/po/POCreatePage";
import { PODetailPage } from "./pages/po/PODetailPage";
import { GRListPage } from "./pages/gr/GRListPage";
import { GRCreatePage } from "./pages/gr/GRCreatePage";
import { GRDetailPage } from "./pages/gr/GRDetailPage";
import { InvoiceListPage } from "./pages/invoice/InvoiceListPage";
import { InvoiceCreatePage } from "./pages/invoice/InvoiceCreatePage";
import { InvoiceDetailPage } from "./pages/invoice/InvoiceDetailPage";
import { POConfirmPage } from "./pages/po-confirm/POConfirmPage";
import { InvoicePOCreatePage } from "./pages/invoice-po/InvoicePOCreatePage";
import { VoucherAPCreatePage } from "./pages/voucher/VoucherAPCreatePage";
import { MasterDataPage } from "./pages/MasterDataPage";
import { ProjectPage } from "./pages/placeholder/ProjectPage";
import { InventoryPage } from "./pages/placeholder/InventoryPage";
import { AccountReceivablePage } from "./pages/placeholder/AccountReceivablePage";
import { PPICPage } from "./pages/placeholder/PPICPage";
import { BankingPage } from "./pages/placeholder/BankingPage";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { location } = useRouterState();
  // Wait for the silent refresh to complete before deciding auth state.
  // Without this, the guard would redirect to /in immediately because
  // the access token hasn't been restored yet.
  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/in" search={{ redirect: location.pathname }} />;
  }
  return <>{children}</>;
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/in",
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: search.redirect as string | undefined,
  }),
});

const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "dashboard",
  component: () => (
    <AuthGuard>
      <DashboardLayout />
    </AuthGuard>
  ),
});

const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/",
  component: DashboardPage,
});

const prListRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/pr",
  component: PRListPage,
});

const prCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/pr/new",
  component: PRCreatePage,
});

const prDetailRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/pr/$id",
  component: PRDetailPage,
});

const poListRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/po",
  component: POListPage,
});

const poCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/po/new",
  component: POCreatePage,
});

const poDetailRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/po/$id",
  component: PODetailPage,
});

const grListRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/gr",
  component: GRListPage,
});

const grCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/gr/new",
  component: GRCreatePage,
});

const grDetailRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/gr/$id",
  component: GRDetailPage,
});

const invoiceListRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/ap",
  component: InvoiceListPage,
});

const invoiceCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/ap/new",
  component: InvoiceCreatePage,
});

const invoiceDetailRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/ap/$id",
  component: InvoiceDetailPage,
});

const poConfirmRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/po-confirm",
  component: POConfirmPage,
});

const invoicePOCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/ap/po-based/new",
  component: InvoicePOCreatePage,
});

const voucherAPCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/ap/voucher/new",
  component: VoucherAPCreatePage,
});

const masterDataRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/md",
  component: MasterDataPage,
});

const projectRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/project",
  component: ProjectPage,
});

const inventoryRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/inv",
  component: InventoryPage,
});

const arRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/ar",
  component: AccountReceivablePage,
});

const ppicRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/ppic",
  component: PPICPage,
});

const bankingRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/bank",
  component: BankingPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardLayoutRoute.addChildren([
    dashboardIndexRoute,
    prListRoute,
    prCreateRoute,
    prDetailRoute,
    poListRoute,
    poCreateRoute,
    poDetailRoute,
    grListRoute,
    grCreateRoute,
    grDetailRoute,
    invoiceListRoute,
    invoiceCreateRoute,
    invoiceDetailRoute,
    poConfirmRoute,
    invoicePOCreateRoute,
    voucherAPCreateRoute,
    masterDataRoute,
    projectRoute,
    inventoryRoute,
    arRoute,
    ppicRoute,
    bankingRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
