export interface ReturnLineAmountsInput {
  jumlah: number;
  harga: number;
  diskon: number;
}

export function calcReturnLineAmounts(input: ReturnLineAmountsInput) {
  const gross = input.jumlah * input.harga;
  const discount = input.diskon;
  return { gross, discount, net: gross - discount };
}

export function calcReturnTotals(
  lines: ReturnLineAmountsInput[],
  ppnPct: number,
) {
  const gross = lines.reduce((sum, line) => sum + line.jumlah * line.harga, 0);
  const discount = lines.reduce((sum, line) => sum + line.diskon, 0);
  const net = gross - discount;
  const vat = net * (ppnPct / 100);
  return { gross, discount, net, vat, valueAmount: net + vat };
}
