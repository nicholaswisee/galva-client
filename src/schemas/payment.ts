import { z } from "zod";

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  "0": "Pending",
  "1": "Active",
  "2": "Closed",
};

export function paymentStatusLabel(sts: string | null | undefined): string {
  return PAYMENT_STATUS_LABELS[sts ?? ""] ?? sts ?? "Pending";
}

export const paymentLineSchema = z.object({
  doku_Faktur: z.string().min(1, "Invoice is required"),
  doku_LPB: z.string().max(50).optional(),
  nilai: z.coerce.number().positive("Invoice amount must be greater than 0"),
  totalNilai: z.coerce.number().positive("Applied amount must be greater than 0"),
});

export const paymentFormSchema = z.object({
  tgl: z.string().min(1, "Payment date is required"),
  kode_Supplier: z.string().min(1, "Vendor is required"),
  kode_BankSupplier: z.string().optional(),
  keterangan: z.string().max(500).optional(),
  kode_Valas: z.string().min(1, "Currency is required"),
  kurs: z.coerce.number().min(0, "Rate must be 0 or greater"),
  nilaiKas: z.coerce.number().min(0, "Cash amount must be 0 or greater"),
  nilaiGiro: z.coerce.number().min(0, "Giro amount must be 0 or greater"),
  lineItems: z.array(paymentLineSchema).min(1, "Add at least one invoice allocation"),
});

// ponytail: the getter keeps one authoritative schema for both the live form (stale closure
// avoided by reading a ref at parse time) and the tests (plain object). The API's 422
// over-payment guard remains authoritative; this only prevents obvious over-allocation locally.
export function buildPaymentFormSchema(
  outstanding: Record<string, number> | (() => Record<string, number>),
) {
  const getOutstanding = typeof outstanding === "function" ? outstanding : () => outstanding;
  return paymentFormSchema.superRefine((value, ctx) => {
    const map = getOutstanding();
    value.lineItems.forEach((line, index) => {
      const remaining = map[line.doku_Faktur];
      if (remaining !== undefined && line.totalNilai > remaining + 1e-6) {
        ctx.addIssue({
          code: "custom",
          path: ["lineItems", index, "totalNilai"],
          message: `Applied amount exceeds outstanding balance of ${remaining}`,
        });
      }
    });
  });
}

export interface PaymentTotals {
  appliedTotal: number;
  grandTotal: number;
  allocationDifference: number;
}

export function calcPaymentTotals(
  lineItems: PaymentLineInput[],
  nilaiKas: number,
  nilaiGiro: number,
): PaymentTotals {
  const appliedTotal = lineItems.reduce((sum, line) => sum + line.totalNilai, 0);
  const grandTotal = nilaiKas + nilaiGiro;
  return { appliedTotal, grandTotal, allocationDifference: appliedTotal - grandTotal };
}

export type PaymentLineInput = z.infer<typeof paymentLineSchema>;
export type PaymentFormInput = z.infer<typeof paymentFormSchema>;
