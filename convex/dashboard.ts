// file: convex/dashboard.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc }_generated / dataModel";
import { format, parseISO } from "date-fns";

/**
 * Helper to format currency
 */
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
};

/**
 * Get aggregated data for the weekly review + all user goals
 */
export const getDashboardData = query({
    args: {
        startDate: v.string(), // YYYY-MM-DD
        endDate: v.string(), // YYYY-MM-DD
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }
        const userId = identity.subject;

        // 1. Get Goals
        const userGoals = await ctx.db
            .query("userGoals")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        // 2. Get Financials for the date range
        const financialEntries = await ctx.db
            .query("financialEntries")
            .withIndex("by_userId_date", (q) =>
                q
                    .eq("userId", userId)
                    .gte("date", args.startDate)
                    .lte("date", args.endDate),
            )
            .collect();

        let totalRevenue = 0;
        let totalExpenses = 0;
        for (const entry of financialEntries) {
            if (entry.type === "revenue") {
                totalRevenue += entry.amount;
            } else {
                totalExpenses += entry.amount;
            }
        }
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin =
            totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        // 3. Get Action counts for the date range (2N+1 queries)
        const logs = await ctx.db
            .query("dailyLogs")
            .withIndex("by_userId_date", (q) =>
                q
                    .eq("userId", userId)
                    .gte("date", args.startDate)
                    .lte("date", args.endDate),
            )
            .collect();

        let totalApproaches = 0;
        let totalJobs = 0;

        for (const log of logs) {
            const approaches = await ctx.db
                .query("outreachEntries")
                .withIndex("by_dailyLogId", (q) => q.eq("dailyLogId", log._id))
                .collect();
            totalApproaches += approaches.length;

            const jobs = await ctx.db
                .query("completedJobs")
                .withIndex("by_dailyLogId", (q) => q.eq("dailyLogId", log._id))
                .collect();
            totalJobs += jobs.length;
        }

        const conversionRate =
            totalApproaches > 0 ? (totalJobs / totalApproaches) * 100 : 0;

        const weeklyStats = {
            totalRevenue,
            totalExpenses,
            netProfit,
            profitMargin,
            totalApproaches,
            totalJobs,
            conversionRate,
        };

        return { weeklyStats, userGoals };
    },
});

/**
 * Get data for the monthly growth chart.
 */
export const getMonthlyGrowthData = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const entries = await ctx.db
            .query("financialEntries")
            .withIndex("by_userId_type", (q) => q.eq("userId", identity.subject))
            .order("asc")
            .collect();

        // Aggregate data by month
        const monthlyData: Map<
            string,
            { month: string; revenue: number; expenses: number; profit: number }
        > = new Map();

        for (const entry of entries) {
            const month = format(parseISO(entry.date), "yyyy-MM");
            if (!monthlyData.has(month)) {
                monthlyData.set(month, {
                    month: format(parseISO(entry.date), "MMM yyyy"),
                    revenue: 0,
                    expenses: 0,
                    profit: 0,
                });
            }

            const data = monthlyData.get(month)!;
            if (entry.type === "revenue") {
                data.revenue += entry.amount;
            } else {
                data.expenses += entry.amount;
            }
            data.profit = data.revenue - data.expenses;
        }

        return Array.from(monthlyData.values());
    },
});

/**
 * Toggle a user's goal achievement status.
 */
export const toggleGoal = mutation({
    args: {
        goalId: v.id("userGoals"),
        isAchieved: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Auth check: Ensure the goal belongs to the user
        const goal = await ctx.db.get(args.goalId);
        if (!goal || goal.userId !== identity.subject) {
            throw new Error("Goal not found or unauthorized");
        }

        await ctx.db.patch(args.goalId, {
            isAchieved: args.isAchieved,
            achievedDate: args.isAchieved ? Date.now() : undefined,
        });
    },
});