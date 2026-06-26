import { useVendors, useDepartments, useInventory, useWarehouses, useBanks } from "@/lib/use-master-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MasterDataPage() {
  const { data: vendors, isLoading: vLoading } = useVendors();
  const { data: departments, isLoading: dLoading } = useDepartments();
  const { data: inventory, isLoading: iLoading } = useInventory();
  const { data: warehouses, isLoading: wLoading } = useWarehouses();
  const { data: banks, isLoading: bLoading } = useBanks();

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Master Data</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reference data used across all modules</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Suppliers ({vendors?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama</TableHead><TableHead>MTU</TableHead></TableRow></TableHeader>
              <TableBody>
                {vLoading ? <TableRow><TableCell colSpan={3}><Skeleton className="h-5 w-full" /></TableCell></TableRow> :
                  vendors?.map((v) => (
                    <TableRow key={v.kode}>
                      <TableCell className="font-medium text-sm">{v.kode}</TableCell>
                      <TableCell className="text-sm">{v.nama}</TableCell>
                      <TableCell className="text-sm">{v.mtu ?? "-"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Departments ({departments?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama</TableHead></TableRow></TableHeader>
              <TableBody>
                {dLoading ? <TableRow><TableCell colSpan={2}><Skeleton className="h-5 w-full" /></TableCell></TableRow> :
                  departments?.map((d) => (
                    <TableRow key={d.kode}>
                      <TableCell className="font-medium text-sm">{d.kode}</TableCell>
                      <TableCell className="text-sm">{d.nama}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Inventory Items ({inventory?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama</TableHead></TableRow></TableHeader>
              <TableBody>
                {iLoading ? <TableRow><TableCell colSpan={2}><Skeleton className="h-5 w-full" /></TableCell></TableRow> :
                  inventory?.map((i) => (
                    <TableRow key={i.kode}>
                      <TableCell className="font-medium text-sm">{i.kode}</TableCell>
                      <TableCell className="text-sm">{i.nama}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Warehouses ({warehouses?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama</TableHead></TableRow></TableHeader>
              <TableBody>
                {wLoading ? <TableRow><TableCell colSpan={2}><Skeleton className="h-5 w-full" /></TableCell></TableRow> :
                  warehouses?.map((w) => (
                    <TableRow key={w.kode}>
                      <TableCell className="font-medium text-sm">{w.kode}</TableCell>
                      <TableCell className="text-sm">{w.nama}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Banks ({banks?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama</TableHead></TableRow></TableHeader>
              <TableBody>
                {bLoading ? <TableRow><TableCell colSpan={2}><Skeleton className="h-5 w-full" /></TableCell></TableRow> :
                  banks?.map((b) => (
                    <TableRow key={b.kode}>
                      <TableCell className="font-medium text-sm">{b.kode}</TableCell>
                      <TableCell className="text-sm">{b.nama}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
