// file: convex/customers.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Securely get a doc, checking for user ownership.
 */
const getDocOrThrow = async (
    ctx: any,
    docId: Id<any>,
    userId: string,
) => {
    const doc = await ctx.db.get(docId);
    if (!doc) throw new Error("Document not found");
    if (doc.userId !== userId) throw new Error("Unauthorized");
    return doc;
};

/**
 * Get all pipeline data for the authenticated user.
 */
export const getPipeline = query({
    args: {},
    handler: async (ctx): Promise<{
        leads: Doc<"leads">[];
        followUps: Doc<"followUps">[];
        customers: Doc<"customers">[];
    } | null> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const userId = identity.subject;

        const leads = await ctx.db
            .query("leads")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        const followUps = await ctx.db
            .query("followUps")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        const customers = await ctx.db
            .query("customers")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        return { leads, followUps, customers };
    },
});

// --- LEAD MUTATIONS ---
export const addLead = mutation({
    args: {
        name: v.string(),
        contact: v.string(),
        serviceInterest: v.string(),
        source: v.string(),
        dateAdded: v.string(), // YYYY-MM-DD
        status: v.union(
            v.literal("New"),
            v.literal("Contacted"),
            v.literal("Interested"),
            v.literal("Lost")
        ),
        nextAction: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        return await ctx.db.insert("leads", {
            userId: identity.subject,
            ...args,
        });
    },
});

// --- FOLLOW-UP MUTATIONS ---
export const addFollowUp = mutation({
    args: {
        customerName: v.string(),
        lastContact: v.string(),
        reason: v.string(),
        followUpDate: v.string(),
        notes: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        return await ctx.db.insert("followUps", {
            userId: identity.subject,
            ...args,
        });
    },
});

// --- CUSTOMER MUTATIONS ---
export const addCustomer = mutation({
    args: {
        name: v.string(),
        contact: v.string(),
        firstJobDate: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        return await ctx.db.insert("customers", {
            userId: identity.subject,
            totalJobs: 1,
            totalRevenue: 0, // Will be updated by job entries
            referralsGiven: 0,
            lastJobDate: args.firstJobDate,
            ...args,
        });
    },
});

export const updateLead = mutation({
    args: {
        id: v.id("leads"),
        name: v.string(),
        contact: v.string(),
        serviceInterest: v.string(),
        source: v.string(),
        dateAdded: v.string(),
        status: v.union(
            v.literal("New"),
            v.literal("Contacted"),
            v.literal("Interested"),
            v.literal("Lost")
        ),
        nextAction: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        await getDocOrThrow(ctx, args.id, identity.subject);
        const { id, ...updateData } = args;
        await ctx.db.patch(id, updateData);
    },
});

export const updateFollowUp = mutation({
    args: {
        id: v.id("followUps"),
        customerName: v.string(),
        lastContact: v.string(),
        reason: v.string(),
        followUpDate: v.string(),
        notes: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        await getDocOrThrow(ctx, args.id, identity.subject);
        const { id, ...updateData } = args;
        await ctx.db.patch(id, updateData);
    },
});

export const updateCustomer = mutation({
    args: {
        id: v.id("customers"),
        name: v.string(),
        contact: v.string(),
        firstJobDate: v.string(),
        lastJobDate: v.string(),
        totalJobs: v.number(),
        totalRevenue: v.number(),
        referralsGiven: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        await getDocOrThrow(ctx, args.id, identity.subject);
        const { id, ...updateData } = args;
        await ctx.db.patch(id, updateData);
    },
});

export const deleteLead = mutation({
    args: { id: v.id("leads") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        await getDocOrThrow(ctx, args.id, identity.subject);
        await ctx.db.delete(args.id);
    },
});

export const deleteFollowUp = mutation({
    args: { id: v.id("followUps") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const followUp = await ctx.db.get(args.id);
        if (!followUp) throw new Error("Follow up not found");

        if (followUp.userId !== identity.subject) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});

export const deleteCustomer = mutation({
    args: { id: v.id("customers") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const customer = await ctx.db.get(args.id);
        if (!customer) throw new Error("Customer not found");

        if (customer.userId !== identity.subject) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});