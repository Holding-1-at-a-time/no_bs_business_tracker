// file: convex/users.ts
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { Doc, Id }_generated / dataModel";

/**
 * Get a user by their Clerk ID. (Internal)
 */
export const getUserByClerkId = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args): Promise<Doc<"users"> | null> => {
        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();
    },
});

/**
 * Create a new user. (Internal)
 */
export const createUser = internalMutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        email: v.string(), // FIX: Added email
    },
    handler: async (ctx, args): Promise<Id<"users">> => {
        return await ctx.db.insert("users", {
            clerkId: args.clerkId,
            name: args.name,
            email: args.email,
            plan: "free", // Default to free plan
        });
    },
});

/**
 * Update an existing user. (Internal)
 */
export const updateUser = internalMutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        email: v.string(), // FIX: Added email
    },
    handler: async (ctx, args): Promise<void> => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        await ctx.db.patch(user._id, {
            name: args.name,
            email: args.email,
        });
    },
});