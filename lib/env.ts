import { z } from "zod";

/**
 * Environment variable validation schema
 * Validates required environment variables at runtime to catch configuration errors early
 */
const envSchema = z.object({
    NEXT_PUBLIC_CONVEX_URL: z.string().url("NEXT_PUBLIC_CONVEX_URL must be a valid URL"),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
    // Server-side only variables (optional for client-side builds)
    CLERK_WEBHOOK_SECRET: z.string().min(1, "CLERK_WEBHOOK_SECRET is required").optional(),
});

/**
 * Validated environment variables
 * @throws {ZodError} If environment variables don't match the schema
 */
export const env = envSchema.parse({
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
});

export type Env = z.infer<typeof envSchema>;
