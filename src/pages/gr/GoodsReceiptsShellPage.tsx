import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Package, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GRListPage } from "./GRListPage";
import { InvoiceListPage } from "../invoice/InvoiceListPage";

type TabValue = "receipts" | "invoices-gr" | "invoices-po";

const DEFAULT_TAB: TabValue = "receipts";

function isTabValue(value: string | undefined): value is TabValue {
  return value === "receipts" || value === "invoices-gr" || value === "invoices-po";
}

export function GoodsReceiptsShellPage() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const search = new URLSearchParams(location.search);
  const activeTab: TabValue = isTabValue(search.get("tab") ?? undefined)
    ? (search.get("tab") as TabValue)
    : DEFAULT_TAB;

  const setTab = (value: string) => {
    if (!isTabValue(value)) return;
    navigate({
      to: "/gr",
      search: { tab: value },
      replace: true,
    });
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Goods Receipts & Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Receive goods and manage AP invoices in one place
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:w-fit sm:inline-flex">
          <TabsTrigger value="receipts" className="gap-1.5">
            <Package className="hidden size-4 sm:inline" />
            Goods Receipts
          </TabsTrigger>
          <TabsTrigger value="invoices-gr" className="gap-1.5">
            <FileText className="hidden size-4 sm:inline" />
            Invoices (Based on GR)
          </TabsTrigger>
          <TabsTrigger value="invoices-po" className="gap-1.5">
            <FileText className="hidden size-4 sm:inline" />
            Invoices (Based on PO Confirm)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receipts" className="m-0">
          <GRListPage />
        </TabsContent>
        <TabsContent value="invoices-gr" className="m-0">
          <InvoiceListPage source="GR" />
        </TabsContent>
        <TabsContent value="invoices-po" className="m-0">
          <InvoiceListPage source="POConfirm" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
