import { z } from "zod"

function toOptionalNumber(value: unknown) {
  if (typeof value === "string") {
    if (value.trim() === "") return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return value
}

export const ticketTierSchema = z
  .object({
    name: z.string().min(2, "Tier name is required"),
    description: z.string().trim().optional(),
    price: z.preprocess(
      toOptionalNumber,
      z.number({ invalid_type_error: "Enter a valid price" }).nonnegative("Price cannot be negative")
    ),
    currency: z.literal("INR").default("INR"),
    quantityTotal: z.preprocess(
      toOptionalNumber,
      z
        .number({ invalid_type_error: "Enter a valid quantity" })
        .int()
        .positive("Total quantity must be at least 1")
    ),
    saleStartAt: z.string().optional(),
    saleEndAt: z.string().optional(),
    minPerOrder: z.preprocess(
      toOptionalNumber,
      z.number().int().positive("Minimum per order must be at least 1").optional().default(1)
    ),
    maxPerOrder: z.preprocess(
      toOptionalNumber,
      z.number().int().positive("Maximum per order must be at least 1").optional()
    ),
    isActive: z.preprocess((value) => value === "on" || value === true, z.boolean()),
  })
  .refine(
    (data) =>
      data.minPerOrder === undefined ||
      data.maxPerOrder === undefined ||
      data.maxPerOrder >= data.minPerOrder,
    {
      message: "Maximum per order cannot be less than minimum per order",
      path: ["maxPerOrder"],
    }
  )
  .refine(
    (data) =>
      !data.saleStartAt ||
      !data.saleEndAt ||
      new Date(data.saleEndAt).getTime() >= new Date(data.saleStartAt).getTime(),
    {
      message: "Sale end date cannot be earlier than sale start date",
      path: ["saleEndAt"],
    }
  )

export type TicketTierFormInput = z.infer<typeof ticketTierSchema>