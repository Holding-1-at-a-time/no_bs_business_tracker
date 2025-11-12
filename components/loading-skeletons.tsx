import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton component for loading states
 */
function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
            aria-label="Loading..."
        />
    );
}

/**
 * Dashboard loading skeleton
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Page title skeleton */}
            <Skeleton className="h-12 w-64" />

            {/* Stats cards grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Chart skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-80 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Daily log loading skeleton
 */
export function DailyLogSkeleton() {
    return (
        <div className="space-y-6">
            {/* Page title and date picker */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-10 w-64" />
            </div>

            {/* Main content cards */}
            <div className="grid gap-6 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

/**
 * Pipeline loading skeleton
 */
export function PipelineSkeleton() {
    return (
        <div className="space-y-6">
            {/* Page title */}
            <Skeleton className="h-12 w-48" />

            {/* Tabs skeleton */}
            <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-24" />
                ))}
            </div>

            {/* Table skeleton */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-3">
                        {/* Table header */}
                        <div className="flex gap-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-4 w-24" />
                            ))}
                        </div>
                        {/* Table rows */}
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-4">
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <Skeleton key={j} className="h-8 w-24" />
                                ))}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Scripts page loading skeleton
 */
export function ScriptsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Page title */}
            <Skeleton className="h-12 w-64" />

            {/* Scripts section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-5 w-32" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Settings page loading skeleton
 */
export function SettingsSkeleton() {
    return (
        <div className="space-y-8">
            {/* Page title */}
            <Skeleton className="h-12 w-32" />

            {/* Settings cards */}
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Array.from({ length: 4 }).map((_, j) => (
                            <div key={j} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/**
 * Generic loading skeleton for general use
 */
export function GenericLoadingSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
        </div>
    );
}
