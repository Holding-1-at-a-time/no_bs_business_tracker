// file: convex/business.ts
import { v } from "convex/values";
import { internalMutation, query, mutation } from "./_generated/server";
import { Doc, Id }_generated / dataModel";

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
 * Seed initial goals and tools for a new user. (Internal)
 * Expects the Document ID of the user, not the Clerk ID.
 */
export const seedInitialData = internalMutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args): Promise<void> => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const clerkId = user.clerkId;

        // Seed goals
        for (const goal of GOAL_CHECKLIST) {
            await ctx.db.insert("userGoals", {
                userId: clerkId,
                goal: goal,
                isAchieved: false,
            });
        }

        // Seed tools
        for (const tool of TOOLS_STACK) {
            await ctx.db.insert("userTools", {
                userId: clerkId,
                toolName: tool,
                isSetUp: false,
            });
        }

        // Seed empty business info
        await ctx.db.insert("businessInfo", {
            userId: clerkId,
            businessName: "My New Business",
            dbaRegistrationDate: "",
            servicesOffered: "",
            pricingStructure: "",
            businessEmail: user.email,
            businessPhone: "",
            targetCustomer: "",
        });
    },
});

/**
 * Get the business info for the authenticated user.
 */
export const getBusinessInfo = query({
    args: {},
    handler: async (ctx): Promise<Doc<"businessInfo"> | null> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("businessInfo")
            .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
            .unique();
    },
});

/**
 * Update the business info for the authenticated user.
 */
export const updateBusinessInfo = mutation({
    args: {
        businessName: v.string(),
        dbaRegistrationDate: v.optional(v.string()),
        servicesOffered: v.optional(v.string()),
        pricingStructure: v.optional(v.string()),
        businessEmail: v.optional(v.string()),
        businessPhone: v.optional(v.string()),
        targetCustomer: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<void> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const businessInfo = await ctx.db
            .query("businessInfo")
            .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
            .unique();

        if (!businessInfo) {
            await ctx.db.insert("businessInfo", {
                userId: identity.subject,
                ...args,
            });
        } else {
            await ctx.db.patch(businessInfo._id, { ...args });
        }
    },
});

// --- NEW FUNCTIONS FOR SETTINGS PAGE ---

/**
 * Get all goals for the authenticated user.
 */
export const getGoals = query({
    args: {},
    handler: async (ctx): Promise<Doc<"userGoals">[] | null> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("userGoals")
            .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
            .collect();
    },
});

/**
 * Get all tools for the authenticated user.
 */
export const getTools = query({
    args: {},
    handler: async (ctx): Promise<Doc<"userTools">[] | null> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("userTools")
            .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
            .collect();
    },
});

/**
 * Toggle a user's tool setup status.
 */
export const toggleTool = mutation({
    args: {
        toolId: v.id("userTools"),
        isSetUp: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const tool = await ctx.db.get(args.toolId);
        if (!tool || tool.userId !== identity.subject) {
            throw new Error("Tool not found or unauthorized");
        }

        await ctx.db.patch(args.toolId, {
            isSetUp: args.isSetUp,
        });
    },
});

// Note: `toggleGoal` mutation is already implemented in `convex/dashboard.ts`