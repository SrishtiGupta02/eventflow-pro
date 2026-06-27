import { z } from "zod"

// Validation rules for the existing Signup form. Field names match the
// `name` attributes on the existing inputs (first, last, org, email,
// password) — no new fields were added to the UI.
// Note: callers are expected to pass already-trimmed string values (trimming
// happens once, where the FormData is read, rather than inside this schema).
export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  orgName: z.string().min(2, "Organization name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  terms: z.literal("on"),
})

export type SignupInput = z.infer<typeof signupSchema>