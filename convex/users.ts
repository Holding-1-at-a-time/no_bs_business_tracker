// file: convex/users.ts
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

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
            plan: "free",
            tokenIdentifier: ""
        });
    },
});

// Goal and tools constants for seeding
const GOAL_CHECKLIST = [
    "First customer acquired",
    "First $100 day",
    "10 total customers",
    "DBA registered",
    "Business bank account opened",
    "First $1,000 revenue",
    "First repeat customer",
    "LLC filed",
    "First $10K month",
    "Hired first person",
];

const TOOLS_STACK = [
    "Google Voice (business number)",
    "Business email",
    "Google Calendar (scheduling)",
    "Wave Accounting (invoicing)",
    "Payment methods (Venmo/CashApp/Zelle)",
    "Facebook Marketplace account",
    "Nextdoor account",
    "Canva account",
    "This workbook system",
];

/**
 * Create a new user with initial data atomically. (Internal)
 * This prevents race conditions by combining user creation and seeding in one transaction.
 */
export const createUserWithData = internalMutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
    },
    handler: async (ctx, args): Promise<Id<"users">> => {
        // Create user
        const userId = await ctx.db.insert("users", {
            clerkId: args.clerkId,
            name: args.name,
            email: args.email,
            plan: "free",
            tokenIdentifier: ""
        });

        // Seed goals atomically
        for (const goal of GOAL_CHECKLIST) {
            await ctx.db.insert("userGoals", {
                userId: args.clerkId,
                goal: goal,
                isAchieved: false,
            });
        }

        // Seed tools atomically
        for (const tool of TOOLS_STACK) {
            await ctx.db.insert("userTools", {
                userId: args.clerkId,
                toolName: tool,
                isSetUp: false,
            });
        }

        // Seed business info atomically
        await ctx.db.insert("businessInfo", {
            userId: args.clerkId,
            businessName: "My New Business",
            dbaRegistrationDate: "",
            servicesOffered: "",
            pricingStructure: "",
            businessEmail: args.email,
            businessPhone: "",
            targetCustomer: "",
        });

        return userId;
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