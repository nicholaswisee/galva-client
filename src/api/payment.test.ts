import { describe, expect, it } from "vitest";
import {
  aggregatePaidByInvoice,
  buildCreatePaymentPayload,
  buildUpdatePaymentPayload,
} from "@/api/payment";
import type { PaymentDetail } from "@/types";
import type { PaymentFormInput } from "@/schemas/payment";

const form: PaymentFormInput = {
  tgl: "2026-08-04",
  kode_Supplier: "SUP-001",
  kode_BankSupplier: "BCA",
  keterangan: "payment one",
  kode_Valas: "Rp.",
  kurs: 1,
  nilaiKas: 100,
  nilaiGiro: 0,
  lineItems: [{ doku_Faktur: "INV-1", doku_LPB: "GR-1", nilai: 100, totalNilai: 100 }],
};

describe("buildCreatePaymentPayload", () => {
  it("sends the expected create payload with nulls and ISO date", () => {
    expect(buildCreatePaymentPayload(form)).toEqual({
      kode_Supplier: "SUP-001",
      tgl: new Date("2026-08-04").toISOString(),
      kode_BankSupplier: "BCA",
      keterangan: "payment one",
      nilaiKas: 100,
      nilaiGiro: 0,
      kode_Valas: "Rp.",
      kurs: 1,
      lineItems: [{ doku_Faktur: "INV-1", doku_LPB: "GR-1", nilai: 100, totalNilai: 100 }],
    });
  });

  it("maps empty optional strings to null", () => {
    const empty = { ...form, kode_BankSupplier: "", keterangan: "", lineItems: [{ ...form.lineItems[0], doku_LPB: "" }] };
    expect(buildCreatePaymentPayload(empty)).toMatchObject({
      kode_BankSupplier: null,
      keterangan: null,
      lineItems: [{ doku_LPB: null }],
    });
  });
});

describe("buildUpdatePaymentPayload", () => {
  it("sends only the fields the update endpoint accepts", () => {
    expect(
      buildUpdatePaymentPayload({
        sts: "1",
        keterangan: "payment one",
        kode_BankSupplier: "BCA",
        nilaiKas: 100,
        nilaiGiro: 0,
      }),
    ).toEqual({
      sts: "1",
      keterangan: "payment one",
      kode_BankSupplier: "BCA",
      nilaiKas: 100,
      nilaiGiro: 0,
    });
  });
});

describe("aggregatePaidByInvoice", () => {
  it("sums payment line totals per invoice across details", () => {
    const details: PaymentDetail[] = [
      {
        doku: "BAY-1", tgl: null, kode_Supplier: "SUP-001", supplierName: null,
        kode_BankSupplier: null, keterangan: null, nilaiKas: 60, nilaiGiro: 0,
        nilMuka: 0, sts: "0", kode_Valas: null, kurs: 1, eTag: "a",
        lineItems: [{ pkbas: 1, doku_Faktur: "INV-1", doku_LPB: null, nilai: 60, totalNilai: 60, diskonTunai: null, keterangan: null }],
      },
      {
        doku: "BAY-2", tgl: null, kode_Supplier: "SUP-001", supplierName: null,
        kode_BankSupplier: null, keterangan: null, nilaiKas: 40, nilaiGiro: 0,
        nilMuka: 0, sts: "0", kode_Valas: null, kurs: 1, eTag: "b",
        lineItems: [{ pkbas: 1, doku_Faktur: "INV-1", doku_LPB: null, nilai: 40, totalNilai: 40, diskonTunai: null, keterangan: null }],
      },
    ];
    expect(aggregatePaidByInvoice(details)).toEqual({ "INV-1": 100 });
  });
});
