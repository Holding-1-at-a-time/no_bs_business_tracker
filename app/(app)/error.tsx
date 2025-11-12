"use client";

import { ErrorBoundary } from "@/components/error-boundary";

/**
 * Error boundary for all authenticated app routes
 * Catches and handles errors in dashboard, log, pipeline, scripts, and settings pages
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return <ErrorBoundary error={error} reset={reset} />;
}
