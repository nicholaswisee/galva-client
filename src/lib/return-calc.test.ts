import { describe, expect, test } from "vitest";
import { calcReturnLineAmounts, calcReturnTotals } from "./return-calc";

describe("calcReturnLineAmounts", () => {
  test("computes gross, discount, and net for a line", () => {
    expect(calcReturnLineAmounts({ jumlah: 10, harga: 100000, diskon: 50000 })).toEqual({
      gross: 1000000,
      discount: 50000,
      net: 950000,
    });
  });
});

describe("calcReturnTotals", () => {
  test("computes gross, discount, net, vat, and value amount", () => {
    const lines = [{ jumlah: 10, harga: 100000, diskon: 0 }];
    expect(calcReturnTotals(lines, 10)).toEqual({
      gross: 1000000,
      discount: 0,
      net: 1000000,
      vat: 100000,
      valueAmount: 1100000,
    });
  });
});
