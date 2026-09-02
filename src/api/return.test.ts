import { describe, expect, test } from "vitest";
import { buildCreateReturnPayload } from "./return";
import type { ReturnFormInput } from "@/schemas/return";

const form: ReturnFormInput = {
  tgl: "2026-07-28",
  doku_Faktur: "INV-20260728-001",
  kode_Dept: "DEPT01",
  kode_Valas: "Rp.",
  kurs: 1,
  ppn: 10,
  memo: "Damaged",
  type: null,
  tipeRetur: null,
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

describe("buildCreateReturnPayload", () => {
  test("maps the form to the minimal create command", () => {
    const payload = buildCreateReturnPayload(form);
    expect(payload.doku_Faktur).toBe("INV-20260728-001");
    expect(payload.ppn).toBe(10);
    expect(payload.lineItems[0].kode_Brg).toBe("BRG001");
    expect(payload.lineItems[0].doku_LPB).toBe("LPB-20260728-001");
    expect(payload.lineItems[0].jumlah).toBe(10);
    expect(payload.lineItems[0].diskon).toBe(0);
    expect(payload).not.toHaveProperty("doku");
    expect(payload).not.toHaveProperty("eTag");
  });

  test("never submits server-derived fields", () => {
    const payload = buildCreateReturnPayload(form);
    const line = payload.lineItems[0] as Record<string, unknown>;
    for (const key of ["harga", "ppn", "ppnBm", "nilai", "alias"]) {
      expect(line).not.toHaveProperty(key);
    }
  });

  test("serializes date to ISO with a time component", () => {
    const payload = buildCreateReturnPayload(form);
    expect(payload.tgl).toBe("2026-07-28T00:00:00.000Z");
  });
});
