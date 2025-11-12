// file: convex/financials.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc }_generated / dataModel";

// This is a "Free Plan" limit
const FREE_PLAN_ENTRY_LIMIT = 50;

/**
 * Add a new financial entry (revenue or expense).
 * This is now "gated" based on the user's plan.
 */
export const addEntry = mutation({
    args: {
        date: v.string(), // YYYY-MM-DD
        type: v.union(v.literal("revenue"), v.literal("expense")),
        amount: v.number(),
        category: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        // --- FEATURE GATING LOGIC ---
        if (user.plan !== "pro") {
            // User is on "free" plan, let's count their entries
            const allEntries = await ctx.db
                .query("financialEntries")
                .withIndex("by_userId", (q) => q.eq("userId", user.clerkId))
                .collect();

            if (allEntries.length >= FREE_PLAN_ENTRY_LIMIT) {
                throw new Error(
                    `Upgrade to Pro to add more than ${FREE_PLAN_ENTRY_LIMIT} financial entries.`,
                );
            }
        }
        // --- END FEATURE GATING ---

        const entryId = await ctx.db.insert("financialEntries", {
            userId: identity.subject,
            ...args,
        });

        return entryId;
    },
});

/**
 * Get all financial entries and aggregated summary for a specific month.
 * (This query remains the same as before)
 */
export const getMonthlyFinancials = query({
    args: { month: v.string() }, // YYYY-MM
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }
        // ... (rest of the query logic is unchanged)

        const userId = identity.subject;

        // Calculate date range for the query
        const startDate = `${args.month}-01`;
        const [year, monthNum] = args.month.split("-").map(Number);
        const nextMonthYear = monthNum === 12 ? year + 1 : year;
        const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1;
        const nextMonthStart = `${nextMonthYear}-${String(nextMonthNum).padStart(
            2,
            "0",
        )}-01`;

        const entries = await ctx.db
            .query("financialEntries")
            .withIndex("by_userId_date", (q) =>
                q
                    .eq("userId", userId)
                    .gte("date", startDate)
                    .lt("date", nextMonthStart),
            )
            .order("desc")
            .collect();

        // Calculate aggregates
        let totalRevenue = 0;
        let totalExpenses = 0;

        for (const entry of entries) {
            if (entry.type === "revenue") {
                totalRevenue += entry.amount;
            } else {
                totalExpenses += entry.amount;
            }
        }

        const netProfit = totalRevenue - totalExpenses;
        const profitMargin =
            totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        return {
            entries,
            totalRevenue,
            totalExpenses,
            netProfit,
            profitMargin,
        };
    },
});