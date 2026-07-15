import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Navigate,
  useParams,
} from "@tanstack/react-router";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PRListPage } from "./pages/pr/PRListPage";
import { PRCreatePage } from "./pages/pr/PRCreatePage";
import { PRDetailPage } from "./pages/pr/PRDetailPage";
import { POListPage } from "./pages/po/POListPage";
import { PONewPage } from "./pages/po/PONewPage";
import { POEditPage } from "./pages/po/POEditPage";
import { POPrintPage } from "./pages/po/POPrintPage";
import { GoodsReceiptsShellPage } from "./pages/gr/GoodsReceiptsShellPage";
import { GRCreatePage } from "./pages/gr/GRCreatePage";
import { GRDetailPage } from "./pages/gr/GRDetailPage";
import { InvoiceCreatePage } from "./pages/invoice/InvoiceCreatePage";
import { InvoiceDetailPage } from "./pages/invoice/InvoiceDetailPage";
import { InvoicesShellPage } from "./pages/invoice/InvoicesShellPage";
import { POConfirmListPage } from "./pages/po-confirm/POConfirmListPage";
import { POConfirmNewPage } from "./pages/po-confirm/POConfirmNewPage";
import { POConfirmEditPage } from "./pages/po-confirm/POConfirmEditPage";
import { POConfirmPrintPage } from "./pages/po-confirm/POConfirmPrintPage";
import { InvoicePOCreatePage } from "./pages/invoice-po/InvoicePOCreatePage";
import { LegacyInvoiceDetailRedirect } from "./pages/invoice/LegacyInvoiceDetailRedirect";
import { VoucherAPCreatePage } from "./pages/voucher/VoucherAPCreatePage";
import { MasterDataPage } from "./pages/MasterDataPage";
import { AuthGuard } from "./components/auth/AuthGuard";
import { ProjectPage } from "./pages/placeholder/ProjectPage";
import { InventoryPage } from "./pages/placeholder/InventoryPage";
import { AccountReceivablePage } from "./pages/placeholder/AccountReceivablePage";
import { PPICPage } from "./pages/placeholder/PPICPage";
import { BankingPage } from "./pages/placeholder/BankingPage";

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
  component: PONewPage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "new" ? "new" : "new",
  }),
});

const poDetailRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/po/$id",
  component: POEditPage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "edit" || search.mode === "print" ? search.mode : "edit",
  }),
});

const poPrintRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/po/$id/print",
  component: POPrintPage,
});

const grListRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/gr",
  component: GoodsReceiptsShellPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
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

const invoicesListRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/invoices",
  component: InvoicesShellPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
});

const invoicesCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/invoices/new",
  component: InvoiceCreatePage,
});

const invoicesDetailRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/invoices/$id",
  component: InvoiceDetailPage,
});

const invoicesPOCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/invoices/po-based/new",
  component: InvoicePOCreatePage,
});

const grInvoiceCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/gr/invoices/new",
  component: () => <Navigate to="/invoices/new" />,
});

function GrInvoiceDetailRedirect() {
  const { id } = useParams({ strict: false }) as { id: string };
  return <Navigate to="/invoices/$id" params={{ id }} />;
}

const grInvoiceDetailRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/gr/invoices/$id",
  component: GrInvoiceDetailRedirect,
});

const grInvoicePOCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/gr/invoices/po-based/new",
  component: () => <Navigate to="/invoices/po-based/new" />,
});

const legacyInvoiceListRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/ap",
  component: () => <Navigate to="/invoices" search={{ tab: "lpb" }} />,
});

const legacyInvoiceCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/ap/new",
  component: () => <Navigate to="/invoices/new" />,
});

const legacyInvoiceDetailRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/ap/$id",
  component: LegacyInvoiceDetailRedirect,
});

const poConfirmRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/po-confirm",
  component: POConfirmListPage,
});

const poConfirmNewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/po-confirm/new",
  component: POConfirmNewPage,
});

const poConfirmDetailRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/po-confirm/$id",
  component: POConfirmEditPage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "edit" || search.mode === "print" ? search.mode : "edit",
  }),
});

const poConfirmPrintRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/po-confirm/$id/print",
  component: POConfirmPrintPage,
});

const legacyInvoicePOCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/ap/po-based/new",
  component: () => <Navigate to="/invoices/po-based/new" />,
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
    poPrintRoute,
    grListRoute,
    grCreateRoute,
    grDetailRoute,
    invoicesListRoute,
    invoicesCreateRoute,
    invoicesDetailRoute,
    invoicesPOCreateRoute,
    grInvoiceCreateRoute,
    grInvoiceDetailRoute,
    grInvoicePOCreateRoute,
    legacyInvoiceListRoute,
    legacyInvoiceCreateRoute,
    legacyInvoiceDetailRoute,
    legacyInvoicePOCreateRoute,
    poConfirmRoute,
    poConfirmNewRoute,
    poConfirmDetailRoute,
    poConfirmPrintRoute,
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
