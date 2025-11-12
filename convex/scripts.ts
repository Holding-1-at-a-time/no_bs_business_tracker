// file: convex/scripts.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

const FREE_PLAN_SCRIPT_LIMIT = 3;
const FREE_PLAN_HANDLER_LIMIT = 5;

/**
 * Get all scripts and objection handlers for the user.
 */
export const getScriptsAndHandlers = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }
        const userId = identity.subject;

        const scripts = await ctx.db
            .query("scripts")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        const objectionHandlers = await ctx.db
            .query("objectionHandlers")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        // Also get the user's plan for gating
        const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", userId)).unique();

        return {
            scripts,
            objectionHandlers,
            plan: user?.plan ?? "free",
        };
    },
});

// --- Script Mutations ---

export const addScript = mutation({
    args: {
        title: v.string(),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
        if (!user) throw new Error("User not found");

        if (user.plan !== "pro") {
            const userScripts = await ctx.db
                .query("scripts")
                .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
                .collect();
            if (userScripts.length >= FREE_PLAN_SCRIPT_LIMIT) {
                throw new Error(`Upgrade to Pro to add more than ${FREE_PLAN_SCRIPT_LIMIT} scripts.`);
            }
        }

        return await ctx.db.insert("scripts", {
            userId: identity.subject,
            ...args,
        });
    },
});

export const updateScript = mutation({
    args: {
        scriptId: v.id("scripts"),
        title: v.string(),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const script = await ctx.db.get(args.scriptId);
        if (!script || script.userId !== identity.subject) {
            throw new Error("Script not found or unauthorized");
        }

        return await ctx.db.patch(args.scriptId, {
            title: args.title,
            content: args.content,
        });
    },
});

export const deleteScript = mutation({
    args: { scriptId: v.id("scripts") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const script = await ctx.db.get(args.scriptId);
        if (!script || script.userId !== identity.subject) {
            throw new Error("Script not found or unauthorized");
        }

        return await ctx.db.delete(args.scriptId);
    },
});

// --- Objection Handler Mutations ---

export const addObjectionHandler = mutation({
    args: {
        objection: v.string(),
        response: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
        if (!user) throw new Error("User not found");

        if (user.plan !== "pro") {
            const handlers = await ctx.db
                .query("objectionHandlers")
                .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
                .collect();
            if (handlers.length >= FREE_PLAN_HANDLER_LIMIT) {
                throw new Error(`Upgrade to Pro to add more than ${FREE_PLAN_HANDLER_LIMIT} objection handlers.`);
            }
        }

        return await ctx.db.insert("objectionHandlers", {
            userId: identity.subject,
            ...args,
        });
    },
});

export const updateObjectionHandler = mutation({
    args: {
        handlerId: v.id("objectionHandlers"),
        objection: v.string(),
        response: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const handler = await ctx.db.get(args.handlerId);
        if (!handler || handler.userId !== identity.subject) {
            throw new Error("Handler not found or unauthorized");
        }

        return await ctx.db.patch(args.handlerId, {
            objection: args.objection,
            response: args.response,
        });
    },
});

export const deleteObjectionHandler = mutation({
    args: { handlerId: v.id("objectionHandlers") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const handler = await ctx.db.get(args.handlerId);
        if (!handler || handler.userId !== identity.subject) {
            throw new Error("Handler not found or unauthorized");
        }

        return await ctx.db.delete(args.handlerId);
    },
});