// file: convex/workflows.ts
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { workflow } from "./_deps"; // Import the manager from our new central file

/**
 * Defines the durable workflow for deleting all of a user's data.
 * This is triggered by the `user.deleted` webhook.
 */
export const deleteUserData = workflow.define({
    args: { clerkId: v.string() },
    handler: async (step, { clerkId }) => {
        console.log(`WORKFLOW: Starting data deletion for clerkId: ${clerkId}`);

        // Run all deletion steps in parallel.
        // Each step will now use the default 5-attempt retry policy.
        await Promise.all([
            // User table
            step.runMutation(internal.users.deleteUser, { clerkId }),

            // Business tables
            step.runMutation(internal.business.deleteUserBusinessInfo, { clerkId }),
            step.runMutation(internal.business.deleteUserGoals, { clerkId }),
            step.runMutation(internal.business.deleteUserTools, { clerkId }),

            // Daily Log tables
            step.runMutation(internal.dailyLogs.deleteUserLogs, { clerkId }),
            step.runMutation(internal.dailyLogs.deleteUserAppointments, { clerkId }),
            step.runMutation(internal.dailyLogs.deleteUserOutreach, { clerkId }),
            step.runMutation(internal.dailyLogs.deleteUserJobs, { clerkId }),

            // Customer tables
            step.runMutation(internal.customers.deleteUserLeads, { clerkId }),
            step.runMutation(internal.customers.deleteUserFollowUps, { clerkId }),
            step.runMutation(internal.customers.deleteUserCustomers, { clerkId }),

            // Financials table
            step.runMutation(internal.financials.deleteUserEntries, { clerkId }),

            // Scripts tables
            step.runMutation(internal.scripts.deleteUserScripts, { clerkId }),
            step.runMutation(internal.scripts.deleteUserHandlers, { clerkId }),
        ]);

        console.log(`WORKFLOW: Completed data deletion for clerkId: ${clerkId}`);
    },
});