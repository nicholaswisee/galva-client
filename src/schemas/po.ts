import { z } from "zod";

export const poLineItemSchema = z.object({
  id_sub_po: z.number().int().optional(),
  kode_Brg: z.string().min(1, "Stock code is required"),
  merk: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  satuan: z.string().max(20).optional(),
  jumlah: z.coerce.number().positive("Quantity must be greater than 0"),
  harga: z.coerce.number().min(0, "Price must be 0 or greater"),
  discPct: z.coerce.number().min(0).max(100),
  disc: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
  kode_Gudang: z.string().max(20).optional(),
  alias: z.string().max(255).optional(),
  note: z.string().max(255).optional(),
  schedule: z.string().optional(),
  kode_Valas: z.string().optional(),
  kurs: z.coerce.number().min(0).optional(),
  ppn: z.coerce.number().min(0).optional(),
});

export const poFormSchema = z.object({
  doku: z.string().nullable().optional(),
  tgl: z.string().min(1, "Date is required"),
  kode_Supplier: z.string().min(1, "Vendor is required"),
  kode_dept: z.string().min(1, "Department is required"),
  kode_Valas: z.string().min(1, "Currency is required"),
  kurs: z.coerce.number().min(0, "Rate must be 0 or greater"),
  syarat: z.coerce.number().int().min(0, "T.O.P must be 0 or greater"),
  ppn: z.coerce.number().min(0).max(100, "VAT percent cannot exceed 100"),
  diskon: z.coerce.number().min(0).default(0),
  dppNilaiLain: z.coerce.number().min(0).default(0),
  ppnTunai: z.coerce.number().min(0).default(0),
  memo: z.string().max(500).optional(),
  lineItems: z.array(poLineItemSchema).min(1, "Add at least one line item"),
});

export type POLineItemInput = z.infer<typeof poLineItemSchema>;
export type POFormInput = z.infer<typeof poFormSchema>;
