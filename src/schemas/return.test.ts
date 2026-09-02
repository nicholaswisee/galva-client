import { describe, expect, test } from "vitest";
import { returnFormSchema } from "./return";

const validForm = {
  tgl: "2026-07-28",
  doku_Faktur: "INV-20260728-001",
  kode_Dept: "DEPT01",
  kode_Valas: "Rp.",
  kurs: 1,
  ppn: 10,
  memo: "",
  lineItems: [
    {
      doku_Faktur: "INV-20260728-001",
      doku_LPB: "LPB-20260728-001",
      kode_Brg: "BRG001",
      kode_Gudang: "WH01",
      alias: "pcs",
      jumlah: 10,
      harga: 100000,
      diskon: 0,
      ppnBm: 0,
      nilai: 1000000,
      noUrut: 1,
    },
  ],
};

describe("returnFormSchema", () => {
  test("accepts a valid form", () => {
    expect(returnFormSchema.safeParse(validForm).success).toBe(true);
  });
  test("rejects empty line items", () => {
    const result = returnFormSchema.safeParse({ ...validForm, lineItems: [] });
    expect(result.success).toBe(false);
  });
  test("rejects a zero or negative quantity", () => {
    const result = returnFormSchema.safeParse({
      ...validForm,
      lineItems: [{ ...validForm.lineItems[0], jumlah: 0 }],
    });
    expect(result.success).toBe(false);
  });
  test("rejects a line whose nilai mismatches qty times price minus discount", () => {
    const result = returnFormSchema.safeParse({
      ...validForm,
      lineItems: [{ ...validForm.lineItems[0], nilai: 999 }],
    });
    expect(result.success).toBe(false);
  });
  test("rejects a form whose total discount exceeds the gross amount", () => {
    const result = returnFormSchema.safeParse({
      ...validForm,
      lineItems: [{ ...validForm.lineItems[0], diskon: 9999999 }],
    });
    expect(result.success).toBe(false);
  });
});
