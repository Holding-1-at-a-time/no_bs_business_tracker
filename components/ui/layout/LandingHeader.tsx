// file: components/layout/LandingHeader.tsx
"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
    const { isSignedIn } = useUser();

    return (
        <header className="w-full h-20 bg-white border-b sticky top-0 z-50">
            <div className="container mx-auto h-full flex items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                        No-BS Business Tracker
                    </span>
                </Link>
                <nav className="flex items-center gap-4">
                    {isSignedIn ? (
                        <>
                            <Button variant="outline" asChild>
                                <Link href="/dashboard">Dashboard</Link>
                            </Button>
                            <UserButton afterSignOutUrl="/" />
                        </>
                    ) : (
                        <>
                            <SignInButton mode="modal">
                                <Button variant="ghost">Log In</Button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <Button className="bg-primary hover:bg-primary/90">
                                    Sign Up Free
                                </Button>
                            </SignUpButton>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}