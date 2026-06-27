import { z } from "zod"

export const eventSchema = z.object({
  title: z.string().min(3, "Event title is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  startAt: z.string().min(1, "Start time is required"),
  endAt: z.string().min(1, "End time is required"),
  visibility: z.enum(["public", "private"]).default("public"),
  maxCapacity: z
    .preprocess((value) => {
      if (typeof value === "string") {
        const parsed = Number(value)
        return Number.isNaN(parsed) ? undefined : parsed
      }
      return value
    }, z.number().int().positive().optional()),
})

export type EventFormInput = z.infer<typeof eventSchema>
