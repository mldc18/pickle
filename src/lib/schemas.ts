import { z } from "zod";
import { MAX_SLOTS } from "./constants";

// ---------------------------------------------------------------------------
// Primitives / shared
// ---------------------------------------------------------------------------

export const userRoleSchema = z.enum(["member", "admin", "super_admin"]);

/** YYYY-MM-DD */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a YYYY-MM-DD date");

/** YYYY-MM */
export const monthKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Must be a YYYY-MM month key");

/** ISO-8601 timestamp (e.g. from `new Date().toISOString()`) */
export const isoTimestampSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
    "Must be an ISO-8601 timestamp",
  );

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export const monthlyPaymentSchema = z.object({
  month: monthKeySchema,
  paid: z.boolean(),
});

export const userSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  fullName: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().min(1),
  address: z.string().min(1),
  role: userRoleSchema,
  /** Security selfie captured at registration. Immutable from the client. */
  avatarUrl: z.string().min(1),
  /** User-editable display photo shown on player list + profile. */
  photoUrl: z.string().nullable(),
  /** Payment screenshot uploaded at registration. */
  paymentScreenshotUrl: z.string().nullable(),
  /** La Marea ID photo uploaded at registration. */
  laMareaIdUrl: z.string().nullable(),
  emergencyContactName: z.string(),
  emergencyContactNumber: z.string(),
  acceptedRules: z.boolean(),
  isPaid: z.boolean(),
  paymentHistory: z.array(monthlyPaymentSchema),
  noShowCount: z.number().int().nonnegative(),
  acceptedTerms: z.boolean(),
  createdAt: dateStringSchema,
});

export const registeredPlayerSchema = z.object({
  userId: z.string().min(1),
  fullName: z.string().min(1),
  /** Display photo if set, otherwise the security selfie. */
  avatarUrl: z.string(),
  registeredAt: isoTimestampSchema,
});

export const gameDaySchema = z.object({
  date: dateStringSchema,
  isBlocked: z.boolean(),
  blockMessage: z.string().nullable(),
  registeredPlayers: z.array(registeredPlayerSchema).max(MAX_SLOTS),
  waitlist: z.array(registeredPlayerSchema),
  noShows: z.array(z.string()),
});

export const blockedDateSchema = z.object({
  date: dateStringSchema,
  message: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Form input schemas
// ---------------------------------------------------------------------------

export const registerStep1Schema = z
  .object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const registerStep2Schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  mobile: z.string().min(1, "Mobile number is required"),
  address: z.string().min(1, "Address is required"),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactNumber: z.string().min(1, "Emergency contact number is required"),
});

export const registerStep3Schema = z.object({
  acceptedTerms: z.literal(true, { message: "You must accept the waiver" }),
  acceptedRules: z.literal(true, { message: "You must accept the rules & regulations" }),
  profilePhoto: z.instanceof(Blob, { message: "A profile photo is required" }),
  paymentScreenshot: z.instanceof(Blob, { message: "Payment screenshot is required" }),
  laMareaId: z.instanceof(Blob, { message: "La Marea ID photo is required" }),
});

/** Full registration payload — step1 (without confirmPassword) + step2 + step3. */
export const registrationFormSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  confirmPassword: z.string(),
  fullName: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().min(1),
  address: z.string().min(1),
  emergencyContactName: z.string().min(1),
  emergencyContactNumber: z.string().min(1),
  acceptedTerms: z.boolean(),
  acceptedRules: z.boolean(),
  profilePhoto: z.instanceof(Blob),
  paymentScreenshot: z.instanceof(Blob),
  laMareaId: z.instanceof(Blob),
});

// ---------------------------------------------------------------------------
// Inferred types — single source of truth for the rest of the app
// ---------------------------------------------------------------------------

export type UserRole = z.infer<typeof userRoleSchema>;
export type MonthlyPayment = z.infer<typeof monthlyPaymentSchema>;
export type User = z.infer<typeof userSchema>;
export type RegisteredPlayer = z.infer<typeof registeredPlayerSchema>;
export type GameDay = z.infer<typeof gameDaySchema>;
export type BlockedDate = z.infer<typeof blockedDateSchema>;

export type RegisterStep1Input = z.infer<typeof registerStep1Schema>;
export type RegisterStep2Input = z.infer<typeof registerStep2Schema>;
export type RegisterStep3Input = z.infer<typeof registerStep3Schema>;
export type RegistrationFormData = z.infer<typeof registrationFormSchema>;

/** In-memory auth state — not persisted to DB, so no schema. */
export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};
