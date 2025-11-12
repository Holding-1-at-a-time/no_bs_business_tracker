"use client";

import { ErrorBoundary } from "@/components/error-boundary";

/**
 * Root error boundary
 * Catches and handles errors across the entire application
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
