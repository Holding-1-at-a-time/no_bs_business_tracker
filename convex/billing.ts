// file: convex/billing.ts
import { v } from "convex/values";
import { internalMutation, query }instantiated / server";
import { Doc } from "./_generated/dataModel";

/**
 * Get the current user's subscription status.
 */
export const getSubscriptionStatus = query({
    args: {},
    handler: async (ctx): Promise<{
        plan: Doc<"users">["plan"];
        endsAt: Doc<"users">["subscriptionEndsAt"];
    } | null> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) {
            return null;
        }

        return {
            plan: user.plan,
            endsAt: user.subscriptionEndsAt,
        };
    },
});

/**
 * Internal mutation to update a user's subscription status.
 * This should ONLY be called by the Clerk Billing webhook.
 */
export const updateSubscription = internalMutation({
    args: {
        clerkId: v.string(),
        clerkSubscriptionId: v.string(),
        plan: v.string(),
        endsAt: v.number(), // Milliseconds
    },
    handler: async (ctx, { clerkId, clerkSubscriptionId, plan, endsAt }) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .unique();

        if (!user) {
            console.error(`User not found for clerkId: ${clerkId}`);
            return;
        }

        const planName = plan.toLowerCase() === "pro" ? "pro" : "free";

        await ctx.db.patch(user._id, {
            plan: planName,
            clerkSubscriptionId: clerkSubscriptionId,
            subscriptionEndsAt: endsAt,
        });
    },
});

/**
 * Internal mutation to cancel a user's subscription.
 * This should ONLY be called by the Clerk Billing webhook.
 */
export const cancelSubscription = internalMutation({
    args: {
        clerkSubscriptionId: v.string(),
    },
    handler: async (ctx, { clerkSubscriptionId }) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkSubscriptionId", (q) =>
                q.eq("clerkSubscriptionId", clerkSubscriptionId),
            )
            .unique();

        if (!user) {
            console.warn(
                `Subscription ${clerkSubscriptionId} not found, or user already deleted.`,
            );
            return;
        }

        await ctx.db.patch(user._id, {
            plan: "free",
            clerkSubscriptionId: undefined,
            subscriptionEndsAt: undefined,
        });
    },
});