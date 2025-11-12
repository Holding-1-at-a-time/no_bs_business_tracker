// file: app/(app)/dashboard/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Suspense, useMemo } from "react";
import { format, subDays, startOfWeek } from "date-fns";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
};

// --- Goals Component ---
function GoalsCard({
    goals,
    className,
}: {
    goals: Doc<"userGoals">[];
    className?: string;
}) {
    const toggleGoal = useMutation(api.dashboard.toggleGoal);

    const handleToggle = async (goalId: Id<"userGoals">, isAchieved: boolean) => {
        try {
            await toggleGoal({ goalId, isAchieved: !isAchieved });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        }
    };

    // Memoize sorted goals to avoid re-sorting on every render
    const sortedGoals = useMemo(
        () => goals.sort((a, b) => (a.isAchieved ? 1 : -1)),
        [goals]
    );

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Goals & Milestones Tracker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {sortedGoals.map((goal) => (
                        <div
                            key={goal._id}
                            className="flex items-center space-x-3"
                        >
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

// --- Weekly Stats Component ---
function WeeklyStats({
    stats,
}: {
    stats: {
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        profitMargin: number;
        totalApproaches: number;
        totalJobs: number;
        conversionRate: number;
    };
}) {
    return (
        <>
            <Card>
                <CardHeader><CardTitle>Weekly Revenue</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Weekly Profit</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{formatCurrency(stats.netProfit)}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Total Approaches</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{stats.totalApproaches}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Total Jobs</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{stats.totalJobs}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Conversion Rate</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Profit Margin</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{stats.profitMargin.toFixed(1)}%</p></CardContent>
            </Card>
        </>
    );
}

// --- Growth Chart Component ---
function MonthlyGrowthChart({
    data,
}: {
    data: { month: string; revenue: number; expenses: number; profit: number }[];
}) {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
                <CardTitle>Monthly Growth</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(val) => formatCurrency(val)} />
                        <Tooltip
                            formatter={(val: number) => formatCurrency(val)}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="#22c55e" />
                        <Bar dataKey="expenses" fill="#ef4444" />
                        <Bar dataKey="profit" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

// --- Main Page Component ---
function DashboardPage() {
    const { user } = useUser();

    // Memoize date calculations to avoid recomputing on every render
    const { startDate, endDate } = useMemo(() => {
        const today = new Date();
        return {
            startDate: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
            endDate: format(today, "yyyy-MM-dd"),
        };
    }, []); // Empty deps - recalculate only on mount

    const dashboardData = useQuery(api.dashboard.getDashboardData, {
        startDate,
        endDate,
    });
    const growthData = useQuery(api.dashboard.getMonthlyGrowthData);

    if (dashboardData === undefined || growthData === undefined) {
        return <div>Loading dashboard...</div>; // TODO: Skeleton loader
    }

    if (dashboardData === null || growthData === null) {
        return <div>Error loading data.</div>;
    }

    const { weeklyStats, userGoals } = dashboardData;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">
                Welcome back, {user?.firstName ?? "Entrepreneur"}!
            </h1>

            <div className="space-y-4">
                <h2 className="text-2xl font-semibold">
                    This Week's Numbers ({startDate} to {endDate})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <WeeklyStats stats={weeklyStats} />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <MonthlyGrowthChart data={growthData} />
                <GoalsCard goals={userGoals} className="lg:col-span-1" />
            </div>
        </div>
    );
}

export default function DashboardPageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardPage />
        </Suspense>
    );
}