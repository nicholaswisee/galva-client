import { useState, type FormEvent, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Trash2,
    Save,
    Printer,
    FilePlus,
    Pencil,
    Trash,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DataSelect } from "@/components/data-select";
import { useVendors, useInventory, useWarehouses } from "@/lib/use-master-data";
import { api } from "@/lib/api";
import { usePOConfirmationList, usePOConfirmationDetail } from "@/api/po-confirm";
import { toast } from "sonner";

interface GRLineItem {
    id_sub_po_confirmation: number;
    kode_Brg: string;
    model: string;
    jumlah: number;
    serialNo: string;
    harga: number;
    discPct: number;
    disc: number;
    nilai: number;
    description: string;
    kode_Gudang: string;
    information: string;
}

export function GRCreatePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: inventory } = useInventory();
    const { data: warehouses } = useWarehouses();
    const { data: vendors } = useVendors();

    const [doku, setDoku] = useState("");
    const [tgl, setTgl] = useState(new Date().toISOString().split("T")[0]);
    const [doku_PCF, setDoku_PCF] = useState("");
    const [doku_PO, setDoku_PO] = useState("");
    const [tgl_PO, setTgl_PO] = useState("");
    const [suratJalan, setSuratJalan] = useState("");
    const [tglSuratJalan, setTglSuratJalan] = useState("");
    const [nopen, setNopen] = useState("");
    const [tglNopen, setTglNopen] = useState("");
    const [paymentDate, setPaymentDate] = useState("");
    const [kode_Supplier, setKode_Supplier] = useState("");
    const [kode_Valas, setKode_Valas] = useState("Rp.");
    const [kurs, setKurs] = useState(1.0);
    const [awbBl, setAwbBl] = useState("");
    const [memo, setMemo] = useState("");
    const [forwardAgent, setForwardAgent] = useState("");
    const [lineItems, setLineItems] = useState<GRLineItem[]>([]);

    const [grossAmount, setGrossAmount] = useState(0);
    const [discAmount, setDiscAmount] = useState(0);
    const [netAmount, setNetAmount] = useState(0);
    const [dppNilaiLain, setDppNilaiLain] = useState(0);
    const [vat, setVat] = useState(0);
    const [purchaseAmount, setPurchaseAmount] = useState(0);
    const [ppnPct, setPpnPct] = useState(10);

    const { data: pcfList } = usePOConfirmationList();
    const { data: pcfDetail } = usePOConfirmationDetail(doku_PCF || null);

    const openPCFItems = (pcfList ?? [])
        .filter((pcf) => pcf.sts !== "9")
        .map((pcf) => ({
            code: pcf.doku ?? "",
            label: `${pcf.doku} - ${pcf.supplierName ?? pcf.kode_Supplier ?? ""} (PO ${pcf.doku_PO ?? ""})`,
        }));

    const recalcTotals = useCallback((items: GRLineItem[]) => {
        const gross = items.reduce((s, i) => s + i.jumlah * i.harga, 0);
        const disc = items.reduce((s, i) => s + i.disc, 0);
        const net = gross - disc;
        const dpp = net;
        const vatAmt = dpp * (ppnPct / 100);
        const total = dpp + vatAmt;
        setGrossAmount(gross);
        setDiscAmount(disc);
        setNetAmount(net);
        setDppNilaiLain(dpp);
        setVat(vatAmt);
        setPurchaseAmount(total);
    }, [ppnPct]);

    // Auto-fill header and line items when a PO Confirmation is selected.
    const loadedPcfDoku = useRef<string>("");
    useEffect(() => {
        if (!pcfDetail?.data) {
            if (doku_PCF) return;
            loadedPcfDoku.current = "";
            queueMicrotask(() => {
                setDoku_PO("");
                setTgl_PO("");
                setKode_Supplier("");
                setLineItems([]);
            });
            return;
        }

        if (loadedPcfDoku.current === pcfDetail.data.doku) return;
        loadedPcfDoku.current = pcfDetail.data.doku;

        const pcf = pcfDetail.data;
        const mapped = pcf.lines.map((line) => ({
            id_sub_po_confirmation: line.id_sub_po_confirmation,
            kode_Brg: line.kode_Brg,
            model: "",
            jumlah: line.jumlah,
            serialNo: "",
            harga: line.harga,
            discPct: 0,
            disc: 0,
            nilai: line.jumlah * line.harga,
            description: line.note ?? "",
            kode_Gudang: line.kode_Gudang ?? "",
            information: "",
        }));
        queueMicrotask(() => {
            setDoku_PO(pcf.doku_PO ?? "");
            setKode_Supplier(pcf.kode_Supplier ?? "");
            setTgl_PO(pcf.tgl ? pcf.tgl.split("T")[0] : "");
            setLineItems(mapped);
            recalcTotals(mapped);
        });
    }, [pcfDetail?.data, doku_PCF, recalcTotals]);

    const createGR = useMutation({
        mutationFn: async (payload: unknown) => {
            const res = await api.post("/api/goods-receipts", payload);
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(
                    err?.detail ?? err?.error ?? "Failed to create GR",
                );
            }
            return res.json() as Promise<{ doku: string }>;
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
            toast.success(`Goods receipt ${result.doku} created successfully`);
            navigate({ to: "/gr" });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const addLineItem = () =>
        setLineItems([
            ...lineItems,
            {
                id_sub_po_confirmation: 0,
                kode_Brg: "",
                model: "",
                jumlah: 1,
                serialNo: "",
                harga: 0,
                discPct: 0,
                disc: 0,
                nilai: 0,
                description: "",
                kode_Gudang: "",
                information: "",
            },
        ]);
    const removeLineItem = (index: number) =>
        setLineItems(lineItems.filter((_, i) => i !== index));

    const updateLineItem = (
        index: number,
        field: keyof GRLineItem,
        value: string | number,
    ) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };
        if (field === "jumlah" || field === "harga" || field === "discPct") {
            const item = updated[index];
            const gross = item.jumlah * item.harga;
            const disc = gross * (item.discPct / 100);
            item.disc = disc;
            item.nilai = gross - disc;
        }
        setLineItems(updated);
        recalcTotals(updated);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!doku_PCF) {
            toast.error("PO Confirmation is required");
            return;
        }
        if (!doku_PO) {
            toast.error("PO reference is required");
            return;
        }
        if (lineItems.length === 0) {
            toast.error("Add at least one line item");
            return;
        }

        const invalidLine = lineItems.find(
            (item) => !item.kode_Brg || item.jumlah <= 0 || !item.id_sub_po_confirmation,
        );
        if (invalidLine) {
            toast.error("Each line must have a stock code, a positive quantity, and a PO Confirmation line");
            return;
        }

        createGR.mutate({
            doku: doku || null,
            doku_PO,
            doku_PCF,
            tgl: new Date(tgl).toISOString(),
            kode_Supplier: kode_Supplier || null,
            suratJalan: suratJalan || null,
            memo: memo || null,
            lineItems: lineItems.map((item) => ({
                kode_Brg: item.kode_Brg,
                jumlah: item.jumlah,
                harga: item.harga,
                kode_Gudang: item.kode_Gudang || null,
                id_sub_po_confirmation: item.id_sub_po_confirmation,
            })),
        });
    };

    const vendorItems =
        vendors?.map((v) => ({
            code: v.kode,
            label: `${v.kode} - ${v.nama}`,
        })) ?? [];
    const inventoryItems =
        inventory?.map((i) => ({
            code: i.kode,
            label: `${i.kode} - ${i.nama}`,
        })) ?? [];
    const warehouseItems =
        warehouses?.map((w) => ({
            code: w.kode,
            label: `${w.kode} - ${w.nama}`,
        })) ?? [];

    return (
        <div className="space-y-4 p-4 lg:p-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Goods Receipt (GR)
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Lembar Penerimaan Barang
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                    >
                        <FilePlus className="size-4" />
                        New
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                    >
                        <Pencil className="size-4" />
                        Edit
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                    >
                        <Trash className="size-4" />
                        Delete
                    </Button>
                    <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        disabled={createGR.isPending}
                    >
                        <Save className="size-4" />
                        Save
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                    >
                        <Printer className="size-4" />
                        Print
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                    >
                        <RefreshCw className="size-4" />
                        ReSync
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-destructive"
                    >
                        <RefreshCw className="size-4" />
                        Sync to GGMC
                    </Button>
                    <div className="ml-auto">
                        <Badge variant="outline">Draft</Badge>
                    </div>
                </div>

                {/* Header */}
                <div className="rounded-md border bg-card p-4">
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Header
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                GR No.
                            </label>
                            <Input
                                value={doku}
                                onChange={(e) => setDoku(e.target.value)}
                                placeholder="Auto-generated"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Date</label>
                            <Input
                                type="date"
                                value={tgl}
                                onChange={(e) => setTgl(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                PO Confirm
                            </label>
                            <DataSelect
                                items={openPCFItems}
                                value={doku_PCF}
                                onValueChange={setDoku_PCF}
                                placeholder="Select PO Confirmation"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                PO Ref
                            </label>
                            <Input
                                value={doku_PO}
                                readOnly
                                placeholder="Auto-filled from PO Confirm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                PO Date
                            </label>
                            <Input
                                type="date"
                                value={tgl_PO}
                                onChange={(e) => setTgl_PO(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                DO Vendor
                            </label>
                            <Input
                                value={suratJalan}
                                onChange={(e) => setSuratJalan(e.target.value)}
                                placeholder="Delivery note"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                DO Date
                            </label>
                            <Input
                                type="date"
                                value={tglSuratJalan}
                                onChange={(e) =>
                                    setTglSuratJalan(e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Nopen</label>
                            <Input
                                value={nopen}
                                onChange={(e) => setNopen(e.target.value)}
                                placeholder="Customs ref"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                Nopen Date
                            </label>
                            <Input
                                type="date"
                                value={tglNopen}
                                onChange={(e) => setTglNopen(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                Payment Date
                            </label>
                            <Input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                Vendor
                            </label>
                            <DataSelect
                                items={vendorItems}
                                value={kode_Supplier}
                                onValueChange={setKode_Supplier}
                                placeholder="Select vendor"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                Currency / Rate
                            </label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={kode_Valas}
                                    onChange={(e) =>
                                        setKode_Valas(e.target.value)
                                    }
                                    className="w-20"
                                />
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={kurs}
                                    onChange={(e) =>
                                        setKurs(Number(e.target.value))
                                    }
                                    className="w-24"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                AWB/BL
                            </label>
                            <Input
                                value={awbBl}
                                onChange={(e) => setAwbBl(e.target.value)}
                                placeholder="Airway/Bill of Lading"
                            />
                        </div>
                    </div>
                </div>

                {/* Item Detail */}
                <div className="rounded-md border bg-card">
                    <div className="flex items-center justify-between border-b p-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Item Detail
                        </h2>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addLineItem}
                            disabled={!doku_PCF}
                        >
                            <Plus className="mr-1.5 size-3.5" />
                            Add Item
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        #
                                    </TableHead>
                                    <TableHead>Stock Code</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead className="w-[60px]">
                                        Qty
                                    </TableHead>
                                    <TableHead className="w-[100px]">
                                        Serial No.
                                    </TableHead>
                                    <TableHead className="w-[100px]">
                                        Price
                                    </TableHead>
                                    <TableHead className="w-[60px]">
                                        Disc %
                                    </TableHead>
                                    <TableHead className="w-[80px]">
                                        Disc
                                    </TableHead>
                                    <TableHead className="w-[100px]">
                                        Total
                                    </TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="w-[80px]">
                                        WH
                                    </TableHead>
                                    <TableHead>Information</TableHead>
                                    <TableHead className="w-[40px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lineItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={13}
                                            className="h-24 text-center text-sm text-muted-foreground"
                                        >
                                            {doku_PCF
                                                ? 'Click "Add Item" to add received items.'
                                                : "Select a PO Confirmation first."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    lineItems.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <DataSelect
                                                    items={inventoryItems}
                                                    value={item.kode_Brg}
                                                    onValueChange={(v) =>
                                                        updateLineItem(
                                                            index,
                                                            "kode_Brg",
                                                            v,
                                                        )
                                                    }
                                                    placeholder="Item"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={item.model}
                                                    onChange={(e) =>
                                                        updateLineItem(
                                                            index,
                                                            "model",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.jumlah}
                                                    onChange={(e) =>
                                                        updateLineItem(
                                                            index,
                                                            "jumlah",
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={item.serialNo}
                                                    onChange={(e) =>
                                                        updateLineItem(
                                                            index,
                                                            "serialNo",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.harga}
                                                    onChange={(e) =>
                                                        updateLineItem(
                                                            index,
                                                            "harga",
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={item.discPct}
                                                    onChange={(e) =>
                                                        updateLineItem(
                                                            index,
                                                            "discPct",
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right text-xs tabular-nums">
                                                {item.disc.toLocaleString(
                                                    "id-ID",
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-medium tabular-nums">
                                                {item.nilai.toLocaleString(
                                                    "id-ID",
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={item.description}
                                                    onChange={(e) =>
                                                        updateLineItem(
                                                            index,
                                                            "description",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <DataSelect
                                                    items={warehouseItems}
                                                    value={item.kode_Gudang}
                                                    onValueChange={(v) =>
                                                        updateLineItem(
                                                            index,
                                                            "kode_Gudang",
                                                            v,
                                                        )
                                                    }
                                                    placeholder="WH"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={item.information}
                                                    onChange={(e) =>
                                                        updateLineItem(
                                                            index,
                                                            "information",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() =>
                                                        removeLineItem(index)
                                                    }
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Footer Fields */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="space-y-3 rounded-md border bg-card p-4">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Info & Notes
                        </h2>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Note</label>
                            <Textarea
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                rows={2}
                                placeholder="Notes..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                Forward Agent
                            </label>
                            <Input
                                value={forwardAgent}
                                onChange={(e) =>
                                    setForwardAgent(e.target.value)
                                }
                                placeholder="Forwarding agent"
                            />
                        </div>
                        <Button type="button" variant="outline" size="sm">
                            <Printer className="mr-1.5 size-3.5" />
                            Import WMS Excel
                        </Button>
                    </div>
                    <div className="rounded-md border bg-card p-4">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Totals
                        </h2>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Gross Amount
                                </span>
                                <span className="tabular-nums font-medium">
                                    {grossAmount.toLocaleString("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Disc Amount
                                </span>
                                <span className="tabular-nums font-medium">
                                    {discAmount.toLocaleString("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Net. Amount
                                </span>
                                <span className="tabular-nums font-medium">
                                    {netAmount.toLocaleString("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    DPP Nilai Lain
                                </span>
                                <span className="tabular-nums font-medium">
                                    {dppNilaiLain.toLocaleString("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-muted-foreground">
                                    VAT (PPn)
                                </span>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={ppnPct}
                                        onChange={(e) => {
                                            setPpnPct(Number(e.target.value));
                                            recalcTotals(lineItems);
                                        }}
                                        className="h-7 w-16 text-right"
                                    />
                                    <span className="tabular-nums font-medium w-[120px] text-right">
                                        {vat.toLocaleString("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                        })}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between border-t pt-2 text-base font-semibold">
                                <span>Purchase Amount</span>
                                <span className="tabular-nums">
                                    {purchaseAmount.toLocaleString("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Footer */}
                <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                    <div className="flex gap-4">
                        <span>
                            Last Update by:{" "}
                            <span className="font-medium text-foreground">
                                admin
                            </span>
                        </span>
                        <span>
                            Create by:{" "}
                            <span className="font-medium text-foreground">
                                admin
                            </span>
                        </span>
                    </div>
                    <span>
                        Date modified: {new Date().toLocaleString("id-ID")}
                    </span>
                </div>
            </form>
        </div>
    );
}
