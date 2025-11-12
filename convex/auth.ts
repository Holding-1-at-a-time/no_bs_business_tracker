// file: convex/auth.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Clerk webhook handler
const handleClerkWebhook = httpAction(async (ctx, request) => {
    const event = await request.json(); // Simplified, add Clerk verification in prod
    const { data, type } = event;

    switch (type) {
        case "user.created":
        case "user.updated":
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
            // We recommend marking as deleted rather than hard deleting
            // Or, start a workflow to clean up user data.
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