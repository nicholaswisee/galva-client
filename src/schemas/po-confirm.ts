import { z } from "zod";

export const poConfirmLineItemSchema = z.object({
  id_sub_po: z.number().int(),
  kode_Brg: z.string().min(1),
  merk: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  satuan: z.string().nullable().optional(),
  poQty: z.coerce.number().min(0),
  confirmedQty: z.coerce.number().min(0).default(0),
  confirmQty: z.coerce.number().min(0, "Confirm quantity must be 0 or greater"),
  remainingQty: z.coerce.number().min(0),
  harga: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
  kode_Gudang: z.string().nullable().optional(),
  note: z.string().max(255).optional(),
});

export const poConfirmFormSchema = z
  .object({
    doku: z.string().nullable().optional(),
    tgl: z.string().min(1, "Date is required"),
    doku_PO: z.string().min(1, "PO is required"),
    contactPr: z.string().max(100).optional(),
    psd: z.string().optional(),
    etd: z.string().optional(),
    memo: z.string().max(500).optional(),
    lineItems: z.array(poConfirmLineItemSchema),
  })
  .superRefine((data, ctx) => {
    const withQty = data.lineItems.filter((item) => item.confirmQty > 0);
    if (withQty.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one line must have a confirm quantity greater than 0",
        path: ["lineItems"],
      });
    }
    data.lineItems.forEach((item, index) => {
      if (item.confirmQty > item.remainingQty + 0.0001) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Confirm quantity cannot exceed remaining quantity (${item.remainingQty})`,
          path: ["lineItems", index, "confirmQty"],
        });
      }
    });
  });

export type POConfirmLineItemInput = z.infer<typeof poConfirmLineItemSchema>;
export type POConfirmFormInput = z.infer<typeof poConfirmFormSchema>;
