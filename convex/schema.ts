// file: convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        tokenIdentifier: v.string(),
        clerkId: v.string(),
        email: v.string(), // Added for completeness

        // --- BILLING FIELDS ---
        plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
        subscriptionEndsAt: v.optional(v.int64()),
        clerkSubscriptionId: v.optional(v.string()),
    })
        .index("by_tokenIdentifier", ["tokenIdentifier"])
        .index("by_clerkId", ["clerkId"])
        .index("by_clerkSubscriptionId", ["clerkSubscriptionId"]),

    businessInfo: defineTable({
        userId: v.string(),
        businessName: v.string(),
        dbaRegistrationDate: v.optional(v.string()),
        servicesOffered: v.optional(v.string()),
        pricingStructure: v.optional(v.string()),
        businessEmail: v.optional(v.string()),
        businessPhone: v.optional(v.string()),
        targetCustomer: v.optional(v.string()),
    }).index("by_userId", ["userId"]),

    userGoals: defineTable({
        userId: v.string(),
        goal: v.string(),
        isAchieved: v.boolean(),
        achievedDate: v.optional(v.int64()),
    }).index("by_userId", ["userId"]),

    userTools: defineTable({
        userId: v.string(),
        toolName: v.string(),
        isSetUp: v.boolean(),
    }).index("by_userId", ["userId"]),

    dailyLogs: defineTable({
        userId: v.string(),
        date: v.string(), // YYYY-MM-DD
        mainGoal: v.string(),
        revenueToday: v.number(),
        expensesToday: v.number(),
        failureData: v.object({
            what: v.string(),
            why: v.string(),
            adjust: v.string(),
        }),
        tomorrowPriorities: v.array(v.string()),
    })
        .index("by_userId", ["userId"])
        .index("by_userId_date", ["userId", "date"]),

    // --- CHILD TABLES (SCHEMA FIX) ---
    // Added `userId` to all child tables for secure auth checks
    // and efficient querying.

    appointments: defineTable({
        dailyLogId: v.id("dailyLogs"),
        userId: v.string(), // FIX: Added userId
        time: v.string(),
        customer: v.string(),
        service: v.string(),
    })
        .index("by_dailyLogId", ["dailyLogId"])
        .index("by_userId_logId", ["userId", "dailyLogId"]), // FIX: New index

    outreachEntries: defineTable({
        dailyLogId: v.id("dailyLogs"),
        userId: v.string(), // FIX: Added userId
        time: v.string(),
        method: v.string(),
        person: v.string(),
        response: v.union(
            v.literal("Y"),
            v.literal("N"),
            v.literal("M"),
            v.literal(""),
        ),
        followUpNeeded: v.boolean(),
    })
        .index("by_dailyLogId", ["dailyLogId"])
        .index("by_userId_logId", ["userId", "dailyLogId"]), // FIX: New index

    completedJobs: defineTable({
        dailyLogId: v.id("dailyLogs"),
        userId: v.string(), // FIX: Added userId
        customer: v.string(),
        service: v.string(),
        amountCharged: v.number(),
        isPaid: v.boolean(),
        referralAsked: v.boolean(),
        notes: v.optional(v.string()),
    })
        .index("by_dailyLogId", ["dailyLogId"])
        .index("by_userId_logId", ["userId", "dailyLogId"]), // FIX: New index

    // --- PIPELINE TABLES ---
    leads: defineTable({
        userId: v.string(),
        name: v.string(),
        contact: v.string(),
        serviceInterest: v.string(),
        source: v.string(),
        dateAdded: v.string(), // YYYY-MM-DD
        status: v.string(),
        nextAction: v.string(),
    }).index("by_userId", ["userId"]),

    followUps: defineTable({
        userId: v.string(),
        customerName: v.string(),
        lastContact: v.string(), // YYYY-MM-DD
        reason: v.string(),
        followUpDate: v.string(), // YYYY-MM-DD
        notes: v.string(),
    }).index("by_userId", ["userId"]),

    customers: defineTable({
        userId: v.string(),
        name: v.string(),
        contact: v.string(),
        firstJobDate: v.string(), // YYYY-MM-DD
        lastJobDate: v.string(), // YYYY-MM-DD
        totalJobs: v.number(),
        totalRevenue: v.number(),
        referralsGiven: v.number(),
    }).index("by_userId", ["userId"]),

    // --- FINANCIALS & SCRIPTS ---
    financialEntries: defineTable({
        userId: v.string(),
        date: v.string(), // YYYY-MM-DD
        type: v.union(v.literal("revenue"), v.literal("expense")),
        amount: v.number(),
        category: v.optional(v.string()),
        notes: v.optional(v.string()),
    })
        .index("by_userId", ["userId"])
        .index("by_userId_date", ["userId", "date"])
        .index("by_userId_type", ["userId", "type"]),

    scripts: defineTable({
        userId: v.string(),
        title: v.string(),
        content: v.string(),
    }).index("by_userId", ["userId"]),

    objectionHandlers: defineTable({
        userId: v.string(),
        objection: v.string(),
        response: v.string(),
    }).index("by_userId", ["userId"]),
});