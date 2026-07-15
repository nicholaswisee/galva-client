import { useNavigate, useRouterState } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoiceListPage } from "./InvoiceListPage";

type TabValue = "lpb" | "po";

const DEFAULT_TAB: TabValue = "lpb";

function isTabValue(value: string | undefined): value is TabValue {
  return value === "lpb" || value === "po";
}

export function InvoicesShellPage() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const search = new URLSearchParams(location.search);
  const activeTab: TabValue = isTabValue(search.get("tab") ?? undefined)
    ? (search.get("tab") as TabValue)
    : DEFAULT_TAB;

  const setTab = (value: string) => {
    if (!isTabValue(value)) return;
    navigate({
      to: "/invoices",
      search: { tab: value },
      replace: true,
    });
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AP Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage AP invoices linked to goods receipts or purchase orders
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-fit sm:inline-flex">
          <TabsTrigger value="lpb" className="gap-1.5">
            <FileText className="hidden size-4 sm:inline" />
            Based on GR (LPB)
          </TabsTrigger>
          <TabsTrigger value="po" className="gap-1.5">
            <FileText className="hidden size-4 sm:inline" />
            Based on PO Confirm
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lpb" className="m-0">
          <InvoiceListPage tipeBiaya="LPB" />
        </TabsContent>
        <TabsContent value="po" className="m-0">
          <InvoiceListPage tipeBiaya="PO" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
