import {
    useState,
    type FormEvent,
    useEffect,
    useRef,
    useCallback,
} from "react";
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
    Info,
    Lock,
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
import {
    usePOConfirmationList,
    usePOConfirmationDetail,
} from "@/api/po-confirm";
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

interface HeaderErrors {
    [key: string]: string;
}

interface LineItemErrors {
    [index: number]: Partial<Record<keyof GRLineItem, string>>;
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <p className="mt-1 text-[11px] leading-tight text-destructive">
            {message}
        </p>
    );
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
    const [fieldErrors, setFieldErrors] = useState<{
        header: HeaderErrors;
        lines: LineItemErrors;
    }>({ header: {}, lines: {} });

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

    const recalcTotals = useCallback(
        (items: GRLineItem[]) => {
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
        },
        [ppnPct],
    );

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
                setFieldErrors((prev) => ({
                    ...prev,
                    header: {
                        ...prev.header,
                        doku_PCF: "",
                        doku_PO: "",
                        lineItems: "",
                    },
                    lines: {},
                }));
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
            setKode_Valas(pcf.kode_Valas ?? "Rp.");
            setKurs(pcf.kurs ?? 1.0);
            setTgl_PO(pcf.tgl ? pcf.tgl.split("T")[0] : "");
            setLineItems(mapped);
            recalcTotals(mapped);
            setFieldErrors((prev) => ({
                ...prev,
                header: {
                    ...prev.header,
                    doku_PCF: "",
                    doku_PO: "",
                    lineItems: "",
                },
                lines: {},
            }));
        });
    }, [pcfDetail?.data, doku_PCF, recalcTotals, setFieldErrors]);

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

    const addLineItem = () => {
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
        setFieldErrors((prev) => ({
            ...prev,
            header: { ...prev.header, lineItems: "" },
        }));
    };
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
        setFieldErrors((prev) => {
            const lines = { ...prev.lines };
            if (lines[index]) {
                const next = { ...lines[index] };
                delete next[field];
                if (Object.keys(next).length === 0) delete lines[index];
                else lines[index] = next;
            }
            return { ...prev, lines };
        });
        recalcTotals(updated);
    };

    const validate = useCallback((): boolean => {
        const header: HeaderErrors = {};
        const lines: LineItemErrors = {};

        if (!doku_PCF) header.doku_PCF = "PO Confirmation is required";
        if (!doku_PO) header.doku_PO = "PO reference is required";
        if (lineItems.length === 0) {
            header.lineItems = "Add at least one line item";
        }

        lineItems.forEach((item, index) => {
            const lineError: Partial<Record<keyof GRLineItem, string>> = {};
            if (!item.kode_Brg) lineError.kode_Brg = "Stock code is required";
            if (item.jumlah <= 0)
                lineError.jumlah = "Quantity must be greater than 0";
            if (!item.id_sub_po_confirmation)
                lineError.id_sub_po_confirmation = "PO line is required";
            if (Object.keys(lineError).length > 0) lines[index] = lineError;
        });

        setFieldErrors({ header, lines });
        return (
            Object.keys(header).length === 0 && Object.keys(lines).length === 0
        );
    }, [doku_PCF, doku_PO, lineItems]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            toast.error("Please fix the highlighted errors before saving.");
            return;
        }

        createGR.mutate({
            doku: doku || null,
            doku_PO,
            doku_PCF,
            tgl: new Date(tgl).toISOString(),
            kode_Supplier: kode_Supplier || null,
            kode_Valas: kode_Valas === "Rp." ? null : kode_Valas,
            kurs: kurs === 1.0 ? null : kurs,
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
                                aria-invalid={!!fieldErrors.header.tgl}
                            />
                            <FieldError message={fieldErrors.header.tgl} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                PO Confirm
                            </label>
                            <DataSelect
                                items={openPCFItems}
                                value={doku_PCF}
                                onValueChange={(v) => {
                                    setDoku_PCF(v);
                                    setFieldErrors((prev) => ({
                                        ...prev,
                                        header: {
                                            ...prev.header,
                                            doku_PCF: "",
                                        },
                                    }));
                                }}
                                placeholder="Select PO Confirmation"
                                error={fieldErrors.header.doku_PCF}
                            />
                            <FieldError message={fieldErrors.header.doku_PCF} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium">
                                PO Ref
                                <span
                                    title="Auto-filled from PO Confirmation"
                                    className="inline-flex items-center gap-0.5 text-[10px] font-normal text-muted-foreground"
                                >
                                    <Lock className="size-3" />
                                    auto
                                </span>
                            </label>
                            <Input
                                value={doku_PO}
                                readOnly
                                placeholder="Auto-filled from PO Confirm"
                                aria-invalid={!!fieldErrors.header.doku_PO}
                                className="bg-muted/40 cursor-not-allowed"
                            />
                            <FieldError message={fieldErrors.header.doku_PO} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium">
                                PO Date
                                {doku_PCF && (
                                    <span
                                        title="Auto-filled from PO Confirmation"
                                        className="inline-flex items-center gap-0.5 text-[10px] font-normal text-muted-foreground"
                                    >
                                        <Lock className="size-3" />
                                        auto
                                    </span>
                                )}
                            </label>
                            <Input
                                type="date"
                                value={tgl_PO}
                                onChange={(e) => setTgl_PO(e.target.value)}
                                disabled={!!doku_PCF}
                                className={
                                    doku_PCF
                                        ? "bg-muted/40 cursor-not-allowed"
                                        : undefined
                                }
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
                            <label className="flex items-center gap-1.5 text-xs font-medium">
                                Vendor
                                {doku_PCF && (
                                    <span
                                        title="Auto-filled from PO Confirmation"
                                        className="inline-flex items-center gap-0.5 text-[10px] font-normal text-muted-foreground"
                                    >
                                        <Lock className="size-3" />
                                        auto
                                    </span>
                                )}
                            </label>
                            <DataSelect
                                items={vendorItems}
                                value={kode_Supplier}
                                onValueChange={setKode_Supplier}
                                placeholder="Select vendor"
                                disabled={!!doku_PCF}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium">
                                Currency / Rate
                                {doku_PCF && (
                                    <span
                                        title="Auto-filled from PO Confirmation"
                                        className="inline-flex items-center gap-0.5 text-[10px] font-normal text-muted-foreground"
                                    >
                                        <Lock className="size-3" />
                                        auto
                                    </span>
                                )}
                            </label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={kode_Valas}
                                    onChange={(e) =>
                                        setKode_Valas(e.target.value)
                                    }
                                    className="w-20"
                                    disabled={!!doku_PCF}
                                />
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={kurs}
                                    onChange={(e) =>
                                        setKurs(Number(e.target.value))
                                    }
                                    className="w-24"
                                    disabled={!!doku_PCF}
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
                            title={
                                doku_PCF
                                    ? "Add a new line item"
                                    : "Select a PO Confirmation above first"
                            }
                        >
                            <Plus className="mr-1.5 size-3.5" />
                            Add Item
                        </Button>
                    </div>
                    {!doku_PCF && (
                        <div
                            role="status"
                            className="flex items-start gap-2 border-b bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                        >
                            <Info className="mt-0.5 size-3.5 shrink-0" />
                            <span>
                                Select a PO Confirmation above to load items.{" "}
                                <span className="font-medium text-foreground">
                                    Item details, PO Ref, PO Date, Vendor, and Currency/Rate
                                </span>{" "}
                                will auto-fill once a confirmation is chosen.
                            </span>
                        </div>
                    )}
                    <div
                        className={
                            doku_PCF
                                ? "overflow-x-auto"
                                : "overflow-x-auto opacity-60 pointer-events-none select-none"
                        }
                        aria-disabled={!doku_PCF}
                    >
                        <Table className="table-fixed">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        #
                                    </TableHead>
                                    <TableHead className="w-[160px]">
                                        Stock Code
                                    </TableHead>
                                    <TableHead className="w-[80px]">
                                        Model
                                    </TableHead>
                                    <TableHead className="w-[95px]">
                                        Qty
                                    </TableHead>
                                    <TableHead className="w-[90px]">
                                        Serial No.
                                    </TableHead>
                                    <TableHead className="w-[105px]">
                                        Price
                                    </TableHead>
                                    <TableHead className="w-[85px]">
                                        Disc %
                                    </TableHead>
                                    <TableHead className="w-[80px]">
                                        Disc
                                    </TableHead>
                                    <TableHead className="w-[105px]">
                                        Total
                                    </TableHead>
                                    <TableHead className="w-[110px]">
                                        Description
                                    </TableHead>
                                    <TableHead className="w-[120px]">
                                        WH
                                    </TableHead>
                                    <TableHead className="w-[85px]">
                                        Information
                                    </TableHead>
                                    <TableHead className="w-[40px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lineItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={13}
                                            className="h-28 text-center text-sm text-muted-foreground"
                                        >
                                            {doku_PCF ? (
                                                <>
                                                    Click{" "}
                                                    <span className="font-medium text-foreground">
                                                        Add Item
                                                    </span>{" "}
                                                    above to add received items.
                                                </>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Lock className="size-3.5" />
                                                    Select a PO Confirmation
                                                    above to unlock this table.
                                                </span>
                                            )}
                                            {fieldErrors.header.lineItems && (
                                                <p className="mt-1 text-[11px] text-destructive">
                                                    {
                                                        fieldErrors.header
                                                            .lineItems
                                                    }
                                                </p>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    lineItems.map((item, index) => {
                                        const lineErr =
                                            fieldErrors.lines[index];
                                        return (
                                            <TableRow key={index}>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="w-[160px]">
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
                                                        placeholder="Select item"
                                                        error={
                                                            lineErr?.kode_Brg
                                                        }
                                                    />
                                                    <FieldError
                                                        message={
                                                            lineErr?.kode_Brg
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="w-[80px]">
                                                    <Input
                                                        value={item.model}
                                                        onChange={(e) =>
                                                            updateLineItem(
                                                                index,
                                                                "model",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="h-8 w-full"
                                                        aria-invalid={
                                                            !!lineErr?.model
                                                        }
                                                    />
                                                    <FieldError
                                                        message={lineErr?.model}
                                                    />
                                                </TableCell>
                                                <TableCell className="w-[95px]">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.jumlah}
                                                        onChange={(e) =>
                                                            updateLineItem(
                                                                index,
                                                                "jumlah",
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        className="h-9 w-full tabular-nums"
                                                        aria-invalid={
                                                            !!lineErr?.jumlah
                                                        }
                                                    />
                                                    <FieldError
                                                        message={
                                                            lineErr?.jumlah
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="w-[90px]">
                                                    <Input
                                                        value={item.serialNo}
                                                        onChange={(e) =>
                                                            updateLineItem(
                                                                index,
                                                                "serialNo",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="h-8 w-full"
                                                        aria-invalid={
                                                            !!lineErr?.serialNo
                                                        }
                                                    />
                                                    <FieldError
                                                        message={
                                                            lineErr?.serialNo
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="w-[105px]">
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
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        className="h-8 w-full"
                                                        aria-invalid={
                                                            !!lineErr?.harga
                                                        }
                                                    />
                                                    <FieldError
                                                        message={lineErr?.harga}
                                                    />
                                                </TableCell>
                                                <TableCell className="w-[85px]">
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
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        className="h-9 w-full tabular-nums"
                                                        aria-invalid={
                                                            !!lineErr?.discPct
                                                        }
                                                    />
                                                    <FieldError
                                                        message={
                                                            lineErr?.discPct
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="w-[80px] text-right text-xs tabular-nums">
                                                    {item.disc.toLocaleString(
                                                        "id-ID",
                                                    )}
                                                </TableCell>
                                                <TableCell className="w-[105px] text-right text-xs font-medium tabular-nums">
                                                    {item.nilai.toLocaleString(
                                                        "id-ID",
                                                    )}
                                                </TableCell>
                                                <TableCell className="w-[110px]">
                                                    <Input
                                                        value={item.description}
                                                        onChange={(e) =>
                                                            updateLineItem(
                                                                index,
                                                                "description",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="h-8 w-full"
                                                        aria-invalid={
                                                            !!lineErr?.description
                                                        }
                                                    />
                                                    <FieldError
                                                        message={
                                                            lineErr?.description
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="w-[120px]">
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
                                                        placeholder="Select warehouse"
                                                        error={
                                                            lineErr?.kode_Gudang
                                                        }
                                                    />
                                                    <FieldError
                                                        message={
                                                            lineErr?.kode_Gudang
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="w-[85px]">
                                                    <Input
                                                        value={item.information}
                                                        onChange={(e) =>
                                                            updateLineItem(
                                                                index,
                                                                "information",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="h-8 w-full"
                                                        aria-invalid={
                                                            !!lineErr?.information
                                                        }
                                                    />
                                                    <FieldError
                                                        message={
                                                            lineErr?.information
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="w-[40px]">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() =>
                                                            removeLineItem(
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
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
