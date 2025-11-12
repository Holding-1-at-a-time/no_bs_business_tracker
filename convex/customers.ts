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
        status: v.string(),
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

// TODO: Add Update/Delete mutations for all three tables,
// using the `getDocOrThrow` helper for auth checks.

export const deleteLead = mutation({
    args: { id: v.id("leads") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const lead = await ctx.db.get(args.id);
        if (!lead) throw new Error("Lead not found");

        if (lead.userId !== identity.subject) {
            throw new Error("Unauthorized");
        }

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