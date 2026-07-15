import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GRListPage } from "./GRListPage";

type TabValue = "receipts";

const DEFAULT_TAB: TabValue = "receipts";

function isTabValue(value: string | undefined): value is TabValue {
  return value === "receipts";
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
        <h1 className="text-2xl font-semibold tracking-tight">Goods Receipts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Receive goods against PO confirmations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 sm:w-fit sm:inline-flex">
          <TabsTrigger value="receipts" className="gap-1.5">
            <Package className="hidden size-4 sm:inline" />
            Goods Receipts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receipts" className="m-0">
          <GRListPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
