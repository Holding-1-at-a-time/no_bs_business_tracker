// file: convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import type { WebhookEvent } from "@clerk/clerk-sdk-node";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

// --- Clerk Auth Webhook ---
const handleClerkWebhook = httpAction(async (ctx, request) => {
    const event = await validateClerkRequest(request, "CLERK_WEBHOOK_SECRET");
    if (!event) {
        return new Response("Invalid request", { status: 400 });
    }

    switch (event.type) {
        case "user.created":
            // Create user and seed initial data atomically to prevent race conditions
            const email = event.data.email_addresses[0]?.email_address;
            await ctx.runMutation(internal.users.createUserWithData, {
                clerkId: event.data.id,
                name: `${event.data.first_name ?? ""} ${event.data.last_name ?? ""}`,
                email: email ?? "No Email",
            });
            break;

        case "user.updated":
            const updatedEmail = event.data.email_addresses[0]?.email_address;
            await ctx.runMutation(internal.users.updateUser, {
                clerkId: event.data.id,
                name: `${event.data.first_name ?? ""} ${event.data.last_name ?? ""}`,
                email: updatedEmail ?? "No Email",
            });
            break;

        case "user.deleted":
            // TODO: Handle user deletion
            // We recommend marking as deleted rather than hard deleting
            // Or, start a workflow to clean up user data.
            break;
    }
    return new Response(null, { status: 200 });
});

http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: handleClerkWebhook,
});

/**
 * Validates a Clerk webhook request.
 */
async function validateClerkRequest(
    request: Request,
    secretEnvVar: string,
): Promise<any | null> {
    const webhookSecret = process.env[secretEnvVar];
    if (!webhookSecret) {
        throw new Error(`${secretEnvVar} is not set`);
    }

    const payloadString = await request.text();
    const svixHeaders = {
        "svix-id": request.headers.get("svix-id")!,
        "svix-timestamp": request.headers.get("svix-timestamp")!,
        "svix-signature": request.headers.get("svix-signature")!,
    };

    const wh = new Webhook(webhookSecret);
    try {
        return wh.verify(payloadString, svixHeaders) as any;
    } catch (err) {
        // In production, use proper logging service
        if (process.env.NODE_ENV !== 'production') {
            console.error("Clerk webhook validation failed:", err);
        }
        return null;
    }
}

// --- Clerk Billing Webhook ---
const handleClerkBillingWebhook = httpAction(async (ctx, request) => {
    const event = await validateClerkRequest(request, "CLERK_BILLING_WEBHOOK_SECRET");
    if (!event) {
        return new Response("Invalid request", { status: 400 });
    }

    // Event types are based on Clerk Billing Beta docs
    switch (event.type) {
        case "subscription.created":
        case "subscription.updated":
            const planName = event.data.plan.name?.toLowerCase() ?? "free";
            await ctx.runMutation(internal.billing.updateSubscription, {
                clerkId: event.data.user_id,
                clerkSubscriptionId: event.data.id,
                plan: planName.includes("pro") ? "pro" : "free",
                endsAt: event.data.current_period_end * 1000, // s to ms
            });
            break;
        case "subscription.deleted":
            await ctx.runMutation(internal.billing.cancelSubscription, {
                clerkSubscriptionId: event.data.id,
            });
            break;
    }
    return new Response(null, { status: 200 });
});

http.route({
    path: "/clerk-billing-webhook",
    method: "POST",
    handler: handleClerkBillingWebhook,
});

export default http;
