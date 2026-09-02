import { describe, expect, it } from "vitest";
import {
  buildPaymentFormSchema,
  calcPaymentTotals,
  paymentFormSchema,
  paymentStatusLabel,
} from "@/schemas/payment";

const baseForm = {
  tgl: "2026-08-04",
  kode_Supplier: "SUP-001",
  kode_BankSupplier: "",
  keterangan: "",
  kode_Valas: "Rp.",
  kurs: 1,
  nilaiKas: 100,
  nilaiGiro: 0,
};

describe("paymentStatusLabel", () => {
  it("maps API status codes to semantic labels", () => {
    expect(paymentStatusLabel("0")).toBe("Pending");
    expect(paymentStatusLabel("1")).toBe("Active");
    expect(paymentStatusLabel("2")).toBe("Closed");
    expect(paymentStatusLabel(null)).toBe("Pending");
  });
});

describe("paymentFormSchema", () => {
  it("rejects a missing vendor", () => {
    const result = paymentFormSchema.safeParse({ ...baseForm, kode_Supplier: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("kode_Supplier"))).toBe(true);
    }
  });

  it("rejects empty allocations", () => {
    const result = paymentFormSchema.safeParse({ ...baseForm, lineItems: [] });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive applied amounts", () => {
    const result = paymentFormSchema.safeParse({
      ...baseForm,
      lineItems: [{ doku_Faktur: "INV-1", doku_LPB: "", nilai: 100, totalNilai: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("buildPaymentFormSchema", () => {
  it("rejects local over-allocation against outstanding balances", () => {
    const schema = buildPaymentFormSchema({ "INV-1": 50 });
    const result = schema.safeParse({
      ...baseForm,
      lineItems: [{ doku_Faktur: "INV-1", doku_LPB: "", nilai: 100, totalNilai: 80 }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts allocation within outstanding balance", () => {
    const schema = buildPaymentFormSchema({ "INV-1": 50 });
    const result = schema.safeParse({
      ...baseForm,
      lineItems: [{ doku_Faktur: "INV-1", doku_LPB: "", nilai: 100, totalNilai: 50 }],
    });
    expect(result.success).toBe(true);
  });
});

describe("calcPaymentTotals", () => {
  it("computes applied total, grand total, and allocation difference", () => {
    const totals = calcPaymentTotals(
      [
        { doku_Faktur: "INV-1", doku_LPB: "", nilai: 100, totalNilai: 60 },
        { doku_Faktur: "INV-2", doku_LPB: "", nilai: 50, totalNilai: 40 },
      ],
      90,
      10,
    );
    expect(totals.appliedTotal).toBe(100);
    expect(totals.grandTotal).toBe(100);
    expect(totals.allocationDifference).toBe(0);
  });
});
