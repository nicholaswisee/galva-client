import { z } from "zod";

export const returnLineSchema = z
  .object({
    doku_Faktur: z.string().min(1, "Source invoice is required"),
    doku_LPB: z.string().nullable().optional(),
    npo: z.string().nullable().optional(),
    kode_Brg: z.string().min(1, "Item code is required"),
    kode_Gudang: z.string().max(20).nullable().optional(),
    alias: z.string().max(20).nullable().optional(),
    jumlah: z.coerce.number().positive("Quantity must be greater than 0"),
    harga: z.coerce.number().min(0),
    diskon: z.coerce.number().min(0).default(0),
    ppnBm: z.coerce.number().min(0).default(0),
    nilai: z.coerce.number().min(0),
    noUrut: z.coerce.number().int().default(1),
  })
  .superRefine((line, ctx) => {
    const expected = line.jumlah * line.harga - line.diskon;
    if (Math.abs(expected - line.nilai) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nilai"],
        message: "Line amount does not match quantity times price minus discount",
      });
    }
  });

export const returnFormSchema = z
  .object({
    tgl: z.string().min(1, "Date is required"),
    doku_Faktur: z.string().min(1, "Source invoice is required"),
    kode_Dept: z.string().max(20).optional(),
    kode_Valas: z.string().min(1, "Currency is required"),
    kurs: z.coerce.number().min(0, "Rate must be 0 or greater"),
    ppn: z.coerce.number().min(0).max(100, "VAT percent cannot exceed 100"),
    memo: z.string().max(500).optional(),
    type: z.string().max(50).nullable().optional(),
    tipeRetur: z.string().max(10).nullable().optional(),
    lineItems: z.array(returnLineSchema).min(1, "Add at least one line item"),
  })
  .superRefine((form, ctx) => {
    const gross = form.lineItems.reduce((s, l) => s + l.jumlah * l.harga, 0);
    const discount = form.lineItems.reduce((s, l) => s + l.diskon, 0);
    if (discount > gross) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lineItems"],
        message: "Total discount exceeds gross amount",
      });
    }
  });

export type ReturnFormInput = z.infer<typeof returnFormSchema>;
