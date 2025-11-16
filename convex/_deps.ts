// file: convex/_deps.ts
import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "./_generated/api";

/**
 * Centrally defines the WorkflowManager for the app.
 * We'll add a default retry policy for all workflows to
 * make them more resilient, as recommended by the documentation.
 */
export const workflow = new WorkflowManager(components.workflow, {
    defaultRetryBehavior: {
        maxAttempts: 5,
        initialBackoffMs: 500, // 0.5 seconds
    },
});