// file: app/(app)/settings/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Suspense } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useUser, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { Doc, Id } from "../../../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// --- Business Info Form ---
const businessInfoSchema = z.object({
    businessName: z.string().min(1, "Business name is required"),
    dbaRegistrationDate: z.string().optional(),
    servicesOffered: z.string().optional(),
    pricingStructure: z.string().optional(),
    businessEmail: z.string().email().optional().or(z.literal("")),
    businessPhone: z.string().optional(),
    targetCustomer: z.string().optional(),
});
type BusinessInfoFormValues = z.infer<typeof businessInfoSchema>;

function BusinessInfoForm({
    defaultValues,
}: {
    defaultValues: Doc<"businessInfo">;
}) {
    const updateInfo = useMutation(api.business.updateBusinessInfo);
    const form = useForm<BusinessInfoFormValues>({
        resolver: zodResolver(businessInfoSchema),
        defaultValues: {
            ...defaultValues,
            dbaRegistrationDate: defaultValues.dbaRegistrationDate ?? "",
            servicesOffered: defaultValues.servicesOffered ?? "",
            pricingStructure: defaultValues.pricingStructure ?? "",
            businessEmail: defaultValues.businessEmail ?? "",
            businessPhone: defaultValues.businessPhone ?? "",
            targetCustomer: defaultValues.targetCustomer ?? "",
        },
    });

    async function onSubmit(values: BusinessInfoFormValues) {
        try {
            await updateInfo(values);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        }
    }        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Business Info Sheet</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="businessName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Add all other form fields */}
                        <FormField
                            control={form.control}
                            name="servicesOffered"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service(s) Offered</FormLabel>
                                    <FormControl><Textarea {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pricingStructure"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pricing Structure</FormLabel>
                                    <FormControl><Textarea {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Saving..." : "Save Business Info"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

// --- Goals Card ---
function GoalsCard({ goals }: { goals: Doc<"userGoals">[] }) {
    const toggleGoal = useMutation(api.dashboard.toggleGoal);

    const handleToggle = async (goalId: Id<"userGoals">, isAchieved: boolean) => {
        try {
            await toggleGoal({ goalId, isAchieved: !isAchieved });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Goals & Milestones Tracker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {goals
                    .sort((a, b) => (a.isAchieved ? 1 : -1))
                    .map((goal) => (
                        <div key={goal._id} className="flex items-center space-x-3">
                            <Checkbox
                                id={goal._id}
                                checked={goal.isAchieved}
                                onCheckedChange={() => handleToggle(goal._id, goal.isAchieved)}
                            />
                            <label
                                htmlFor={goal._id}
                                className={cn(
                                    "text-sm font-medium leading-none",
                                    goal.isAchieved
                                        ? "text-muted-foreground line-through"
                                        : "text-primary",
                                )}
                            >
                                {goal.goal}
                            </label>
                        </div>
                    ))}
            </CardContent>
        </Card>
    );
}

// --- Tools Card ---
function ToolsCard({ tools }: { tools: Doc<"userTools">[] }) {
    const toggleTool = useMutation(api.business.toggleTool);

    const handleToggle = async (toolId: Id<"userTools">, isSetUp: boolean) => {
        try {
            await toggleTool({ toolId, isSetUp: !isSetUp });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Free Tools Stack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {tools.map((tool) => (
                    <div key={tool._id} className="flex items-center space-x-3">
                        <Checkbox
                            id={tool._id}
                            checked={tool.isSetUp}
                            onCheckedChange={() => handleToggle(tool._id, tool.isSetUp)}
                        />
                        <label
                            htmlFor={tool._id}
                            className={cn(
                                "text-sm font-medium leading-none",
                                tool.isSetUp
                                    ? "text-muted-foreground line-through"
                                    : "",
                            )}
                        >
                            {tool.toolName}
                        </label>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

// --- Subscription Card ---
function ManageSubscriptionCard() {
    const { clerk } = useClerk();
    const { user } = useUser();
    const status = useQuery(api.billing.getSubscriptionStatus);

    const plan = status?.plan ?? "free";

    const handleManageSubscription = async () => {
        if (!clerk || !user) return;
        try {
            // FIX: Completed this function
            const portalUrl = await clerk.billing.createSubscriptionPortal({
                returnUrl: window.location.href,
            });
            window.location.href = portalUrl;
        } catch (err) {
            console.error("Failed to create subscription portal:", err);
            toast.error(err instanceof Error ? err.message : "Something went wrong");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Subscription</CardTitle>
                <CardDescription>
                    Your current plan:
                    <span className="font-bold uppercase ml-2 px-2 py-1 rounded bg-gray-100 text-gray-800">
                        {plan}
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleManageSubscription} disabled={!clerk || !user}>
                    {plan === "free" ? "Upgrade to Pro" : "Manage Subscription"}
                </Button>
            </CardContent>
        </Card>
    );
}

// --- Main Settings Page ---
function SettingsPage() {
    const businessInfo = useQuery(api.business.getBusinessInfo);
    const goals = useQuery(api.business.getGoals);
    const tools = useQuery(api.business.getTools);

    if (!businessInfo || !goals || !tools) {
        return <div>Loading settings...</div>; // TODO: Skeleton
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            <ManageSubscriptionCard />
            <BusinessInfoForm defaultValues={businessInfo} />
            <GoalsCard goals={goals} />
            <ToolsCard tools={tools} />
        </div>
    );
}

export default function SettingsPageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SettingsPage />
        </Suspense>
    );
}