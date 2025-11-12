// file: convex/dailyLogs.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

/**
 * Get all log data for a specific date for the authenticated user.
 * Returns null if no log exists for that date.
 */
export const getForDate = query({
    args: { date: v.string() }, // YYYY-MM-DD
    handler: async (ctx, args): Promise<{
        log: Doc<"dailyLogs">;
        appointments: Doc<"appointments">[];
        outreach: Doc<"outreachEntries">[];
        jobs: Doc<"completedJobs">[];
    } | null> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const log = await ctx.db
            .query("dailyLogs")
            .withIndex("by_userId_date", (q) =>
                q.eq("userId", identity.subject).eq("date", args.date),
            )
            .unique();

        if (!log) return null;

        // Use the new, more secure index
        const appointments = await ctx.db
            .query("appointments")
            .withIndex("by_userId_logId", (q) =>
                q.eq("userId", identity.subject).eq("dailyLogId", log._id),
            )
            .collect();

        const outreach = await ctx.db
            .query("outreachEntries")
            .withIndex("by_userId_logId", (q) =>
                q.eq("userId", identity.subject).eq("dailyLogId", log._id),
            )
            .collect();

        const jobs = await ctx.db
            .query("completedJobs")
            .withIndex("by_userId_logId", (q) =>
                q.eq("userId", identity.subject).eq("dailyLogId", log._id),
            )
            .collect();

        return { log, appointments, outreach, jobs };
    },
});

/**
 * Create a new daily log for the authenticated user.
 */
export const create = mutation({
    args: {
        date: v.string(), // YYYY-MM-DD
        mainGoal: v.string(),
    },
    handler: async (ctx, args): Promise<Id<"dailyLogs">> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const existingLog = await ctx.db
            .query("dailyLogs")
            .withIndex("by_userId_date", (q) =>
                q.eq("userId", identity.subject).eq("date", args.date),
            )
            .unique();

        if (existingLog) return existingLog._id;

        return await ctx.db.insert("dailyLogs", {
            userId: identity.subject,
            date: args.date,
            mainGoal: args.mainGoal,
            revenueToday: 0,
            expensesToday: 0,
            failureData: { what: "", why: "", adjust: "" },
            tomorrowPriorities: ["", "", ""],
        });
    },
});

// --- NEW/UPDATED MUTATIONS ---

/**
 * Securely get a daily log, checking for user ownership.
 */
const getLogOrThrow = async (ctx: any, logId: Id<"dailyLogs">) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const log = await ctx.db.get(logId);
    if (!log) throw new Error("Log not found");
    if (log.userId !== identity.subject) throw new Error("Unauthorized");

    return log;
};

/**
 * Add a new appointment.
 */
export const addAppointment = mutation({
    args: {
        dailyLogId: v.id("dailyLogs"),
        time: v.string(),
        customer: v.string(),
        service: v.string(),
    },
    handler: async (ctx, args) => {
        const log = await getLogOrThrow(ctx, args.dailyLogId); // Auth Check
        return await ctx.db.insert("appointments", {
            userId: log.userId, // FIX: Populate userId
            ...args,
        });
    },
});

/**
 * Add a new outreach entry.
 */
export const addOutreach = mutation({
    args: {
        dailyLogId: v.id("dailyLogs"),
        time: v.string(),
        method: v.string(),
        person: v.string(),
        response: v.union(
            v.literal("Y"), v.literal("N"), v.literal("M"), v.literal(""),
        ),
        followUpNeeded: v.boolean(),
    },
    handler: async (ctx, args) => {
        const log = await getLogOrThrow(ctx, args.dailyLogId); // Auth Check
        return await ctx.db.insert("outreachEntries", {
            userId: log.userId, // FIX: Populate userId
            ...args,
        });
    },
});

/**
 * Add a new completed job and update the log's daily revenue.
 */
export const addCompletedJob = mutation({
    args: {
        dailyLogId: v.id("dailyLogs"),
        customer: v.string(),
        service: v.string(),
        amountCharged: v.number(),
        isPaid: v.boolean(),
        referralAsked: v.boolean(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const log = await getLogOrThrow(ctx, args.dailyLogId); // Auth Check

        const jobId = await ctx.db.insert("completedJobs", {
            userId: log.userId, // FIX: Populate userId
            ...args,
        });

        // Update daily revenue
        if (args.isPaid) {
            await ctx.db.patch(log._id, {
                revenueToday: log.revenueToday + args.amountCharged,
            });
        }
        return jobId;
    },
});

/**
 * Update the main details (goal, failure, priorities).
 */
export const updateLogDetails = mutation({
    args: {
        logId: v.id("dailyLogs"),
        mainGoal: v.optional(v.string()),
        failureData: v.optional(
            v.object({
                what: v.string(),
                why: v.string(),
                adjust: v.string(),
            }),
        ),
        tomorrowPriorities: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        await getLogOrThrow(ctx, args.logId); // Auth Check
        const { logId, ...patch } = args;
        await ctx.db.patch(logId, patch);
    },
});

/**
 * Update the daily expenses for a log.
 */
export const updateExpenses = mutation({
    args: {
        logId: v.id("dailyLogs"),
        expenses: v.number(),
    },
    handler: async (ctx, args) => {
        const log = await getLogOrThrow(ctx, args.logId); // Auth Check
        await ctx.db.patch(log._id, {
            expensesToday: args.expenses,
        });
    },
});