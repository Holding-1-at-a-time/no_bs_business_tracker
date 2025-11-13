// file: convex/auth.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

// Verify Clerk webhook signature
const verifyClerkWebhook = async (request: Request, secret: string) => {
    const svixHeaders = {
        "svix-id": request.headers.get("svix-id")!,
        "svix-timestamp": request.headers.get("svix-timestamp")!,
        "svix-signature": request.headers.get("svix-signature")!,
    };
    
    const payload = await request.text();
    
    try {
        const webhook = new Webhook(secret);
        const evt = webhook.verify(payload, svixHeaders) as any;
        return evt;
    } catch (err) {
        console.error("Clerk webhook validation failed:", err);
        return null;
    }
};

// Clerk webhook handler
const handleClerkWebhook = httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error("CLERK_WEBHOOK_SECRET not configured");
        return new Response("Webhook secret not configured", { status: 500 });
    }

    const event = await verifyClerkWebhook(request, webhookSecret);
    if (!event) {
        return new Response("Invalid webhook signature", { status: 400 });
    }

    const { data, type } = event;

    switch (type) {
        case "user.created":
        case "user.updated":
            // Validate required data
            if (!data.id || !data.first_name || !data.last_name || !data.email_addresses?.[0]?.email_address) {
                console.error("Invalid user data in webhook:", data);
                return new Response("Invalid user data", { status: 400 });
            }

            // Check if user exists
            const user = await ctx.runQuery(internal.users.getUserByClerkId, {
                clerkId: data.id,
            });

            if (user && type === "user.updated") {
                // Update existing user
                await ctx.runMutation(internal.users.updateUser, {
                    clerkId: data.id,
                    name: `${data.first_name} ${data.last_name}`,
                    email: data.email_addresses[0].email_address,
                });
            } else if (!user && type === "user.created") {
                // Create new user
                const userId = await ctx.runMutation(internal.users.createUser, {
                    clerkId: data.id,
                    name: `${data.first_name} ${data.last_name}`,
                    email: data.email_addresses[0].email_address,
                });

                // Seed initial data for the new user
                await ctx.runMutation(internal.business.seedInitialData, { userId });
            }
            break;

        case "user.deleted":
            // TODO: Handle user deletion
            // We recommend marking as deleted rather than hard deleting
            // Or, start a workflow to clean up user data.
            console.log("User deletion event received for:", data.id);
            break;
    }

    return new Response(null, { status: 200 });
});

const http = httpRouter();
http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: handleClerkWebhook,
});

export default http;