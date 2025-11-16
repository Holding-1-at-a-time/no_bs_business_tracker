// file: convex.config.ts
import { defineApp } from "convex/server";
import workflow from "@convex-dev/workflow/convex.config.js";

const app = defineApp();

// Use the new, recommended registration syntax
app.use(workflow);

export default app;