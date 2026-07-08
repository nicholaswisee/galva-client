import { z } from "zod";

export const grLineItemSchema = z.object({
  kode_Brg: z.string().min(1, "Stock code is required"),
  jumlah: z.coerce.number().positive("Quantity must be greater than 0"),
  harga: z.coerce.number().min(0, "Price must be 0 or greater"),
  total: z.coerce.number().min(0),
  kode_Gudang: z.string().nullable().optional(),
  id_sub_po_confirmation: z.number().int().positive("PO Confirmation line is required"),
});

export const goodsReceiptFormSchema = z.object({
  doku: z.string().nullable().optional(),
  tgl: z.string().min(1, "Date is required"),
  doku_PO: z.string().min(1, "PO reference is required"),
  doku_PCF: z.string().min(1, "PO Confirmation is required"),
  kode_Supplier: z.string().nullable().optional(),
  suratJalan: z.string().max(50).nullable().optional(),
  memo: z.string().max(500).nullable().optional(),
  lineItems: z.array(grLineItemSchema).min(1, "Add at least one line item"),
});

export type GRLineItemInput = z.infer<typeof grLineItemSchema>;
export type GoodsReceiptFormInput = z.infer<typeof goodsReceiptFormSchema>;
