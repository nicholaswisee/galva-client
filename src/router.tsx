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
import { GRListPage } from "./pages/gr/GRListPage";
import { GRCreatePage } from "./pages/gr/GRCreatePage";
import { InvoiceListPage } from "./pages/invoice/InvoiceListPage";
import { InvoiceCreatePage } from "./pages/invoice/InvoiceCreatePage";
import { MasterDataPage } from "./pages/MasterDataPage";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { location } = useRouterState();
  if (!isAuthenticated) {
    return <Navigate to="/login" search={{ redirect: location.href }} />;
  }
  return <>{children}</>;
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
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
  path: "/purchase-requisitions",
  component: PRListPage,
});

const prCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/purchase-requisitions/new",
  component: PRCreatePage,
});

const prDetailRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/purchase-requisitions/$id",
  component: PRDetailPage,
});

const poListRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/purchase-orders",
  component: POListPage,
});

const poCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/purchase-orders/new",
  component: POCreatePage,
});

const grListRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/goods-receipts",
  component: GRListPage,
});

const grCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/goods-receipts/new",
  component: GRCreatePage,
});

const invoiceListRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/invoices",
  component: InvoiceListPage,
});

const invoiceCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/invoices/new",
  component: InvoiceCreatePage,
});

const masterDataRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/master-data",
  component: MasterDataPage,
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
    grListRoute,
    grCreateRoute,
    invoiceListRoute,
    invoiceCreateRoute,
    masterDataRoute,
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
