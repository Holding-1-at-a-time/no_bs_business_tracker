"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Error boundary component for handling runtime errors gracefully
 * Place this as error.tsx in any app directory to catch errors in that route segment
 */
export function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to console (you can also send to monitoring service like Sentry)
        console.error("Error caught by boundary:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Something went wrong</CardTitle>
                    <CardDescription>
                        We encountered an unexpected error. Please try again.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {process.env.NODE_ENV === "development" && (
                        <div className="rounded-md bg-muted p-4">
                            <p className="text-sm font-mono text-muted-foreground break-words">
                                {error.message}
                            </p>
                            {error.digest && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Error ID: {error.digest}
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Button onClick={reset} className="flex-1">
                        Try again
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => (window.location.href = "/")}
                        className="flex-1"
                    >
                        Go home
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
