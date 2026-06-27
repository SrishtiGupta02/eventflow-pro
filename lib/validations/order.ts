import { z } from "zod"

export const orderSchema = z.object({
  buyerName: z.string().min(1, "Buyer name is required"),
  buyerEmail: z.string().email("Enter a valid email address"),
  ticketTierId: z.string().uuid("Select a valid ticket tier"),
  quantity: z
    .preprocess((value) => {
      if (typeof value === "string") {
        return Number(value)
      }
      return value
    }, z.number().int().positive("Quantity must be at least 1")),
})

export type OrderFormInput = z.infer<typeof orderSchema>
